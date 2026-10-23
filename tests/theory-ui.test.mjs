import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const formulationHtml = readFileSync(new URL('../formulation.html', import.meta.url), 'utf8');
const algorithmHtml = readFileSync(new URL('../algorithm.html', import.meta.url), 'utf8');
const comparisonHtml = readFileSync(new URL('../comparison.html', import.meta.url), 'utf8');

test('homepage header includes course, title, student name, register number, and multi-page navigation', () => {
  // Course and Assignment metadata
  assert.match(indexHtml, /Artificial Intelligence/);
  assert.match(indexHtml, /Interactive 8-Puzzle Problem Solver using AI Search Algorithms/);
  assert.match(indexHtml, /Raj Vardhan Singh/);
  assert.match(indexHtml, /24BDS0200/);

  // Multi-page navigation menu linking to dedicated pages
  assert.match(indexHtml, /href="index\.html"/);
  assert.match(indexHtml, /href="formulation\.html"/);
  assert.match(indexHtml, /href="algorithm\.html"/);
  assert.match(indexHtml, /href="comparison\.html"/);

  // Active pill set on interactive solver
  assert.match(indexHtml, /class="nav-pill is-active"/);

  // Exploration module cards point to dedicated pages
  assert.match(indexHtml, /Open Problem Formulation/);
  assert.match(indexHtml, /Open Algorithm Information/);
  assert.match(indexHtml, /Open Comparison &amp; Benchmark/);

  // Website does not contain video presentation mentions
  assert.doesNotMatch(indexHtml, /video/i);
});

test('formulation.html covers 8-puzzle state space, reachability invariants, and inversion proof', () => {
  // Student identity and navigation
  assert.match(formulationHtml, /Raj Vardhan Singh/);
  assert.match(formulationHtml, /24BDS0200/);
  assert.match(formulationHtml, /href="formulation\.html" class="nav-pill is-active"/);

  // State space size and reachable component
  assert.match(formulationHtml, /362,880/);
  assert.match(formulationHtml, /181,440/);
  assert.match(formulationHtml, /inversion parity/i);
  assert.match(formulationHtml, /blank/i);

  // Operators and formulation elements
  assert.match(formulationHtml, /Up/);
  assert.match(formulationHtml, /Right/);
  assert.match(formulationHtml, /Down/);
  assert.match(formulationHtml, /Left/);
  assert.match(formulationHtml, /Goal Test/i);
  assert.match(formulationHtml, /Path Cost/i);

  // Invariance mathematical proof
  assert.match(formulationHtml, /Inversion Parity Invariance Principle/);

  // No video mentions
  assert.doesNotMatch(formulationHtml, /video/i);
});

test('algorithm.html covers all 8 criteria for Depth First Search and pseudocode', () => {
  // Student identity and navigation
  assert.match(algorithmHtml, /Raj Vardhan Singh/);
  assert.match(algorithmHtml, /24BDS0200/);
  assert.match(algorithmHtml, /href="algorithm\.html" class="nav-pill is-active"/);

  // 1. Description
  assert.match(algorithmHtml, /Depth First Search/i);
  // 2. Working Principle
  assert.match(algorithmHtml, /LIFO/i);
  assert.match(algorithmHtml, /stack/i);
  assert.match(algorithmHtml, /backtrack/i);
  // 3. Deterministic Successor Order
  assert.match(algorithmHtml, /Up,\s*Right,\s*Down,\s*Left/);
  // 4. Advantages
  assert.match(algorithmHtml, /advantage/i);
  // 5. Limitations
  assert.match(algorithmHtml, /limitation/i);
  // 6. Complexity Analysis
  assert.match(algorithmHtml, /b\^?m/);
  assert.match(algorithmHtml, /bm/);
  // 7. Completeness
  assert.match(algorithmHtml, /complete/i);
  // 8. Optimality
  assert.match(algorithmHtml, /optimal/i);

  // Pseudocode present
  assert.match(algorithmHtml, /GraphDFS/);
  assert.match(algorithmHtml, /visited/);

  // No video mentions
  assert.doesNotMatch(algorithmHtml, /video/i);
});

test('comparison.html covers benchmark example instance and all six search algorithms', () => {
  // Student identity and navigation
  assert.match(comparisonHtml, /Raj Vardhan Singh/);
  assert.match(comparisonHtml, /24BDS0200/);
  assert.match(comparisonHtml, /href="comparison\.html" class="nav-pill is-active"/);

  // Benchmark Example Puzzle Instance from Assignment Specification
  assert.match(comparisonHtml, /Benchmark Puzzle Instance/);
  assert.match(comparisonHtml, /Initial State/);
  assert.match(comparisonHtml, /Goal State/);
  assert.match(comparisonHtml, /aria-label="Example initial state: 2, 8, 3, 1, 6, 4, 7, blank, 5"/);
  assert.match(comparisonHtml, /aria-label="Example goal state: 1, 2, 3, 8, blank, 4, 7, 6, 5"/);

  // All 6 algorithms evaluated
  for (const algo of ['BFS', 'DFS', 'DLS', 'IDDLS', 'GBFS', 'A*']) {
    assert.ok(comparisonHtml.includes(algo), `missing algorithm ${algo} in comparison table`);
  }

  // All required table columns
  for (const col of ['Algorithm', 'Solution Found', 'Nodes Expanded', 'Moves', 'Time', 'Memory', 'Completeness', 'Optimality']) {
    assert.ok(comparisonHtml.includes(col), `missing column heading ${col}`);
  }

  // Analytical takeaways & heuristics comparison
  assert.match(comparisonHtml, /Manhattan/);
  assert.match(comparisonHtml, /Iterative Deepening/);

  // No video mentions
  assert.doesNotMatch(comparisonHtml, /video/i);
});
