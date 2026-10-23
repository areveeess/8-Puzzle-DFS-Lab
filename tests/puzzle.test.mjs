import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeBoardPair, createScrambledBoard, getSuccessors } from '../js/solver.mjs';

const goal = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const expectedSteps = { easy: 8, medium: 24, hard: 48 };
const inverseMove = { Up: 'Down', Right: 'Left', Down: 'Up', Left: 'Right' };

function replayWalk(start, moves) {
  let board = [...start];
  for (const move of moves) {
    const successor = getSuccessors(board).find((candidate) => candidate.move === move);
    assert.ok(successor, `${move} is legal for ${board.join(',')}`);
    board = successor.board;
  }
  return board;
}

test('each difficulty is an exact legal walk from the currently selected goal', () => {
  for (const [difficulty, steps] of Object.entries(expectedSteps)) {
    const result = createScrambledBoard(goal, difficulty, () => 0.4);

    assert.equal(result.moves.length, steps);
    assert.deepEqual(replayWalk(goal, result.moves), result.board);
    assert.equal(analyzeBoardPair(result.board, goal).reachable, true);
    assert.equal(new Set(result.board).size, 9);
  }
});

test('scramble avoids directly undoing the previous move when alternatives exist', () => {
  const result = createScrambledBoard(goal, 'hard', () => 0.7);

  for (let index = 1; index < result.moves.length; index += 1) {
    const boardBeforeMove = replayWalk(goal, result.moves.slice(0, index));
    const legalMoves = getSuccessors(boardBeforeMove).map(({ move }) => move);
    const undo = inverseMove[result.moves[index - 1]];
    if (legalMoves.some((move) => move !== undo)) {
      assert.notEqual(result.moves[index], undo);
    }
  }
});

test('the injected random source makes a scramble repeatable', () => {
  const first = createScrambledBoard(goal, 'medium', () => 0.25);
  const second = createScrambledBoard(goal, 'medium', () => 0.25);

  assert.deepEqual(first, second);
});

test('the scramble origin can be a non-canonical goal', () => {
  const customGoal = [8, 1, 2, 4, 5, 3, 7, 0, 6];
  const result = createScrambledBoard(customGoal, 'easy', () => 0.1);

  assert.equal(result.moves.length, expectedSteps.easy);
  assert.deepEqual(replayWalk(customGoal, result.moves), result.board);
  assert.equal(analyzeBoardPair(result.board, customGoal).reachable, true);
});

test('unsupported difficulty presets are rejected', () => {
  assert.throws(() => createScrambledBoard(goal, 'expert'), /difficulty/i);
});
