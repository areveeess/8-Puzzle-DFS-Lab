import { analyzeBoardPair, createScrambledBoard } from './solver.mjs';

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
};

let runSequence = 0;
let currentRunId = null;
let activeWorker = null;

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

  select.addEventListener('change', () => {
    boards[boardName][index] = Number(select.value);
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
  elements.exhaustiveActions.hidden = !(analysis.startValid && analysis.goalValid && analysis.reachable === false);
  elements.exhaustiveButton.disabled = !analysis.startValid || !analysis.goalValid || analysis.reachable !== false || Boolean(activeWorker);
}

function clearResult() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  currentRunId = null;
  elements.resultContent.replaceChildren();
  elements.resultPanel.hidden = true;
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
    for (const [index, move] of result.moves.entries()) {
      addText(moveList, 'li', `Move ${index + 1}: move the blank ${move.toLowerCase()}.`);
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
  currentRunId = runId;
  const worker = new Worker(new URL('./search-worker.js', import.meta.url), { type: 'module' });
  activeWorker = worker;
  elements.searchButton.disabled = true;
  elements.searchButton.textContent = 'Searching…';
  elements.resultPanel.hidden = false;
  elements.resultContent.replaceChildren();
  addText(elements.resultContent, 'p', 'DFS is exploring the reachable states…', 'result-explanation');

  worker.addEventListener('message', (event) => {
    if (event.data?.runId !== currentRunId) return;
    activeWorker = null;
    currentRunId = null;
    worker.terminate();
    showSearchResult(event.data);
    elements.searchButton.textContent = 'Run DFS search again';
    updateValidation();
  });

  worker.addEventListener('error', (event) => {
    if (runId !== currentRunId) return;
    activeWorker = null;
    currentRunId = null;
    worker.terminate();
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
