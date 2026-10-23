import {
  analyzeBoardPair,
  createRouteStates,
  createScrambledBoard,
  validateSearchResult,
} from './solver.mjs';
import { buildTraceInspectorModel } from './trace-model.mjs';

const DEFAULT_START = [1, 2, 3, 4, 8, 5, 7, 0, 6];
const DEFAULT_GOAL = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const EXHAUSTIVE_LIMIT = 200_000;

const boards = {
  start: [...DEFAULT_START],
  goal: [...DEFAULT_GOAL],
};

const elements = {
  startBoard: document.querySelector('#start-board'),
  goalBoard: document.querySelector('#goal-board'),
  startFeedback: document.querySelector('#start-feedback'),
  goalFeedback: document.querySelector('#goal-feedback'),
  reachabilityFeedback: document.querySelector('#reachability-feedback'),
  difficultySelect: document.querySelector('#difficulty-select'),
  generateButton: document.querySelector('#generate-button'),
  scrambleStatus: document.querySelector('#scramble-status'),
  searchLimit: document.querySelector('#search-limit'),
  searchButton: document.querySelector('#search-button'),
  exhaustiveActions: document.querySelector('#exhaustive-actions'),
  exhaustiveButton: document.querySelector('#exhaustive-button'),
  exhaustiveDialog: document.querySelector('#exhaustive-dialog'),
  cancelExhaustive: document.querySelector('#cancel-exhaustive'),
  confirmExhaustive: document.querySelector('#confirm-exhaustive'),
  resultPanel: document.querySelector('#result-panel'),
  resultContent: document.querySelector('#result-content'),
  traceStatus: document.querySelector('#trace-status'),
  traceEmpty: document.querySelector('#trace-empty'),
  traceContent: document.querySelector('#trace-content'),
};

let runSequence = 0;
let currentRunId = null;
let activeWorker = null;
let traceResult = null;
let traceStartBoard = null;
let traceGoalBoard = null;
let traceCursor = 0;
let selectedInspectorStateKey = null;
let routeStates = [];
let routeCursor = 0;

function createCellSelect(boardName, value, index) {
  const select = document.createElement('select');
  const readableBoard = boardName === 'start' ? 'Initial' : 'Goal';
  const row = Math.floor(index / 3) + 1;
  const column = (index % 3) + 1;

  select.className = 'form-select puzzle-cell';
  select.setAttribute('aria-label', `${readableBoard} row ${row}, column ${column}`);

  for (let tile = 1; tile <= 8; tile += 1) {
    const option = document.createElement('option');
    option.value = String(tile);
    option.textContent = String(tile);
    select.append(option);
  }

  const blankOption = document.createElement('option');
  blankOption.value = '0';
  blankOption.textContent = '\u00a0';
  blankOption.setAttribute('aria-label', 'Blank');
  select.append(blankOption);
  select.value = String(value);
  select.classList.toggle('is-blank', select.value === '0');

  select.addEventListener('change', () => {
    boards[boardName][index] = Number(select.value);
    select.classList.toggle('is-blank', select.value === '0');
    elements.scrambleStatus.textContent = '';
    clearResult();
    updateValidation();
  });

  return select;
}

function renderBoard(boardName, container) {
  const cells = boards[boardName].map((value, index) => createCellSelect(boardName, value, index));
  container.replaceChildren(...cells);
}

function getBoardError(board) {
  const counts = new Map();
  board.forEach((tile) => counts.set(tile, (counts.get(tile) ?? 0) + 1));

  const duplicates = [...counts].filter(([, count]) => count > 1).map(([tile]) => tile);
  const missing = Array.from({ length: 9 }, (_, tile) => tile).filter((tile) => !counts.has(tile));
  const namedTile = (tile) => tile === 0 ? 'blank' : String(tile);
  const details = [];

  if (duplicates.length > 0) details.push(`repeated ${duplicates.map(namedTile).join(', ')}`);
  if (missing.length > 0) details.push(`missing ${missing.map(namedTile).join(', ')}`);

  if (details.length === 0) return '';
  return `Use tiles 1–8 and one blank exactly once; ${details.join(' and ')}.`;
}

