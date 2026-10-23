export const MAX_PREVIEW_ROWS = 50;
export const TRACE_CHECKPOINT_INTERVAL = 128;
export const TRACE_HISTORY_NODE_LIMIT = 10_001;
const validatedTraces = new WeakSet();

function isCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function isHead(value, nodes, collection) {
  if (value === null) return true;
  return isCount(value) && value < nodes.length && nodes[value]?.collection === collection;
}

function checkpointAt(history, eventIndex) {
  return history.checkpoints.find((checkpoint) => checkpoint.eventIndex === eventIndex);
}

function sameCheckpoint(checkpoint, eventIndex, state) {
  return checkpoint
    && checkpoint.eventIndex === eventIndex
    && checkpoint.frontierHead === state.frontierHead
    && checkpoint.exploredHead === state.exploredHead
    && checkpoint.frontierTotal === state.frontierTotal
    && checkpoint.exploredTotal === state.exploredTotal;
}

function applyEvent(history, state, event, eventIndex) {
  const frontierDelta = event.frontierDelta;
  const exploredDelta = event.exploredDelta;

  if (frontierDelta?.type === 'pop') {
    const head = history.nodes[state.frontierHead];
    if (!head || head.collection !== 'frontier' || head.stateKey !== frontierDelta.stateKey || state.frontierTotal < 1) {
      throw new TypeError('Trace frontier pop does not match its current head.');
    }
    state.frontierHead = head.next;
    state.frontierTotal -= 1;
  } else if (frontierDelta?.type === 'push') {
    const node = history.nodes[frontierDelta.nodeId];
    if (!node || node.collection !== 'frontier' || node.stateKey !== frontierDelta.stateKey || node.next !== state.frontierHead) {
      throw new TypeError('Trace frontier push does not match its linked node.');
    }
    state.frontierHead = frontierDelta.nodeId;
    state.frontierTotal += 1;
  } else if (frontierDelta !== null) {
    throw new TypeError('Trace frontier delta has an unsupported operation.');
  }

  if (exploredDelta?.type === 'push') {
    const node = history.nodes[exploredDelta.nodeId];
    if (!node || node.collection !== 'explored' || node.stateKey !== exploredDelta.stateKey || node.next !== state.exploredHead) {
      throw new TypeError('Trace explored push does not match its linked node.');
    }
    state.exploredHead = exploredDelta.nodeId;
    state.exploredTotal += 1;
  } else if (exploredDelta !== null) {
    throw new TypeError('Trace explored delta has an unsupported operation.');
  }

  if (state.frontierTotal !== event.frontierTotal || state.exploredTotal !== event.exploredTotal) {
    throw new TypeError('Trace collection totals do not match the event deltas.');
  }

  const checkpoint = checkpointAt(history, eventIndex);
  if (checkpoint && !sameCheckpoint(checkpoint, eventIndex, state)) {
    throw new TypeError('Trace checkpoint does not match its event history.');
  }
}

/** Validate the compact collection history before a Worker result is rendered. */
export function validateTraceHistory(trace, startKey = null) {
  if (!trace || typeof trace !== 'object' || !Array.isArray(trace.events) || !trace.history || typeof trace.history !== 'object') return false;
  const { nodes, checkpoints } = trace.history;
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > Math.min(TRACE_HISTORY_NODE_LIMIT, trace.stored + 1)) return false;
  if (!Array.isArray(checkpoints) || checkpoints.length < 1) return false;

  const initial = nodes[0];
  if (!initial || initial.collection !== 'frontier' || !/^[0-8]{9}$/.test(initial.stateKey)
    || (startKey !== null && initial.stateKey !== startKey) || initial.depth !== 0 || initial.parentKey !== null || initial.next !== null) return false;
  if (!sameCheckpoint(checkpoints[0], -1, {
    frontierHead: 0,
    exploredHead: null,
    frontierTotal: 1,
    exploredTotal: 0,
  })) return false;

  for (let index = 0; index < checkpoints.length; index += 1) {
    const checkpoint = checkpoints[index];
    const expectedIndex = index === 0 ? -1 : index * TRACE_CHECKPOINT_INTERVAL - 1;
    if (!checkpoint || checkpoint.eventIndex !== expectedIndex || !isHead(checkpoint.frontierHead, nodes, 'frontier')
      || !isHead(checkpoint.exploredHead, nodes, 'explored') || !isCount(checkpoint.frontierTotal)
      || !isCount(checkpoint.exploredTotal)) return false;
  }

  let nextNodeId = 1;
  const state = { frontierHead: 0, exploredHead: null, frontierTotal: 1, exploredTotal: 0 };

  for (const [eventIndex, event] of trace.events.entries()) {
    if (!event || !Number.isSafeInteger(event.frontierTotal) || event.frontierTotal < 0
      || !Number.isSafeInteger(event.exploredTotal) || event.exploredTotal < 0) return false;

    const expectPush = (delta, collection, key, depth, parentKey) => {
      if (!delta || delta.type !== 'push' || delta.nodeId !== nextNodeId) return false;
      const node = nodes[nextNodeId];
      if (!node || node.collection !== collection || node.stateKey !== key || node.depth !== depth
        || node.parentKey !== parentKey || node.next !== (collection === 'frontier' ? state.frontierHead : state.exploredHead)) return false;
      nextNodeId += 1;
      return true;
    };

    if (event.type === 'expand') {
      if (event.frontierDelta?.type !== 'pop' || event.frontierDelta.stateKey !== event.stateKey
        || !expectPush(event.exploredDelta, 'explored', event.stateKey, event.depth, event.parentKey)) return false;
    } else if ((event.type === 'discover' || event.type === 'goal') && event.expansionId !== null) {
      if (!expectPush(event.frontierDelta, 'frontier', event.stateKey, event.depth, event.parentKey)
        || event.exploredDelta !== null) return false;
    } else if (event.type === 'skip' || event.type === 'goal') {
      if (event.frontierDelta !== null || event.exploredDelta !== null) return false;
    } else {
      return false;
    }

    try {
      applyEvent(trace.history, state, event, eventIndex);
    } catch {
      return false;
    }
  }

  if (nextNodeId !== nodes.length) return false;
  const expectedCheckpointCount = Math.floor(trace.stored / TRACE_CHECKPOINT_INTERVAL) + 1;
  if (checkpoints.length !== expectedCheckpointCount) return false;
  validatedTraces.add(trace);
  return true;
}

