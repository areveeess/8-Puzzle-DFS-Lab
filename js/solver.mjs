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
const WORKER_LIMITS = new Set([2_000, 10_000, 25_000, 200_000]);
export const TRACE_EVENT_LIMIT = 10_000;
const VALID_MOVES = new Set(MOVE_DIRECTIONS.map(({ move }) => move));
const VALID_EVENT_TYPES = new Set(['expand', 'discover', 'skip', 'goal']);

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

function createTraceCollector() {
  const events = [];
  let observed = 0;
  let expansionSequence = 0;

  return {
    events,
    nextExpansionId: () => expansionSequence++,
    record(event) {
      observed += 1;
      if (events.length < TRACE_EVENT_LIMIT) events.push(event);
    },
    summary() {
      const stored = events.length;
      const omitted = observed - stored;
      return { events, observed, stored, omitted, complete: omitted === 0 };
    },
  };
}

function createResult(status, startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey = null, traceCollector) {
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
    trace: traceCollector.summary(),
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
  const trace = createTraceCollector();

  if (startKey === goalKey) {
    trace.record({ type: 'goal', expansionId: null, stateKey: startKey, board: [...start], depth: 0, parentKey: null, move: null });
    return createResult('found', startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey, trace);
  }

  while (frontier.length > 0) {
    if (expanded >= limit) {
      return createResult('limit-reached', startedAt, parentByKey, frontier, expanded, generated, maxDepth, null, trace);
    }

    const currentKey = frontier.pop();
    if (currentKey === goalKey) {
      return createResult('found', startedAt, parentByKey, frontier, expanded, generated, maxDepth, goalKey, trace);
    }

    const currentBoard = Array.from(currentKey, Number);
    const currentDepth = parentByKey.get(currentKey).depth;
    expanded += 1;

    // Push in reverse so Up is the next state popped from the LIFO stack.
    const successors = getSuccessors(currentBoard);
    const expansionId = trace.nextExpansionId();
    trace.record({
      type: 'expand',
      expansionId,
      stateKey: currentKey,
      board: currentBoard,
      depth: currentDepth,
      parentKey: parentByKey.get(currentKey).parentKey,
      successors: successors.map(({ move, board }) => ({ move, stateKey: boardKey(board), board })),
    });

    for (let index = successors.length - 1; index >= 0; index -= 1) {
      const { move, board } = successors[index];
      const nextKey = boardKey(board);
      if (parentByKey.has(nextKey)) {
        trace.record({
          type: 'skip', expansionId, stateKey: nextKey, board, depth: currentDepth + 1,
          parentKey: currentKey, move,
        });
        continue;
      }

      const depth = currentDepth + 1;
      parentByKey.set(nextKey, { parentKey: currentKey, move, depth });
      frontier.push(nextKey);
      generated += 1;
      maxDepth = Math.max(maxDepth, depth);
      trace.record({
        type: nextKey === goalKey ? 'goal' : 'discover',
        expansionId,
        stateKey: nextKey,
        board,
        depth,
        parentKey: currentKey,
        move,
      });
    }
  }

  return createResult('exhausted', startedAt, parentByKey, frontier, expanded, generated, maxDepth, null, trace);
}

/** Reconstruct route board positions from the original board and returned DFS moves. */
export function createRouteStates(start, moves) {
  if (!isExactPermutation(start) || !Array.isArray(moves) || moves.some((move) => !VALID_MOVES.has(move))) {
    throw new TypeError('A route needs a valid start board and legal move names.');
  }

  const states = [[...start]];
  let current = [...start];
  for (const move of moves) {
    const next = getSuccessors(current).find((successor) => successor.move === move);
    if (!next) throw new TypeError(`The move ${move} is not legal for the current route board.`);
    current = next.board;
    states.push([...current]);
  }
  return states;
}

function isSafeCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function isValidEvent(event, expansionById) {
  if (!event || typeof event !== 'object' || !VALID_EVENT_TYPES.has(event.type)) return false;
  if (!isExactPermutation(event.board) || event.stateKey !== boardKey(event.board) || !isSafeCount(event.depth)) return false;
  if (event.parentKey !== null && (typeof event.parentKey !== 'string' || !/^[0-8]{9}$/.test(event.parentKey))) return false;
  if (event.move !== undefined && event.move !== null && !VALID_MOVES.has(event.move)) return false;

  if (event.type === 'goal' && event.expansionId === null && event.parentKey === null && event.move === null) {
    return event.depth === 0;
  }
  if (event.type === 'expand') {
    if (event.move !== undefined) return false;
    if (!isSafeCount(event.expansionId) || expansionById.has(event.expansionId)) return false;
    if (!Array.isArray(event.successors) || event.successors.length > 4) return false;
    const expected = getSuccessors(event.board);
    if (event.successors.length !== expected.length) return false;
    for (let index = 0; index < expected.length; index += 1) {
      const actual = event.successors[index];
      if (!actual || actual.move !== expected[index].move || !isExactPermutation(actual.board)) return false;
      if (actual.stateKey !== boardKey(actual.board) || actual.stateKey !== boardKey(expected[index].board)) return false;
    }
    expansionById.set(event.expansionId, event);
    return true;
  }

  if (!VALID_MOVES.has(event.move) || !isSafeCount(event.expansionId) || !expansionById.has(event.expansionId) || event.successors !== undefined) return false;
  const expansion = expansionById.get(event.expansionId);
  return event.parentKey === expansion.stateKey
    && event.depth === expansion.depth + 1
    && expansion.successors.some((successor) => successor.stateKey === event.stateKey
    && successor.move === event.move
    && boardKey(successor.board) === event.stateKey);
}

/** Validate Worker output before using any of its dynamic values in the DOM. */
export function validateSearchResult(result, expectedRunId) {
  if (!result || typeof result !== 'object' || Array.isArray(result) || result.runId !== expectedRunId) return false;
  if (!['found', 'limit-reached', 'exhausted', 'error'].includes(result.status)) return false;
  if (result.status === 'error') return typeof result.error === 'string';

  if (!isSafeCount(result.generated) || result.generated < 1
    || !isSafeCount(result.expanded) || !isSafeCount(result.maxDepth)
    || !Number.isFinite(result.elapsedMs) || result.elapsedMs < 0
    || !Number.isFinite(result.approximateMemoryBytes) || result.approximateMemoryBytes < 0) return false;

  if (result.status === 'found') {
    if (!Array.isArray(result.moves) || result.moves.some((move) => !VALID_MOVES.has(move))) return false;
    if (result.moveCount !== result.moves.length || result.pathCost !== result.moves.length) return false;
  } else if (result.moves !== null || result.moveCount !== null || result.pathCost !== null) {
    return false;
  }

  const trace = result.trace;
  if (!trace || typeof trace !== 'object' || !Array.isArray(trace.events) || trace.events.length > TRACE_EVENT_LIMIT
    || !isSafeCount(trace.observed) || !isSafeCount(trace.stored) || !isSafeCount(trace.omitted)
    || trace.stored !== trace.events.length || trace.observed !== trace.stored + trace.omitted
    || trace.complete !== (trace.omitted === 0)) return false;

  const expansionById = new Map();
  return trace.events.every((event) => isValidEvent(event, expansionById));
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
  if (!WORKER_LIMITS.has(request.limit)) {
    return { runId, status: 'error', error: 'Choose a supported finite expansion limit.' };
  }

  try {
    return { runId, ...solvePuzzle(request.start, request.goal, request.limit) };
  } catch (error) {
    return { runId, status: 'error', error: error instanceof Error ? error.message : 'Search could not start.' };
  }
}
