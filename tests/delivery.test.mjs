import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('README.md includes all sections mandated by the assignment specification', () => {
  assert.ok(existsSync(new URL('../README.md', import.meta.url)), 'README.md must exist');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

  // Student credentials & course
  assert.match(readme, /Raj Vardhan Singh/);
  assert.match(readme, /24BDS0200/);
  assert.match(readme, /Artificial Intelligence/);

  // Deployment and repository links
  assert.match(readme, /https:\/\/areveeess\.github\.io\/8-Puzzle-DFS-Lab\/?/);
  assert.match(readme, /https:\/\/github\.com\/areveeess\/8-Puzzle-DFS-Lab/);

  // Exact 9 required sections from Page 7 of assignment PDF
  assert.match(readme, /## Project Description/i);
  assert.match(readme, /## Technologies Used/i);
  assert.match(readme, /## Search Algorithms Implemented/i);
  assert.match(readme, /## Heuristics Used/i);
  assert.match(readme, /## Screenshots/i);
  assert.match(readme, /## GitHub Pages URL/i);
  assert.match(readme, /## Student Details/i);
  assert.match(readme, /## References/i);
  assert.match(readme, /## How to Run the Project/i);

  // Heuristic comparisons
  assert.match(readme, /Manhattan Distance/i);
  assert.match(readme, /Misplaced Tiles/i);
});

test('index.html uses strict relative paths for GitHub Pages subpath compatibility', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  // No absolute root paths starting with /
  const absoluteMatches = html.match(/(?:href|src)=["']\/[^"']+/g) ?? [];
  assert.deepEqual(absoluteMatches, [], 'index.html must not use root-relative paths like href="/..."');

  // Local assets must exist on disk
  const assetMatches = [...html.matchAll(/(?:href|src)=["']([^"']+\.(?:css|js))["']/g)].map((m) => m[1]);
  for (const assetPath of assetMatches) {
    const fileUrl = new URL(`../${assetPath}`, import.meta.url);
    assert.ok(existsSync(fileUrl), `Asset ${assetPath} referenced in index.html must exist on disk`);
  }
});