function setBoardFeedback(boardName, feedback, valid) {
  const error = valid ? '' : getBoardError(boards[boardName]);
  feedback.textContent = error;
  feedback.classList.toggle('is-error', Boolean(error));

  const container = boardName === 'start' ? elements.startBoard : elements.goalBoard;
  const counts = new Map();
  boards[boardName].forEach((tile) => counts.set(tile, (counts.get(tile) ?? 0) + 1));

  container.querySelectorAll('select').forEach((select, index) => {
    const repeated = (counts.get(boards[boardName][index]) ?? 0) > 1;
    select.classList.toggle('is-invalid', repeated);
    if (repeated) select.setAttribute('aria-invalid', 'true');
    else select.removeAttribute('aria-invalid');
  });
}

function updateValidation() {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  setBoardFeedback('start', elements.startFeedback, analysis.startValid);
  setBoardFeedback('goal', elements.goalFeedback, analysis.goalValid);

  if (!analysis.startValid || !analysis.goalValid) {
    elements.reachabilityFeedback.textContent = '';
    elements.reachabilityFeedback.classList.remove('is-error', 'is-valid');
  } else if (!analysis.reachable) {
    elements.reachabilityFeedback.textContent = 'These boards are valid, but the initial board cannot reach this goal. Their inversion parity differs.';
    elements.reachabilityFeedback.classList.add('is-error');
    elements.reachabilityFeedback.classList.remove('is-valid');
  } else {
    elements.reachabilityFeedback.textContent = 'Both boards are valid and the initial board can reach this goal.';
    elements.reachabilityFeedback.classList.add('is-valid');
    elements.reachabilityFeedback.classList.remove('is-error');
  }

  elements.searchButton.disabled = analysis.reachable !== true || Boolean(activeWorker);
  elements.generateButton.disabled = !analysis.goalValid;
  elements.difficultySelect.disabled = Boolean(activeWorker);
  elements.searchLimit.disabled = Boolean(activeWorker);
  elements.startBoard.querySelectorAll('select').forEach((select) => { select.disabled = Boolean(activeWorker); });
  elements.goalBoard.querySelectorAll('select').forEach((select) => { select.disabled = Boolean(activeWorker); });
  elements.generateButton.disabled = !analysis.goalValid || Boolean(activeWorker);
  elements.exhaustiveActions.hidden = !(analysis.startValid && analysis.goalValid && analysis.reachable === false);
  elements.exhaustiveButton.disabled = !analysis.startValid || !analysis.goalValid || analysis.reachable !== false || Boolean(activeWorker);
}

function resetTracePanel() {
  traceResult = null;
  traceStartBoard = null;
  traceGoalBoard = null;
  traceCursor = 0;
  selectedInspectorStateKey = null;
  routeStates = [];
  routeCursor = 0;
  elements.traceStatus.textContent = '';
  elements.traceEmpty.hidden = false;
  elements.traceContent.replaceChildren();
  elements.traceContent.hidden = true;
}

function clearResult() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  currentRunId = null;
  elements.resultContent.replaceChildren();
  elements.resultPanel.hidden = true;
  resetTracePanel();
  elements.searchButton.textContent = 'Run DFS search';
  if (elements.exhaustiveDialog.open) elements.exhaustiveDialog.close();
}

