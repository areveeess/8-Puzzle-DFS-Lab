const TILE_COUNT = 9;
const VALID_TILES = new Set(Array.from({ length: TILE_COUNT }, (_, tile) => tile));
const MOVE_DIRECTIONS = [
  { move: 'Up', row: -1, column: 0 },
  { move: 'Right', row: 0, column: 1 },
  { move: 'Down', row: 1, column: 0 },
  { move: 'Left', row: 0, column: -1 },
];
const SCRAMBLE_STEPS = Object.freeze({ easy: 8, medium: 24, hard: 48 });
const INVERSE_MOVE = Object.freeze({ Up: 'Down', Right: 'Left', Down: 'Up', Left: 'Right' });

const boardKey = (board) => board.join('');

function isExactPermutation(board) {
  return Array.isArray(board)
    && board.length === TILE_COUNT
    && board.every((tile) => Number.isInteger(tile) && VALID_TILES.has(tile))
    && new Set(board).size === TILE_COUNT;
}

function inversionParity(values) {
  let inversions = 0;

  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      if (values[left] > values[right]) inversions += 1;
    }
  }

  return inversions % 2;
}

/** Check exact tile sets and reachability relative to the selected goal. */
export function analyzeBoardPair(start, goal) {
  const startValid = isExactPermutation(start);
  const goalValid = isExactPermutation(goal);

  if (!startValid || !goalValid) {
    return { startValid, goalValid, reachable: null };
  }

  const goalOrder = new Map(goal.filter((tile) => tile !== 0).map((tile, index) => [tile, index]));
  const rankedStart = start.filter((tile) => tile !== 0).map((tile) => goalOrder.get(tile));

  return {
    startValid,
    goalValid,
    reachable: inversionParity(rankedStart) === 0,
  };
}

/** Return legal blank moves in the project's stable Up, Right, Down, Left order. */
export function getSuccessors(board) {
  if (!isExactPermutation(board)) return [];

  const blankIndex = board.indexOf(0);
  const blankRow = Math.floor(blankIndex / 3);
  const blankColumn = blankIndex % 3;
  const successors = [];

  for (const direction of MOVE_DIRECTIONS) {
    const row = blankRow + direction.row;
    const column = blankColumn + direction.column;
    if (row < 0 || row >= 3 || column < 0 || column >= 3) continue;

    const nextBoard = [...board];
    const nextIndex = row * 3 + column;
    [nextBoard[blankIndex], nextBoard[nextIndex]] = [nextBoard[nextIndex], nextBoard[blankIndex]];
    successors.push({ move: direction.move, board: nextBoard });
  }

  return successors;
}

/** Make a goal-relative legal random walk, reporting its steps for explanation. */
export function createScrambledBoard(goal, difficulty = 'easy', random = Math.random) {
  if (!isExactPermutation(goal)) {
    throw new TypeError('The selected goal must contain the tiles 0 through 8 exactly once.');
  }
  const steps = SCRAMBLE_STEPS[difficulty];
  if (steps === undefined) {
    throw new RangeError('Choose an Easy, Medium, or Hard difficulty.');
  }
  if (typeof random !== 'function') {
    throw new TypeError('The random source must be a function.');
  }

  let board = [...goal];
  let previousMove = null;
  const moves = [];

  for (let step = 0; step < steps; step += 1) {
    const legal = getSuccessors(board);
    const reverseMove = previousMove === null ? null : INVERSE_MOVE[previousMove];
    const alternatives = legal.filter(({ move }) => move !== reverseMove);
    const choices = alternatives.length > 0 ? alternatives : legal;
    const randomValue = random();
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RangeError('The random source must return a value from 0 (inclusive) to 1 (exclusive).');
    }

    const selected = choices[Math.floor(randomValue * choices.length)];
    board = selected.board;
    previousMove = selected.move;
    moves.push(selected.move);
  }

  return { board, moves };
}

function reconstructMoves(parentByKey, goalKey) {
  const moves = [];
  let key = goalKey;

  while (parentByKey.get(key)?.parentKey !== null) {
    const record = parentByKey.get(key);
    moves.push(record.move);
    key = record.parentKey;
  }

  return moves.reverse();
}

function createResult(status, startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey = null) {
  const moves = status === 'found' ? reconstructMoves(parentByKey, goalKey) : null;

  return {
    status,
    moves,
    moveCount: moves?.length ?? null,
    generated,
    expanded,
    maxDepth,
    elapsedMs: performance.now() - startedAt,
    pathCost: moves?.length ?? null,
    approximateMemoryBytes: 64 * generated + 8 * frontier.length,
  };
}

/**
 * Run deterministic graph-search DFS. Valid opposite-parity boards are
 * accepted so the explicitly confirmed exhaustive demonstration can use the
 * same solver boundary as an ordinary search.
 */
export function solvePuzzle(start, goal, limit = 2_000) {
  if (!isExactPermutation(start) || !isExactPermutation(goal)) {
    throw new TypeError('Start and goal must each contain the tiles 0 through 8 exactly once.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError('The expansion limit must be a positive safe integer.');
  }

  const startedAt = performance.now();
  const startKey = boardKey(start);
  const goalKey = boardKey(goal);
  const frontier = [startKey];
  const parentByKey = new Map([[startKey, { parentKey: null, move: null, depth: 0 }]]);
  let generated = 1;
  let expanded = 0;
  let maxDepth = 0;

  if (startKey === goalKey) {
    return createResult('found', startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey);
  }

  while (frontier.length > 0) {
    if (expanded >= limit) {
      return createResult('limit-reached', startedAt, parentByKey, frontier, expanded, generated, maxDepth);
    }

    const currentKey = frontier.pop();
    if (currentKey === goalKey) {
      return createResult('found', startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey);
    }

    const currentBoard = Array.from(currentKey, Number);
    const currentDepth = parentByKey.get(currentKey).depth;
    expanded += 1;

    // Push in reverse so Up is the next state popped from the LIFO stack.
    const successors = getSuccessors(currentBoard);
    for (let index = successors.length - 1; index >= 0; index -= 1) {
      const { move, board } = successors[index];
      const nextKey = boardKey(board);
      if (parentByKey.has(nextKey)) continue;

      const depth = currentDepth + 1;
      parentByKey.set(nextKey, { parentKey: currentKey, move, depth });
      frontier.push(nextKey);
      generated += 1;
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return createResult('exhausted', startedAt, parentByKey, frontier, expanded, generated, maxDepth);
}

/** Validate and execute one structured request at the Worker boundary. */
export function handleSearchRequest(request) {
  const runId = request && typeof request === 'object' ? request.runId : undefined;

  if (typeof runId !== 'string' || runId.length === 0) {
    return { runId: runId ?? null, status: 'error', error: 'A run identifier is required.' };
  }
  if (!isExactPermutation(request.start) || !isExactPermutation(request.goal)) {
    return { runId, status: 'error', error: 'Start and goal must each contain the tiles 0 through 8 exactly once.' };
  }
  if (!Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 2_000) {
    return { runId, status: 'error', error: 'The initial search limit must be between 1 and 2,000.' };
  }

  try {
    return { runId, ...solvePuzzle(request.start, request.goal, request.limit) };
  } catch (error) {
    return { runId, status: 'error', error: error instanceof Error ? error.message : 'Search could not start.' };
  }
}
