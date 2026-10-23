import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  analyzeBoardPair,
  getSuccessors,
  handleSearchRequest,
  solvePuzzle,
} from '../js/solver.mjs';

const goal = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const oneMoveStart = [1, 2, 3, 4, 8, 5, 7, 0, 6];
const oppositeParity = [2, 1, 3, 4, 5, 6, 7, 8, 0];

test('board validation checks exact tile permutations and goal-relative reachability', () => {
  assert.deepEqual(analyzeBoardPair(oneMoveStart, goal), {
    startValid: true,
    goalValid: true,
    reachable: true,
  });

  assert.deepEqual(analyzeBoardPair(oppositeParity, [1, 2, 3, 4, 5, 6, 7, 8, 0]), {
    startValid: true,
    goalValid: true,
    reachable: false,
  });

  const duplicate = analyzeBoardPair([1, 1, 3, 4, 5, 6, 7, 8, 0], goal);
  assert.equal(duplicate.startValid, false);
  assert.equal(duplicate.goalValid, true);
  assert.equal(duplicate.reachable, null);
});

test('legal successors use the deterministic Up, Right, Down, Left order', () => {
  assert.deepEqual(
    getSuccessors(oneMoveStart).map(({ move }) => move),
    ['Up', 'Right', 'Left'],
  );
});

test('DFS returns a zero-move route when start equals goal', () => {
  const result = solvePuzzle(goal, goal, 2_000);

  assert.equal(result.status, 'found');
  assert.deepEqual(result.moves, []);
  assert.equal(result.moveCount, 0);
  assert.equal(result.generated, 1);
  assert.equal(result.expanded, 0);
});

test('the first deterministic DFS branch solves the one-move demonstration', () => {
  const result = solvePuzzle(oneMoveStart, goal, 2_000);

  assert.equal(result.status, 'found');
  assert.deepEqual(result.moves, ['Up']);
  assert.equal(result.moveCount, 1);
  assert.equal(result.pathCost, 1);
});

test('the expansion ceiling stops before popping another state', () => {
  const result = solvePuzzle(oneMoveStart, goal, 1);

  assert.equal(result.status, 'limit-reached');
  assert.equal(result.expanded, 1);
  assert.ok(result.generated > 1);
  assert.equal(result.moveCount, null);
});

test('the worker request boundary accepts a valid but unreachable permutation', () => {
  const result = handleSearchRequest({
    runId: 'opposite-parity-demo',
    start: oppositeParity,
    goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
    limit: 2_000,
  });

  assert.equal(result.runId, 'opposite-parity-demo');
  assert.equal(result.status, 'limit-reached');
});

test('the browser worker posts the pure solver request result', () => {
  const workerSource = readFileSync(new URL('../js/search-worker.js', import.meta.url), 'utf8');

  assert.match(workerSource, /handleSearchRequest/);
  assert.match(workerSource, /self\.addEventListener\(['"]message['"]/);
  assert.match(workerSource, /self\.postMessage/);
});

test('the page loads the pinned Bootstrap and app stylesheets from local files', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bootstrap = readFileSync(new URL('../assets/css/bootstrap.min.css', import.meta.url), 'utf8');
  const license = readFileSync(new URL('../assets/css/bootstrap.LICENSE.txt', import.meta.url), 'utf8');

  assert.match(html, /href="assets\/css\/bootstrap\.min\.css"/);
  assert.match(html, /href="assets\/css\/app\.css"/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(bootstrap.slice(0, 100), /Bootstrap\s+v5\.3\.8/);
  assert.match(license, /The MIT License/);
  assert.match(license, /The Bootstrap Authors/);
});
