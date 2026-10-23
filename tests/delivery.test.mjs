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

test('all HTML pages exist and use strict relative paths for GitHub Pages subpath compatibility', () => {
  const pages = ['index.html', 'formulation.html', 'algorithm.html', 'comparison.html'];

  for (const pageName of pages) {
    const pageUrl = new URL(`../${pageName}`, import.meta.url);
    assert.ok(existsSync(pageUrl), `Page ${pageName} must exist on disk`);

    const pageContent = readFileSync(pageUrl, 'utf8');

    // No absolute root paths starting with /
    const absoluteMatches = pageContent.match(/(?:href|src)=["']\/[^"']+/g) ?? [];
    assert.deepEqual(absoluteMatches, [], `${pageName} must not use root-relative paths like href="/..."`);

    // Local assets (CSS, JS) must exist on disk
    const assetMatches = [...pageContent.matchAll(/(?:href|src)=["']([^"']+\.(?:css|js))["']/g)].map((m) => m[1]);
    for (const assetPath of assetMatches) {
      const fileUrl = new URL(`../${assetPath}`, import.meta.url);
      assert.ok(existsSync(fileUrl), `Asset ${assetPath} referenced in ${pageName} must exist on disk`);
    }

    // HTML link targets must exist on disk
    const htmlMatches = [...pageContent.matchAll(/(?:href)=["']([^"']+\.html)["']/g)].map((m) => m[1]);
    for (const htmlTarget of htmlMatches) {
      const targetUrl = new URL(`../${htmlTarget}`, import.meta.url);
      assert.ok(existsSync(targetUrl), `Target ${htmlTarget} linked in ${pageName} must exist on disk`);
    }
  }
});
