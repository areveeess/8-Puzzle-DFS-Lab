import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRouteStates,
  handleSearchRequest,
  solvePuzzle,
  validateSearchResult,
} from '../js/solver.mjs';

const goal = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const oneMoveStart = [1, 2, 3, 4, 8, 5, 7, 0, 6];

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
  assert.equal(validateSearchResult(result, 'one-move'), true);
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
  assert.equal(validateSearchResult({ ...valid, status: 'pending' }, 'valid'), false);
  assert.equal(validateSearchResult({ ...valid, trace: { ...valid.trace, events: [{ ...valid.trace.events[0], board: [1, 1, 3, 4, 5, 6, 7, 8, 0] }] } }, 'valid'), false);
  assert.equal(validateSearchResult({ ...valid, trace: { ...valid.trace, events: [{ ...valid.trace.events[0], type: '<img src=x>' }] } }, 'valid'), false);
});

