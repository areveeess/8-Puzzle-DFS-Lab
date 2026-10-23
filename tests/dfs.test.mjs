import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { handleSearchRequest, solvePuzzle } from '../js/solver.mjs';

const goal = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const oneMoveStart = [1, 2, 3, 4, 8, 5, 7, 0, 6];
const oppositeParity = [2, 1, 3, 4, 5, 6, 7, 8, 0];
const exhaustiveGoal = [1, 2, 3, 4, 5, 6, 7, 8, 0];

test('the default and ordinary expansion limits are fixed and finite', () => {
  assert.equal(solvePuzzle(oneMoveStart, goal).status, 'found');
  for (const limit of [2_000, 10_000, 25_000]) {
    const result = handleSearchRequest({ runId: `limit-${limit}`, start: oneMoveStart, goal, limit });
    assert.notEqual(result.status, 'error');
  }
  assert.equal(handleSearchRequest({ runId: 'not-a-preset', start: oneMoveStart, goal, limit: 3_000 }).status, 'error');
});

test('a capped run preserves partial counters and does not pop beyond its limit', () => {
  const result = solvePuzzle(oneMoveStart, goal, 1);

  assert.equal(result.status, 'limit-reached');
  assert.equal(result.expanded, 1);
  assert.ok(result.generated > result.expanded);
  assert.equal(result.moves, null);
  assert.equal(result.moveCount, null);
  assert.equal(result.pathCost, null);
  assert.equal(result.approximateMemoryBytes, 64 * result.generated + 8 * 3);
});

test('malformed boards are rejected at the Worker boundary', () => {
  const result = handleSearchRequest({
    runId: 'bad-board',
    start: [1, 1, 3, 4, 5, 6, 7, 8, 0],
    goal,
    limit: 2_000,
  });

  assert.equal(result.status, 'error');
  assert.match(result.error, /tiles 0 through 8/);
});

test('the Worker exhausts an opposite-parity component below the 200,000 ceiling', () => {
  const result = handleSearchRequest({
    runId: 'exhaustive-demo',
    start: oppositeParity,
    goal: exhaustiveGoal,
    limit: 200_000,
  });

  assert.equal(result.runId, 'exhaustive-demo');
  assert.equal(result.status, 'exhausted');
  assert.equal(result.generated, 181_440);
  assert.equal(result.expanded, 181_440);
  assert.equal(result.moves, null);
  assert.equal(result.moveCount, null);
  assert.equal(result.pathCost, null);
  assert.equal(result.approximateMemoryBytes, 64 * 181_440);
});

test('the path cost of a found route equals its move count', () => {
  const result = solvePuzzle(oneMoveStart, goal);

  assert.equal(result.status, 'found');
  assert.equal(result.pathCost, result.moveCount);
  assert.equal(result.moveCount, 1);
  assert.ok(result.elapsedMs >= 0);
  assert.ok(result.maxDepth >= 1);
});

test('the page exposes finite expansion presets and a confirmed exhaustive path', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');

  assert.match(html, /<option value="2000" selected>/);
  assert.match(html, /<option value="10000">/);
  assert.match(html, /<option value="25000">/);
  assert.match(html, /id="exhaustive-button"/);
  assert.match(html, /id="cancel-exhaustive"/);
  assert.match(html, /up to 181,440 states/);
  assert.match(html, /200,000-expansion ceiling/);
  assert.match(main, /elements\.exhaustiveDialog\.showModal\(\)/);
  assert.match(main, /elements\.cancelExhaustive\.addEventListener\('click', \(\) => elements\.exhaustiveDialog\.close\(\)\)/);
  assert.match(main, /limit: EXHAUSTIVE_LIMIT, allowUnreachable: true/);
  assert.match(main, /start: \[\.\.\.boards\.start\], goal: \[\.\.\.boards\.goal\], limit/);
  assert.doesNotMatch(main, /innerHTML\s*=/);
});

test('the result contract includes every required metric and plain-language definition', () => {
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');

  for (const label of ['Generated', 'Expanded', 'Maximum depth', 'Elapsed search time', 'Path cost', 'Approximate memory']) {
    assert.ok(main.includes(`'${label}'`), `missing metric ${label}`);
  }
  assert.match(main, /Exhausted — no solution/);
  assert.match(main, /Limit reached — this search is incomplete/);
  assert.match(main, /DFS does not guarantee a shortest route/);
  assert.match(main, /JavaScript object\/container engine overhead and temporary arrays/);
});
