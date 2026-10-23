import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRouteStates,
  handleSearchRequest,
  solvePuzzle,
  TRACE_EVENT_LIMIT,
  validateSearchResult,
} from '../js/solver.mjs';
import {
  buildTraceInspectorModel,
  MAX_PREVIEW_ROWS,
  reconstructTracePreview,
} from '../js/trace-model.mjs';

const goal = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const oneMoveStart = [1, 2, 3, 4, 8, 5, 7, 0, 6];
const oppositeParity = [2, 1, 3, 4, 5, 6, 7, 8, 0];

test('a Worker result preserves solver fields and adds a bounded trace from the same run', () => {
  const result = handleSearchRequest({ runId: 'one-move', start: oneMoveStart, goal, limit: 2_000 });

  assert.equal(result.runId, 'one-move');
  assert.equal(result.status, 'found');
  assert.deepEqual(result.moves, ['Up']);
  assert.equal(result.moveCount, 1);
  assert.equal(result.pathCost, 1);
  assert.equal(result.expanded, 1);
  assert.equal(result.generated, 4);
  assert.ok(result.elapsedMs >= 0);
  assert.equal(result.trace.complete, true);
  assert.equal(result.trace.observed, result.trace.stored);
  assert.equal(result.trace.omitted, 0);
  assert.deepEqual(result.trace.events.map((event) => event.type), ['expand', 'discover', 'discover', 'goal']);
  assert.deepEqual(result.trace.events[0].successors.map(({ move }) => move), ['Up', 'Right', 'Left']);
  assert.equal(validateSearchResult(result, 'one-move', { start: oneMoveStart, goal }), true);
});

test('trace records cover actual DFS expansion, discovery, skip, and goal events in order', () => {
  const result = solvePuzzle([1, 2, 3, 4, 5, 6, 0, 7, 8], goal, 2_000);
  const types = result.trace.events.map((event) => event.type);

  assert.ok(types.includes('expand'));
  assert.ok(types.includes('discover'));
  assert.ok(types.includes('skip'));
  assert.ok(types.includes('goal'));
  assert.ok(types.indexOf('expand') < types.indexOf('discover'));
  assert.ok(types.indexOf('discover') < types.indexOf('goal'));
  for (const event of result.trace.events) {
    assert.equal(event.board.length, 9);
    assert.ok(Number.isSafeInteger(event.expansionId));
  }
});

test('a route sequence is derived from the original board and returned moves', () => {
  const result = handleSearchRequest({ runId: 'route', start: oneMoveStart, goal, limit: 2_000 });
  const routeStates = createRouteStates(oneMoveStart, result.moves);

  assert.deepEqual(routeStates, [oneMoveStart, goal]);
  assert.deepEqual(oneMoveStart, [1, 2, 3, 4, 8, 5, 7, 0, 6]);
  const traceCursor = 2;
  const routeCursor = 0;
  const steppedRouteCursor = routeCursor + 1;
  assert.equal(steppedRouteCursor, 1);
  assert.equal(traceCursor, 2);
  assert.deepEqual(routeStates[steppedRouteCursor], goal);
});

test('malformed Worker envelopes, boards, results, and events are rejected', () => {
  const requestError = handleSearchRequest({ runId: 'bad-board', start: [1, 1, 3, 4, 5, 6, 7, 8, 0], goal, limit: 2_000 });
  assert.equal(requestError.status, 'error');
  assert.equal(validateSearchResult({ runId: 'other', status: 'found' }, 'expected'), false);

  const valid = handleSearchRequest({ runId: 'valid', start: oneMoveStart, goal, limit: 2_000 });
  assert.equal(validateSearchResult({ ...valid, status: 'pending' }, 'valid', { start: oneMoveStart, goal }), false);
  assert.equal(validateSearchResult({ ...valid, trace: { ...valid.trace, events: [{ ...valid.trace.events[0], board: [1, 1, 3, 4, 5, 6, 7, 8, 0] }] } }, 'valid', { start: oneMoveStart, goal }), false);
  assert.equal(validateSearchResult({ ...valid, trace: { ...valid.trace, events: [{ ...valid.trace.events[0], type: '<img src=x>' }] } }, 'valid', { start: oneMoveStart, goal }), false);
  assert.equal(validateSearchResult({ ...valid, trace: { ...valid.trace, events: [], stored: 0, observed: 0 } }, 'valid', { start: oneMoveStart, goal }), false);
  const alteredHistory = structuredClone(valid);
  alteredHistory.trace.history.nodes[0].stateKey = '111111111';
  assert.equal(validateSearchResult(alteredHistory, 'valid', { start: oneMoveStart, goal }), false);
  const alteredTotals = structuredClone(valid);
  alteredTotals.trace.events[0].exploredTotal += 1;
  assert.equal(validateSearchResult(alteredTotals, 'valid', { start: oneMoveStart, goal }), false);
});

test('the event cap reports a partial trace without changing exhaustive solver status or counters', () => {
  const result = handleSearchRequest({
    runId: 'capped-trace',
    start: oppositeParity,
    goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
    limit: 200_000,
  });

  assert.equal(result.status, 'exhausted');
  assert.equal(result.expanded, 181_440);
  assert.equal(result.generated, 181_440);
  assert.equal(result.trace.stored, TRACE_EVENT_LIMIT);
  assert.equal(result.trace.observed, result.trace.stored + result.trace.omitted);
  assert.ok(result.trace.omitted > 0);
  assert.equal(result.trace.complete, false);
  assert.equal(buildTraceInspectorModel(result.trace, 0).traceNotice, `Displaying the first ${TRACE_EVENT_LIMIT.toLocaleString()} of ${result.trace.observed.toLocaleString()} DFS events; the trace is partial.`);
});