function addText(parent, tagName, text, className = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderBoardSnapshot(parent, board, label, extraClass = '') {
  const grid = document.createElement('div');
  grid.className = `trace-board ${extraClass}`.trim();
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', label);

  for (const tile of board) {
    const cell = document.createElement('span');
    cell.className = `trace-tile${tile === 0 ? ' is-blank' : ''}`;
    cell.textContent = tile === 0 ? '' : String(tile);
    if (tile === 0) cell.setAttribute('aria-label', 'Blank');
    grid.append(cell);
  }

  parent.append(grid);
  return grid;
}

function renderTraceContext(parent) {
  const context = document.createElement('div');
  context.className = 'trace-context-grid';
  const initial = document.createElement('section');
  initial.className = 'trace-context-board';
  addText(initial, 'h3', 'Initial board');
  renderBoardSnapshot(initial, traceStartBoard, 'Initial board');
  context.append(initial);

  const goal = document.createElement('section');
  goal.className = 'trace-context-board';
  addText(goal, 'h3', 'Goal board');
  renderBoardSnapshot(goal, traceGoalBoard, 'Goal board');
  context.append(goal);
  parent.append(context);
}

function getExpansionForEvent(event) {
  if (event.type === 'expand') return event;
  return traceResult.trace.events.find((candidate) => candidate.type === 'expand' && candidate.expansionId === event.expansionId);
}

function eventExplanation(event) {
  if (event.type === 'expand') return 'Expanded this state and checked its legal moves.';
  if (event.type === 'discover') return 'Added this new state to the frontier.';
  if (event.type === 'skip') return 'Skipped this state because DFS had already discovered it.';
  return 'Goal found. This is the route returned by DFS, not a shortest-path guarantee.';
}

function updateTracePanel() {
  const { events } = traceResult.trace;
  const event = events[traceCursor];
  const inspector = buildTraceInspectorModel(traceResult.trace, traceCursor, selectedInspectorStateKey);
  selectedInspectorStateKey = inspector.selected?.stateKey ?? null;
  const expansion = getExpansionForEvent(event);
  const expansionBoard = expansion?.board ?? event.board;
  const expansionDepth = expansion?.depth ?? event.depth;
  const expansionSuccessors = expansion?.successors ?? [];
  elements.traceStatus.textContent = `${inspector.traceNotice} Event ${formatCount(traceCursor + 1)} of ${formatCount(events.length)}: ${eventExplanation(event)}`;
  elements.traceContent.replaceChildren();
  renderTraceContext(elements.traceContent);

  const traceCard = document.createElement('section');
  traceCard.className = 'trace-event-card';
  traceCard.setAttribute('aria-labelledby', 'trace-event-heading');
  const toolbar = document.createElement('div');
  toolbar.className = 'trace-event-toolbar';
  addText(toolbar, 'h3', 'Selected DFS event', 'mb-0');
  addText(toolbar, 'span', `Event ${formatCount(traceCursor + 1)} of ${formatCount(events.length)}`, 'trace-event-index');
  traceCard.append(toolbar);

  const currentState = document.createElement('div');
  currentState.className = 'trace-anchor-grid';
  const expandedPanel = document.createElement('section');
  expandedPanel.className = 'trace-anchor';
  addText(expandedPanel, 'h4', expansion ? 'Expanded state' : 'Start already matches goal');
  renderBoardSnapshot(expandedPanel, expansionBoard, `${expansion ? 'Expanded state' : 'Goal state'} at depth ${expansionDepth}`);
  addText(expandedPanel, 'p', `Depth ${formatCount(expansionDepth)}`, 'trace-state-meta');
  currentState.append(expandedPanel);

  const eventPanel = document.createElement('section');
  eventPanel.className = `trace-event-explanation is-${event.type}`;
  addText(eventPanel, 'h4', event.type === 'expand' ? 'Expansion' : event.type === 'discover' ? 'State added' : event.type === 'skip' ? 'Previously discovered' : 'Goal discovery');
  addText(eventPanel, 'p', eventExplanation(event), 'trace-event-copy');
  if (event.type !== 'expand') {
    const transition = event.move ? ` · move blank ${event.move.toLowerCase()}` : '';
    addText(eventPanel, 'p', `State ${event.stateKey}${transition} · depth ${formatCount(event.depth)}`, 'trace-state-meta');
  }
  currentState.append(eventPanel);
  traceCard.append(currentState);

  const successors = document.createElement('section');
  successors.className = 'trace-successors';
  addText(successors, 'h4', 'Generated successors');
  if (expansionSuccessors.length === 0) {
    addText(successors, 'p', 'This state has no legal successors.', 'trace-empty-row');
  } else {
    const list = document.createElement('div');
    list.className = 'trace-successor-list';
    for (const successor of expansionSuccessors) {
      const item = document.createElement('article');
      const selected = event.type !== 'expand' && event.stateKey === successor.stateKey;
      const edgeKind = selected ? event.type : 'successor';
      item.className = `trace-successor is-${edgeKind}${selected ? ' is-selected' : ''}`;
      const status = selected && event.type === 'discover' ? 'Added to frontier'
        : selected && event.type === 'skip' ? 'Already discovered'
          : selected && event.type === 'goal' ? 'Goal discovered' : `Blank ${successor.move.toLowerCase()}`;
      addText(item, 'p', status, 'trace-successor-label');
      renderBoardSnapshot(item, successor.board, `${status}: ${successor.stateKey}`);
      list.append(item);
    }
    successors.append(list);
  }
  traceCard.append(successors);

  const controls = document.createElement('div');
  controls.className = 'trace-step-controls';
  const previous = document.createElement('button');
  previous.id = 'trace-previous-event';
  previous.type = 'button';
  previous.className = 'btn btn-outline-secondary';
  previous.textContent = 'Previous event';
  previous.disabled = traceCursor === 0;
  previous.addEventListener('click', () => {
    traceCursor = Math.max(0, traceCursor - 1);
    updateTracePanel();
    document.querySelector(traceCursor === 0 ? '#trace-next-event' : '#trace-previous-event')?.focus({ preventScroll: true });
  });
  const next = document.createElement('button');
  next.id = 'trace-next-event';
  next.type = 'button';
  next.className = 'btn btn-outline-secondary';
  next.textContent = 'Next event';
  next.disabled = traceCursor >= events.length - 1;
  next.addEventListener('click', () => {
    traceCursor = Math.min(events.length - 1, traceCursor + 1);
    updateTracePanel();
    document.querySelector(traceCursor >= events.length - 1 ? '#trace-previous-event' : '#trace-next-event')?.focus({ preventScroll: true });
  });
  controls.append(previous, next);
  traceCard.append(controls);
  elements.traceContent.append(traceCard);

  const inspectorGrid = document.createElement('div');
  inspectorGrid.className = 'trace-inspector-grid';
  for (const collection of [inspector.frontier, inspector.explored]) {
    const section = document.createElement('section');
    section.className = 'trace-preview-panel';
    addText(section, 'h3', collection.heading);
    addText(section, 'p', collection.ordering, 'trace-preview-ordering');
    addText(section, 'p', collection.rangeLabel, 'trace-preview-range');
    if (collection.rows.length === 0) {
      addText(section, 'p', 'No states in this collection at the selected event.', 'trace-empty-row');
    } else {
      const rows = document.createElement('ol');
      rows.className = 'trace-preview-rows';
      for (const row of collection.rows) {
        const listItem = document.createElement('li');
        const rowButton = document.createElement('button');
        rowButton.type = 'button';
        rowButton.id = `${collection.heading === 'Frontier preview' ? 'frontier' : 'explored'}-row-${row.stateKey}`;
        rowButton.className = `trace-preview-row${row.stateKey === selectedInspectorStateKey ? ' is-selected' : ''}`;
        rowButton.setAttribute('aria-pressed', String(row.stateKey === selectedInspectorStateKey));
        rowButton.textContent = `State ${row.stateKey} · depth ${formatCount(row.depth)} · parent ${row.parentKey ?? 'start state'}`;
        rowButton.addEventListener('click', () => {
          selectedInspectorStateKey = row.stateKey;
          updateTracePanel();
          document.querySelector(`#${rowButton.id}`)?.focus({ preventScroll: true });
        });
        listItem.append(rowButton);
        rows.append(listItem);
      }
      section.append(rows);
    }
    inspectorGrid.append(section);
  }
  elements.traceContent.append(inspectorGrid);

  const selectedDetails = document.createElement('section');
  selectedDetails.className = 'trace-selected-state';
  addText(selectedDetails, 'h3', 'Selected state details');
  if (inspector.selected) {
    renderBoardSnapshot(selectedDetails, inspector.selected.board, `Selected ${inspector.selected.collection} state ${inspector.selected.stateKey}`);
    const metadata = document.createElement('div');
    metadata.className = 'trace-selected-metadata';
    addText(metadata, 'p', `Depth ${formatCount(inspector.selected.depth)}`, 'trace-state-meta');
    addText(metadata, 'p', `Parent state: ${inspector.selected.parentKey ?? 'Start state'}`, 'trace-state-meta');
    selectedDetails.append(metadata);
  } else {
    addText(selectedDetails, 'p', 'Select a state from either preview to inspect its board, depth, and parent.', 'trace-empty-row');
  }
  elements.traceContent.append(selectedDetails);

  const routeSection = document.createElement('section');
  routeSection.className = 'route-playback';
  routeSection.setAttribute('aria-labelledby', 'route-playback-heading');
  addText(routeSection, 'h3', 'Solution route', 'route-playback-heading').id = 'route-playback-heading';
  addText(routeSection, 'p', 'DFS route found · this route is not presented as shortest.', 'route-status');
  const routeState = routeStates[routeCursor];
  renderBoardSnapshot(routeSection, routeState, `Route board ${routeCursor + 1} of ${routeStates.length}`);
  const moveLabel = routeCursor === 0 ? 'Start board' : `After move ${routeCursor}: move the blank ${traceResult.moves[routeCursor - 1].toLowerCase()}.`;
  addText(routeSection, 'p', moveLabel, 'route-step-label');
  const routeControls = document.createElement('div');
  routeControls.className = 'trace-step-controls';
  const routePrevious = document.createElement('button');
  routePrevious.id = 'route-previous-move';
  routePrevious.type = 'button';
  routePrevious.className = 'btn btn-outline-secondary';
  routePrevious.textContent = 'Previous move';
  routePrevious.disabled = routeCursor === 0;
  routePrevious.addEventListener('click', () => {
    routeCursor = Math.max(0, routeCursor - 1);
    updateTracePanel();
    document.querySelector(routeCursor === 0 ? '#route-next-move' : '#route-previous-move')?.focus({ preventScroll: true });
  });
  const routeNext = document.createElement('button');
  routeNext.id = 'route-next-move';
  routeNext.type = 'button';
  routeNext.className = 'btn btn-outline-primary';
  routeNext.textContent = 'Next move';
  routeNext.disabled = routeCursor >= routeStates.length - 1;
  routeNext.addEventListener('click', () => {
    routeCursor = Math.min(routeStates.length - 1, routeCursor + 1);
    updateTracePanel();
    document.querySelector(routeCursor >= routeStates.length - 1 ? '#route-previous-move' : '#route-next-move')?.focus({ preventScroll: true });
  });
  routeControls.append(routePrevious, routeNext);
  routeSection.append(routeControls);
  elements.traceContent.append(routeSection);
}

function showTraceError() {
  traceResult = null;
  elements.traceEmpty.hidden = true;
  elements.traceContent.hidden = false;
  elements.traceContent.replaceChildren();
  addText(elements.traceContent, 'p', 'The trace could not be shown. Run DFS again to create a new trace.', 'trace-error-copy');
  elements.traceStatus.textContent = 'Trace unavailable. You can rerun DFS.';
}

function showTraceLoading() {
  elements.traceEmpty.hidden = true;
  elements.traceContent.hidden = false;
  elements.traceContent.replaceChildren();
  addText(elements.traceContent, 'p', 'Searching…', 'result-outcome');
  elements.traceStatus.textContent = 'Searching…';
}

function showTraceResult(result, start, goal, expectedRunId) {
  if (!validateSearchResult(result, expectedRunId, { start, goal })) {
    showTraceError();
    return false;
  }
  if (result.status === 'error') {
    showTraceError();
    return true;
  }

  traceResult = result;
  traceStartBoard = [...start];
  traceGoalBoard = [...goal];
  traceCursor = 0;
  routeCursor = 0;
  routeStates = result.status === 'found' ? createRouteStates(start, result.moves) : [];
  if (result.status === 'found' && JSON.stringify(routeStates.at(-1)) !== JSON.stringify(goal)) {
    showTraceError();
    return false;
  }

  elements.traceEmpty.hidden = true;
  elements.traceContent.hidden = false;
  updateTracePanel();
  return true;
}

function formatCount(value) {
  return Number.isFinite(value) ? value.toLocaleString() : 'Unavailable';
}

function formatElapsedTime(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} ms` : 'Unavailable';
}

function formatApproximateMemory(value) {
  if (!Number.isFinite(value) || value < 0) return 'Unavailable';
  if (value < 1_024) return `about ${Math.round(value)} bytes`;
  return `about ${(value / 1_024).toFixed(1)} KiB`;
}

function addMetric(list, label, value, definition) {
  addText(list, 'dt', label);
  const description = document.createElement('dd');
  addText(description, 'span', value);
  addText(description, 'p', definition, 'metric-definition mb-0');
  list.append(description);
}

function addSearchStatistics(content, result) {
  const details = document.createElement('details');
  details.className = 'result-details statistics-details';
  addText(details, 'summary', 'Search statistics and definitions');
  const list = document.createElement('dl');
  list.className = 'statistics-grid';

  addMetric(list, 'Generated', formatCount(result.generated), 'The initial board plus every unique board when DFS discovers it for the first time.');
  addMetric(list, 'Expanded', formatCount(result.expanded), 'Non-goal boards whose legal successors were enumerated.');
  addMetric(list, 'Maximum depth', formatCount(result.maxDepth), 'The greatest depth among discovered boards, including boards still waiting on the frontier.');
  addMetric(list, 'Elapsed search time', formatElapsedTime(result.elapsedMs), 'Solver work after the Worker receives the request; excludes Worker startup and message transfer.');
  addMetric(list, 'Path cost', result.status === 'found' ? `${formatCount(result.pathCost)} moves` : 'Not applicable', 'The number of moves in the returned DFS route. No path cost is reported when no route is returned.');
  addMetric(list, 'Approximate memory', formatApproximateMemory(result.approximateMemoryBytes), 'Estimated as 64 bytes per generated board plus 8 bytes per frontier entry. This excludes JavaScript object/container engine overhead and temporary arrays.');

  details.append(list);
  content.append(details);
}

function showSearchResult(result) {
  const content = elements.resultContent;
  content.replaceChildren();

  if (result.status === 'found') {
    addText(content, 'p', 'DFS route found', 'result-outcome');
    addText(content, 'p', `Move count: ${result.moveCount}`, 'result-move-count');
    addText(content, 'p', 'This is the route DFS found. DFS does not guarantee a shortest route.', 'result-explanation');

    const routeDetails = document.createElement('details');
    routeDetails.className = 'result-details';
    addText(routeDetails, 'summary', 'Inspect the move sequence');
    const moveList = document.createElement('ol');
    moveList.className = 'route-list';
    if (result.moves.length === 0) addText(moveList, 'li', 'No moves needed; the initial board is already the goal.');
    else {
      for (const [index, move] of result.moves.entries()) {
        addText(moveList, 'li', `Move ${index + 1}: move the blank ${move.toLowerCase()}.`);
      }
    }
    routeDetails.append(moveList);
    content.append(routeDetails);
  } else if (result.status === 'exhausted') {
    addText(content, 'p', 'Exhausted — no solution', 'result-outcome');
    addText(content, 'p', 'DFS checked every state reachable from this start within its search component.', 'result-explanation');
  } else if (result.status === 'limit-reached') {
    addText(content, 'p', 'Limit reached — this search is incomplete.', 'result-outcome');
    addText(content, 'p', `DFS expanded ${formatCount(result.expanded)} states and generated ${formatCount(result.generated)} states before stopping. You can choose a higher limit and rerun from the beginning.`, 'result-explanation');
  } else {
    addText(content, 'p', 'Search could not start.', 'result-outcome');
    addText(content, 'p', result.error ?? 'The worker returned an unexpected result.', 'result-explanation');
  }

  if (result.status !== 'error') addSearchStatistics(content, result);

  elements.resultPanel.hidden = false;
}

function runSearch({ limit = Number(elements.searchLimit.value), allowUnreachable = false } = {}) {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  const isValidPair = analysis.startValid && analysis.goalValid;
  if (!isValidPair || activeWorker) return;
  if (!allowUnreachable && analysis.reachable !== true) return;
  if (allowUnreachable && (analysis.reachable !== false || limit !== EXHAUSTIVE_LIMIT)) return;

  clearResult();
  const runId = `dfs-${Date.now()}-${++runSequence}`;
  const runStart = [...boards.start];
  const runGoal = [...boards.goal];
  currentRunId = runId;
  const worker = new Worker(new URL('./search-worker.js', import.meta.url), { type: 'module' });
  activeWorker = worker;
  elements.searchButton.disabled = true;
  elements.searchButton.textContent = 'Searching…';
  elements.resultPanel.hidden = false;
  elements.resultContent.replaceChildren();
  addText(elements.resultContent, 'p', 'DFS is exploring the reachable states…', 'result-explanation');
  showTraceLoading();
  updateValidation();

  worker.addEventListener('message', (event) => {
    if (runId !== currentRunId) return;
    activeWorker = null;
    currentRunId = null;
    worker.terminate();
    const validResult = validateSearchResult(event.data, runId, { start: runStart, goal: runGoal });
    if (!validResult) {
      showTraceError();
      showSearchResult({ status: 'error', error: 'The Worker returned an invalid search result.' });
    } else {
      const traceShown = showTraceResult(event.data, runStart, runGoal, runId);
      showSearchResult(traceShown ? event.data : { status: 'error', error: 'The trace could not be shown. Run DFS again to create a new trace.' });
    }
    elements.searchButton.textContent = 'Run DFS search again';
    updateValidation();
  });

  worker.addEventListener('error', (event) => {
    if (runId !== currentRunId) return;
    activeWorker = null;
    currentRunId = null;
    worker.terminate();
    showTraceError();
    showSearchResult({ status: 'error', error: event.message });
    elements.searchButton.textContent = 'Run DFS search again';
    updateValidation();
  });

  worker.postMessage({ runId, start: [...boards.start], goal: [...boards.goal], limit });
}

function openExhaustiveConfirmation() {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  if (!analysis.startValid || !analysis.goalValid || analysis.reachable !== false || activeWorker) return;
  elements.exhaustiveDialog.showModal();
}

function confirmExhaustiveSearch() {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  elements.exhaustiveDialog.close();
  if (!analysis.startValid || !analysis.goalValid || analysis.reachable !== false) return;
  runSearch({ limit: EXHAUSTIVE_LIMIT, allowUnreachable: true });
}

function generateStart() {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  if (!analysis.goalValid) return;

  const difficulty = elements.difficultySelect.value;
  const { board, moves } = createScrambledBoard(boards.goal, difficulty);
  const name = difficulty[0].toUpperCase() + difficulty.slice(1);
  boards.start = board;
  clearResult();
  renderBoard('start', elements.startBoard);
  updateValidation();
  elements.scrambleStatus.textContent = `${name} start generated with ${moves.length} legal shuffle moves from the selected goal.`;
}

renderBoard('start', elements.startBoard);
renderBoard('goal', elements.goalBoard);
elements.searchButton.addEventListener('click', runSearch);
elements.generateButton.addEventListener('click', generateStart);
elements.searchLimit.addEventListener('change', clearResult);
elements.exhaustiveButton.addEventListener('click', openExhaustiveConfirmation);
elements.cancelExhaustive.addEventListener('click', () => elements.exhaustiveDialog.close());
elements.confirmExhaustive.addEventListener('click', confirmExhaustiveSearch);
updateValidation();