function collectRows(history, head, collection, total) {
  const rows = [];
  const visited = new Set();
  let nodeId = head;
  while (nodeId !== null && rows.length < MAX_PREVIEW_ROWS) {
    if (!isCount(nodeId) || nodeId >= history.nodes.length || visited.has(nodeId)) {
      throw new TypeError('Trace collection links are invalid.');
    }
    visited.add(nodeId);
    const node = history.nodes[nodeId];
    if (node?.collection !== collection || typeof node.stateKey !== 'string') {
      throw new TypeError('Trace collection node is invalid.');
    }
    rows.push({ stateKey: node.stateKey, depth: node.depth, parentKey: node.parentKey });
    nodeId = node.next;
  }
  if (rows.length > total) throw new TypeError('Trace preview exceeds its collection total.');
  return {
    total,
    from: total > 0 ? 1 : 0,
    to: Math.min(total, rows.length),
    rows,
  };
}

/** Reconstruct a selected event's bounded, correctly ordered collection previews. */
export function reconstructTracePreview(trace, eventIndex) {
  if (!Number.isSafeInteger(eventIndex) || eventIndex < 0 || eventIndex >= trace?.events?.length
    || (!validatedTraces.has(trace) && !validateTraceHistory(trace))) {
    throw new RangeError('Choose a valid stored DFS trace event.');
  }

  const { history } = trace;
  const checkpoint = [...history.checkpoints].reverse().find(({ eventIndex: position }) => position <= eventIndex);
  if (!checkpoint) throw new TypeError('Trace history has no checkpoint for the selected event.');

  const state = {
    frontierHead: checkpoint.frontierHead,
    exploredHead: checkpoint.exploredHead,
    frontierTotal: checkpoint.frontierTotal,
    exploredTotal: checkpoint.exploredTotal,
  };
  for (let index = checkpoint.eventIndex + 1; index <= eventIndex; index += 1) {
    applyEvent(history, state, trace.events[index], index);
  }

  return {
    frontier: collectRows(history, state.frontierHead, 'frontier', state.frontierTotal),
    explored: collectRows(history, state.exploredHead, 'explored', state.exploredTotal),
  };
}

function collectionDescriptor(name, ordering, preview) {
  const truncated = preview.total > preview.rows.length;
  const from = preview.from.toLocaleString();
  const to = preview.to.toLocaleString();
  const total = preview.total.toLocaleString();
  const rangeLabel = preview.total === 0
    ? 'No states; 0 total.'
    : truncated
      ? `Rows ${from}–${to} of ${total}; preview limited to ${MAX_PREVIEW_ROWS} states.`
      : `Rows ${from}–${to} of ${total}.`;

  return {
    heading: name,
    ordering,
    total: preview.total,
    from: preview.from,
    to: preview.to,
    rows: preview.rows,
    truncated,
    rangeLabel,
  };
}

/** Build view-ready inspector labels and the selected state's trusted details. */
export function buildTraceInspectorModel(trace, eventIndex, selectedStateKey = null) {
  const previews = reconstructTracePreview(trace, eventIndex);
  const frontier = collectionDescriptor('Frontier preview', 'Next-to-pop state first.', previews.frontier);
  const explored = collectionDescriptor('Explored preview', 'Most recently expanded state first.', previews.explored);
  const visibleRows = [
    ...frontier.rows.map((row) => ({ ...row, collection: 'frontier' })),
    ...explored.rows.map((row) => ({ ...row, collection: 'explored' })),
  ];
  const eventStateKey = trace.events[eventIndex].stateKey;
  const selected = visibleRows.find((row) => row.stateKey === selectedStateKey)
    ?? visibleRows.find((row) => row.stateKey === eventStateKey)
    ?? visibleRows[0]
    ?? null;

  return {
    frontier,
    explored,
    selected: selected ? {
      ...selected,
      board: [...selected.stateKey].map(Number),
    } : null,
    traceNotice: trace.complete
      ? `${trace.stored.toLocaleString()} DFS events recorded.`
      : `Displaying the first ${trace.stored.toLocaleString()} of ${trace.observed.toLocaleString()} DFS events; the trace is partial.`,
  };
}
