# Interactive 8-Puzzle Problem Solver using AI Search Algorithms

## Project Description

The **8-Puzzle Problem** is a classic state-space search problem in Artificial Intelligence. The puzzle consists of a $3 \times 3$ grid containing 8 uniquely numbered sliding tiles (1 through 8) and one blank space (represented as 0). The goal is to transition from an initial board permutation to a specified goal board through legal sliding moves of adjacent tiles into the blank position.

### State-Space Formulation
- **Total Permutations:** $9! = 362,880$ total configurations.
- **Reachable Search Space:** The state space partitions into two disjoint components of $181,440$ ($9! / 2$) states each based on **inversion parity**. Horizontal and vertical tile slides preserve the permutation inversion count parity on a 3×3 grid. A start board can reach a goal board if and only if their inversion parities match.
- **Actions:** Moving the blank tile `Up`, `Right`, `Down`, or `Left`.
- **Step Cost:** Uniform cost of 1 per move. Total path cost equals the move count.

This web application models the 8-puzzle as an AI state-space search problem, visually demonstrating how the assigned **Depth First Search (DFS)** explores states, manages its frontier stack and explored set, and reconstructs a solution path.

---

## Technologies Used

- **HTML5:** Semantic document structure (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<dialog>`).
- **CSS3:** Custom responsive layout, 44px min-height touch controls, visible focus rings, and `prefers-reduced-motion` compliance.
- **Bootstrap 5.3.8:** Local version-pinned stylesheet (`assets/css/bootstrap.min.css`) providing responsive grid and UI components with zero external CDN dependencies.
- **JavaScript (ES6+ Modules):** Native browser modules (`solver.mjs`, `trace-model.mjs`, `playback.mjs`, `main.js`) with zero build tools or compilers.
- **Web Worker API:** Search execution runs in a dedicated background worker (`js/search-worker.js`), ensuring the browser UI thread remains 100% responsive during large searches.
- **Typography:** Local IBM Plex Sans and IBM Plex Mono fonts (`assets/fonts/`).
- **GitHub Pages:** Static hosting deployed directly from the repository root.

---

## Search Algorithms Implemented

Per the assignment specification, students must implement **only the specific algorithm allotted to them**. For Register Number **24BDS0200**, the allotted algorithm is **Algorithm 2: Depth First Search (DFS)**.

### Depth First Search (DFS) Implementation

1. **Working Principle:**
   - Uses an explicit **Last-In, First-Out (LIFO) stack** for the frontier (Open List).
   - In each cycle, the deepest unexplored state is popped from the top of the stack and expanded.
   - When a state reaches a dead-end or previously discovered state, the algorithm **backtracks** to the nearest ancestor with unvisited siblings.
2. **Cycle Detection & Visited Set:**
   - Graph search formulation with an explicit `visited` set (Closed List).
   - Generated successors already in `visited` are classified as `skip` and ignored, preventing infinite looping in the cyclic 8-puzzle state graph.
3. **Deterministic Successor Order:**
   - Blank-tile actions are generated in the strict deterministic order: **`Up, Right, Down, Left`**.
4. **Expansion Ceilings:**
   - Presets of 2,000, 10,000, and 25,000 expansions safeguard demonstration performance.
   - An exhaustive 200,000-expansion mode allows proving unsolvability for opposite-parity components (exhausting all 181,440 states).
5. **Route Reconstruction:**
   - Node records retain their `parentKey` and transition `move`, reconstructing the complete solution path upon reaching the goal.
6. **Theoretical Properties:**
   - **Time Complexity:** $\mathcal{O}(b^m)$, where $b \approx 3$ (branching factor) and $m$ is maximum depth.
   - **Space Complexity:** $\mathcal{O}(bm)$, linear in depth $m$, storing only active branch nodes and unexpanded siblings on the frontier stack.
   - **Completeness:** Complete on finite state spaces with visited set cycle detection.
   - **Optimality:** Non-optimal (returns the first goal path discovered, not the shortest path).

---

## Heuristics Used

While DFS is an **uninformed search algorithm** ($h(n) = 0$), heuristic functions are evaluated to compare informed and uninformed search techniques:

1. **Misplaced Tiles Heuristic ($h_1$):**
   $$h_1(n) = \sum_{i=1}^{8} [tile_i \neq goal_i]$$
   Counts the number of tiles that are not in their goal position (excluding the blank). It is admissible ($h_1(n) \le h^*(n)$) and consistent.

2. **Manhattan Distance Heuristic ($h_2$):**
   $$h_2(n) = \sum_{i=1}^{8} (|x_i - x_{goal,i}| + |y_i - y_{goal,i}|)$$
   Calculates the sum of horizontal and vertical grid distances of each tile from its target location. It strictly dominates misplaced tiles ($h_2(n) \ge h_1(n)$) and provides much stronger guidance.

### Comparative Insight
- **Uninformed DFS vs Informed Search (A\*):** On standard benchmark instances, uninformed DFS expands hundreds of nodes (e.g., 391 expansions) following deep branches blindly and returns a 21-move route. In contrast, A* with Manhattan distance expands only 25 nodes and guarantees the optimal 8-move solution.

---

## Screenshots

### Application Interface & Visual Workflow

```
+------------------------------------------------------------------------------------------------+
|  8-PUZZLE DFS LAB · Course: Artificial Intelligence                                            |
|  Student: Raj Vardhan Singh (24BDS0200)                                                        |
+------------------------------------------------------------------------------------------------+
|  [ Workbench ]  [ 8-Puzzle Formulation ]  [ DFS Theory ]  [ Comparison Table ]  [ Demo Guide ] |
+------------------------------------------------------------------------------------------------+

  INITIAL BOARD (3x3)           GOAL BOARD (3x3)             CONTROLS
  +---+---+---+                +---+---+---+                - Generate Solvable Start
  | 1 | 2 | 3 |                | 1 | 2 | 3 |                  (Easy / Medium / Hard)
  +---+---+---+                +---+---+---+                - Expansion Limit (2k/10k/25k)
  | 4 | 8 | 5 |                | 4 |   | 5 |                - [ Run DFS Search ]
  +---+---+---+                +---+---+---+
  | 7 |   | 6 |                | 7 | 8 | 6 |
  +---+---+---+                +---+---+---+
  [ Reachable: Parity matches target goal ]

+------------------------------------------------------------------------------------------------+
| DFS TRACE INSPECTOR                                                                            |
| Event 4 of 4: Goal found · move blank Up · depth 1                                             |
|                                                                                                |
| [Play trace] [Prev event] [Next event] [Reset trace] [Speed: 1x] [Playback: 0.0 s]             |
|                                                                                                |
|  EXPANDED STATE               SUCCESSORS GENERATED         FRONTIER (LIFO) & CLOSED LIST       |
|  +---+---+---+                1. Blank Up   -> GOAL        Frontier: [State 123405786...]      |
|  | 1 | 2 | 3 |                2. Blank Right-> Discover    Explored: [State 123485706...]      |
|  | 4 | 8 | 5 |                3. Blank Left -> Discover                                        |
|  | 7 |   | 6 |                                                                                 |
+------------------------------------------------------------------------------------------------+
| SOLUTION ROUTE PLAYBACK                                                                        |
| Step 1 of 1: After move 1: move the blank up.                                                  |
| [Play route] [Previous move] [Next move] [Reset route] [Playback: 0.0 s]                       |
+------------------------------------------------------------------------------------------------+
| 6-ALGORITHM COMPARISON TABLE (BFS, DFS, DLS, IDDLS, GBFS, A*)                                  |
+------------------------------------------------------------------------------------------------+
```

*(Interactive visual components, boards, and live playback are inspectable in real-time on the live GitHub Pages website)*

---

## GitHub Pages URL

- **Live Hosted Application:** [https://areveeess.github.io/8-Puzzle-DFS-Lab/](https://areveeess.github.io/8-Puzzle-DFS-Lab/)
- **GitHub Repository:** [https://github.com/areveeess/8-Puzzle-DFS-Lab](https://github.com/areveeess/8-Puzzle-DFS-Lab)

---

## Student Details

- **Student Name:** Raj Vardhan Singh
- **Registration Number:** 24BDS0200
- **Course Name:** Artificial Intelligence
- **Assignment Title:** Interactive 8-Puzzle Problem Solver using AI Search Algorithms
- **Allotted Search Algorithm:** Algorithm 2 — Depth First Search (DFS)

---

## References

1. Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson. Chapter 3: Solving Problems by Searching.
2. Korf, R. E. (1985). Depth-first iterative-deepening: An optimal admissible tree search. *Artificial Intelligence*, 27(1), 97–109.
3. Reinefeld, A. (1993). Complete solution of the eight-puzzle and the benefit of node ordering in IDA*. *Proceedings of the 13th International Joint Conference on Artificial Intelligence (IJCAI)*, 248–253.
4. Bootstrap v5.3.8 (MIT License). Copyright (c) 2011–2025 The Bootstrap Authors.
5. IBM Plex Fonts (SIL Open Font License 1.1). Copyright (c) 2017 IBM Corp.

---

## How to Run the Project

### Method 1: Open Live Deployment (No Installation Needed)
Access the live deployment on GitHub Pages:  
**[https://areveeess.github.io/8-Puzzle-DFS-Lab/](https://areveeess.github.io/8-Puzzle-DFS-Lab/)**

### Method 2: Run Locally via Static Server
Because ES6 Modules and Web Workers require origin isolation, run any static local server:

```bash
# Using Node.js (npx serve)
npx serve .

# OR using Python 3
python -m http.server 8000
```
Open `http://localhost:3000` (or `http://localhost:8000`) in your browser.

### Method 3: Run Automated Test Suite
Run the 44 automated unit, integration, and delivery tests:
```bash
node --test tests/*.mjs
```
