import { analyzeBoardPair } from './solver.mjs';

const DEFAULT_START = [1, 2, 3, 4, 8, 5, 7, 0, 6];
const DEFAULT_GOAL = [1, 2, 3, 4, 0, 5, 7, 8, 6];
const EXPANSION_LIMIT = 2_000;

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
  searchButton: document.querySelector('#search-button'),
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
}

function addText(parent, tagName, text, className = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function showSearchResult(result) {
  const content = elements.resultContent;
  content.replaceChildren();

  if (result.status === 'found') {
    addText(content, 'p', 'DFS route found', 'result-outcome');
    addText(content, 'p', `Move count: ${result.moveCount}`, 'result-move-count');
    addText(content, 'p', 'This route is the one DFS found; DFS does not guarantee a shortest route.', 'result-explanation');

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
    addText(content, 'p', 'Search exhausted — no solution found.', 'result-outcome');
    addText(content, 'p', 'DFS checked every state reachable from this start within its search component.', 'result-explanation');
  } else if (result.status === 'limit-reached') {
    addText(content, 'p', 'Limit reached — this search is incomplete.', 'result-outcome');
    addText(content, 'p', `DFS expanded ${result.expanded.toLocaleString()} states and generated ${result.generated.toLocaleString()} states before stopping.`, 'result-explanation');
  } else {
    addText(content, 'p', 'Search could not start.', 'result-outcome');
    addText(content, 'p', result.error ?? 'The worker returned an unexpected result.', 'result-explanation');
  }

  elements.resultPanel.hidden = false;
}

function runSearch() {
  const analysis = analyzeBoardPair(boards.start, boards.goal);
  if (analysis.reachable !== true || activeWorker) return;

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

  worker.postMessage({ runId, start: [...boards.start], goal: [...boards.goal], limit: EXPANSION_LIMIT });
}

renderBoard('start', elements.startBoard);
renderBoard('goal', elements.goalBoard);
elements.searchButton.addEventListener('click', runSearch);
updateValidation();
