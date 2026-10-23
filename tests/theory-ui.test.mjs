import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('homepage header includes course, title, student name, register number, and navigation', () => {
  // Course and Assignment metadata
  assert.match(html, /Artificial Intelligence/);
  assert.match(html, /Interactive 8-Puzzle Problem Solver using AI Search Algorithms/);
  assert.match(html, /Raj Vardhan Singh/);
  assert.match(html, /24BDS0200/);

  // Navigation menu with working anchor targets
  assert.match(html, /href="#workbench"/);
  assert.match(html, /href="#problem-formulation"/);
  assert.match(html, /href="#algorithm-theory"/);
  assert.match(html, /href="#algorithm-comparison"/);
  assert.match(html, /href="#demo-guide"/);

  // Target sections exist with corresponding IDs
  assert.match(html, /id="workbench"/);
  assert.match(html, /id="problem-formulation"/);
  assert.match(html, /id="algorithm-theory"/);
  assert.match(html, /id="algorithm-comparison"/);
  assert.match(html, /id="demo-guide"/);
});

test('problem formulation section covers the 8-puzzle state space and reachability invariants', () => {
  // State space size and reachable component
  assert.match(html, /362,880/);
  assert.match(html, /181,440/);
  assert.match(html, /inversion parity/i);
  assert.match(html, /blank/i);
});

test('algorithm theory section covers all 8 criteria for Depth First Search', () => {
  // 1. Description
  assert.match(html, /Depth First Search/i);
  // 2. Working Principle
  assert.match(html, /LIFO/i);
  assert.match(html, /stack/i);
  assert.match(html, /backtrack/i);
  // 3. Advantages
  assert.match(html, /advantage/i);
  // 4. Limitations
  assert.match(html, /limitation/i);
  // 5. Time Complexity
  assert.match(html, /O\(b\^?m\)/);
  // 6. Space Complexity
  assert.match(html, /O\(bm\)/);
  // 7. Completeness
  assert.match(html, /complete/i);
  // 8. Optimality
  assert.match(html, /optimal/i);
  // Deterministic successor order
  assert.match(html, /Up,\s*Right,\s*Down,\s*Left/);
});

test('algorithm comparison table covers all six search algorithms specified by the rubric', () => {
  for (const algo of ['BFS', 'DFS', 'DLS', 'IDDLS', 'GBFS', 'A*']) {
    assert.ok(html.includes(algo), `missing algorithm ${algo} in comparison table`);
  }
  for (const col of ['Algorithm', 'Solution Found', 'Nodes Expanded', 'Moves', 'Time', 'Memory', 'Completeness', 'Optimality']) {
    assert.ok(html.includes(col), `missing column heading ${col}`);
  }
});