test('each event reconstructs exact frontier and explored collections at that moment', () => {
  const result = handleSearchRequest({ runId: 'collection-history', start: oneMoveStart, goal, limit: 2_000 });
  const expectedFrontiers = [[], ['123485076'], ['123485760', '123485076'], ['123405786', '123485760', '123485076']];
  const expectedExplored = [['123485706'], ['123485706'], ['123485706'], ['123485706']];

  result.trace.events.forEach((event, index) => {
    const preview = reconstructTracePreview(result.trace, index);
    assert.equal(event.frontierTotal, expectedFrontiers[index].length);
    assert.equal(event.exploredTotal, expectedExplored[index].length);
    assert.deepEqual(preview.frontier.rows.map((row) => row.stateKey), expectedFrontiers[index]);
    assert.deepEqual(preview.explored.rows.map((row) => row.stateKey), expectedExplored[index]);
  });
});

test('frontier promotion and explored ordering are exact across a checkpoint boundary', () => {
  const start = [1, 2, 3, 4, 5, 6, 0, 7, 8];
  const result = solvePuzzle(start, goal, 2_000);
  let promotedFrontierRow = false;

  for (let index = 0; index < result.trace.events.length; index += 1) {
    const event = result.trace.events[index];
    const preview = reconstructTracePreview(result.trace, index);
    assert.equal(preview.frontier.total, event.frontierTotal);
    assert.equal(preview.explored.total, event.exploredTotal);
    assert.ok(preview.frontier.rows.length <= MAX_PREVIEW_ROWS);
    assert.ok(preview.explored.rows.length <= MAX_PREVIEW_ROWS);
    assert.equal(preview.frontier.from, event.frontierTotal > 0 ? 1 : 0);
    assert.equal(preview.frontier.to, Math.min(event.frontierTotal, MAX_PREVIEW_ROWS));
    assert.equal(preview.explored.from, event.exploredTotal > 0 ? 1 : 0);
    assert.equal(preview.explored.to, Math.min(event.exploredTotal, MAX_PREVIEW_ROWS));

    if (event.type !== 'expand' || index === 0) continue;
    const before = reconstructTracePreview(result.trace, index - 1).frontier.rows;
    if (before.length > 1 && before[0].stateKey === event.stateKey) {
      assert.equal(preview.frontier.rows[0].stateKey, before[1].stateKey);
      assert.equal(preview.explored.rows[0].stateKey, event.stateKey);
      promotedFrontierRow = true;
    }
  }
  assert.ok(result.trace.history.checkpoints.some(({ eventIndex }) => eventIndex >= 128));
  assert.ok(promotedFrontierRow);
});

test('a trace cap preserves a separately limit-reached solver outcome', () => {
  const completeSmall = solvePuzzle(oneMoveStart, goal, 1);
  assert.equal(completeSmall.status, 'limit-reached');
  assert.equal(completeSmall.trace.complete, true);

  const cappedRun = solvePuzzle(oppositeParity, [1, 2, 3, 4, 5, 6, 7, 8, 0], 100_000);
  assert.equal(cappedRun.status, 'limit-reached');
  assert.equal(cappedRun.expanded, 100_000);
  assert.equal(cappedRun.trace.stored, TRACE_EVENT_LIMIT);
  assert.equal(cappedRun.trace.complete, false);
  assert.equal(cappedRun.status, 'limit-reached');
  assert.match(buildTraceInspectorModel(cappedRun.trace, 0).traceNotice, /trace is partial/);
});

test('inspector metadata names exact totals, visible ranges, ordering, and truncation', () => {
  const small = handleSearchRequest({ runId: 'inspector-small', start: oneMoveStart, goal, limit: 2_000 });
  const smallView = buildTraceInspectorModel(small.trace, small.trace.stored - 1);
  assert.equal(smallView.frontier.heading, 'Frontier preview');
  assert.equal(smallView.frontier.ordering, 'Next-to-pop state first.');
  assert.equal(smallView.frontier.rangeLabel, 'Rows 1–3 of 3.');
  assert.equal(smallView.frontier.rows[0].stateKey, goal.join(''));
  assert.equal(smallView.explored.heading, 'Explored preview');
  assert.equal(smallView.explored.ordering, 'Most recently expanded state first.');
  assert.equal(smallView.explored.rows[0].stateKey, oneMoveStart.join(''));

  const large = solvePuzzle([1, 2, 3, 4, 5, 6, 0, 7, 8], goal, 2_000);
  const largeView = buildTraceInspectorModel(large.trace, large.trace.stored - 1);
  assert.ok(largeView.explored.total > MAX_PREVIEW_ROWS);
  assert.equal(largeView.explored.rows.length, MAX_PREVIEW_ROWS);
  assert.equal(largeView.explored.rangeLabel, `Rows 1–50 of ${largeView.explored.total}; preview limited to 50 states.`);
});

test('selected inspector rows expose their exact board, depth, and parent', () => {
  const result = solvePuzzle([1, 2, 3, 4, 5, 6, 0, 7, 8], goal, 2_000);
  const preview = reconstructTracePreview(result.trace, 8);
  const target = preview.frontier.rows[0] ?? preview.explored.rows[0];
  const view = buildTraceInspectorModel(result.trace, 8, target.stateKey);

  assert.equal(view.selected.stateKey, target.stateKey);
  assert.deepEqual(view.selected.board, [...target.stateKey].map(Number));
  assert.equal(view.selected.depth, target.depth);
  assert.equal(view.selected.parentKey, target.parentKey);
});

