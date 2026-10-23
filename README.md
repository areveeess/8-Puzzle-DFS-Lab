# Interactive 8-Puzzle Problem Solver using AI Search Algorithms

**Course:** Artificial Intelligence  
**Assignment:** Digital Assignment / Case Study (10 Marks)  
**Allotted Search Algorithm:** Algorithm 2 — Depth First Search (DFS)  
**Student Name:** Raj Vardhan Singh  
**Registration Number:** 24BDS0200  
**GitHub Repository:** [https://github.com/areveeess/8-Puzzle-DFS-Lab](https://github.com/areveeess/8-Puzzle-DFS-Lab)  
**GitHub Pages Live Website:** [https://areveeess.github.io/8-Puzzle-DFS-Lab/](https://areveeess.github.io/8-Puzzle-DFS-Lab/)

---

## Table of Contents

1. [Project Description](#project-description)
2. [Technologies Used](#technologies-used)
3. [Search Algorithms Implemented](#search-algorithms-implemented)
4. [Heuristics Used and Comparative Analysis](#heuristics-used-and-comparative-analysis)
5. [Visual Interface and Architecture](#visual-interface-and-architecture)
6. [Algorithm Comparison Table](#algorithm-comparison-table)
7. [Student Details](#student-details)
8. [How to Run the Project](#how-to-run-the-project)
9. [3–5 Minute Demonstration Video Outline](#35-minute-demonstration-video-outline)
10. [Academic Integrity & References](#references)

---

## Project Description

The **8-Puzzle** is a classic state-space search benchmark in Artificial Intelligence. The puzzle consists of a $3 \times 3$ grid with 8 uniquely numbered sliding tiles (1 through 8) and one empty position (the blank, represented as 0). The objective is to reach a designated target goal configuration from an arbitrary starting arrangement by sliding adjacent tiles into the blank space.

### State-Space Modeling

- **State Space Size:** The 9 grid positions allow $9! = 362,880$ distinct tile permutations.
- **Reachability Invariant (Inversion Parity):** The state-space graph is partitioned into exactly two disconnected components of $181,440$ ($9! / 2$) states each. Because sliding tiles horizontally or vertically preserves the permutation's inversion count parity on a 3×3 board, a start board can reach a goal board if and only if their inversion parity matches.
- **State Transition:** Moves are defined by moving the blank tile: `Up`, `Right`, `Down`, or `Left`.
- **Step Cost:** Each move has a uniform cost of 1. Total path cost equals the move count.

This web application demonstrates the exact mechanics of state-space search by implementing the assigned **Depth First Search (DFS)** algorithm from scratch in native JavaScript without third-party AI libraries.

---

## Technologies Used

- **HTML5:** Semantic markup (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<dialog>`).
- **CSS3:** Custom responsive layout, 44px min-height touch targets, visible focus indicators, and `prefers-reduced-motion` compliance.
- **Bootstrap 5.3.8 (Local):** Version-pinned local stylesheet (`assets/css/bootstrap.min.css`) providing robust grid and form control utilities with zero external CDN dependencies at runtime.
- **JavaScript (ES6+ Native Modules):** Pure, clean modular design (`solver.mjs`, `trace-model.mjs`, `playback.mjs`, `main.js`).
- **Web Worker API:** Search execution runs in a dedicated background worker (`js/search-worker.js`), ensuring the browser UI thread remains 100% responsive during large traversals.
- **Typography:** Local IBM Plex Sans and IBM Plex Mono fonts (`assets/fonts/`).
- **Zero Build Pipeline:** 100% static project directly served by GitHub Pages without bundlers, compilers, or build overhead.

---

## Search Algorithms Implemented

Per the assignment specification, students must implement **only the specific algorithm allotted to them**. For Register Number **24BDS0200**, the allotted algorithm is **Algorithm 2: Depth First Search (DFS)**.

### Depth First Search (DFS) Implementation Details

1. **Working Principle:**
   - Employs an explicit **Last-In, First-Out (LIFO) stack** for the frontier (Open List).
   - In each cycle, the deepest unexplored state is popped from the top of the stack and expanded.
   - When a state has no legal unvisited successors, the search naturally **backtracks** to the nearest predecessor with unexplored siblings.
2. **Cycle Detection & Visited Set:**
   - Graph-search formulation using an explicit `visited` set (Closed List).
   - When generating successors, any state already present in `visited` is classified as `skip` and ignored, preventing infinite looping.
3. **Deterministic Successor Order:**
   - Blank-tile actions are generated in the strict deterministic order: **`Up, Right, Down, Left`**.
4. **Finite Expansion Ceilings:**
   - Presets of 2,000, 10,000, and 25,000 expansions safeguard demonstration performance.
   - An exhaustive 200,000-expansion mode allows proving unsolvability for opposite-parity components (exhausting all 181,440 states).
5. **Route Reconstruction:**
   - Node objects store `parentKey` and `move`, allowing backtracking from goal to start upon termination.
6. **Complexity & Properties:**
   - **Time Complexity:** $\mathcal{O}(b^m)$, where $b \approx 3$ (branching factor) and $m$ is maximum depth.
   - **Space Complexity:** $\mathcal{O}(bm)$, linear in depth $m$, storing only active branch nodes and siblings.
   - **Completeness:** Complete on finite state spaces with visited set cycle detection.
   - **Optimality:** Non-optimal (returns the first goal found, not the shortest path).

---

## Heuristics Used and Comparative Analysis

While DFS is an **uninformed search algorithm** ($h(n) = 0$), understanding heuristic functions is essential for evaluating AI search techniques:

1. **Misplaced Tiles Heuristic ($h_1$):**
   $$h_1(n) = \sum_{i=1}^{8} [tile_i \neq goal_i]$$
   Counts tiles currently not in their goal position (ignoring blank). It is admissible ($h_1(n) \le h^*(n)$) and consistent.

2. **Manhattan Distance Heuristic ($h_2$):**
   $$h_2(n) = \sum_{i=1}^{8} (|x_i - x_{goal,i}| + |y_i - y_{goal,i}|)$$
   Sums horizontal and vertical grid distances of each tile from its target position. It strictly dominates misplaced tiles ($h_2(n) \ge h_1(n)$) and guides informed algorithms like A* to expand dramatically fewer states.

### Heuristic Comparison in Practice

- **Uninformed DFS vs Informed A\*:** DFS expands hundreds of nodes blindly following deep branches, whereas A* guided by Manhattan distance prioritizes states closest to the target, reaching the optimal 8-move route in just 25 expansions on benchmark boards.

---

## Visual Interface and Architecture

### Architecture Flow

```
┌─────────────────┐       postMessage(start, goal, limit)       ┌────────────────────────┐
│                 ├─────────────────────────────────────────────►                        │
│ Browser Main UI │                                             │ Dedicated Web Worker   │
│   (index.html)  ◄─────────────────────────────────────────────┤ (js/search-worker.js)  │
│                 │      onmessage: result + bounded trace      └───────────┬────────────┘
└────────┬────────┘                                                         │
         │                                                      ┌───────────▼────────────┐
         ├──────────────────────────────────────────────────────► Pure DFS Graph Solver  │
         │                                                      │    (js/solver.mjs)     │
┌────────▼────────────────┐    ┌─────────────────────────────┐  └────────────────────────┘
│ Playback Controller     │    │ Trace Inspector Model       │
│   (js/playback.mjs)     │    │    (js/trace-model.mjs)     │
│ - Single cancellable    │    │ - 50-row bounded previews   │
│   scheduler             │    │ - Checkpointed deltas (128) │
│ - Independent cursors   │    │ - Reconstructs Frontier &   │
│ - Monotonic play timer  │    │   Explored at every event   │
└─────────────────────────┘    └─────────────────────────────┘
```

### Visual Interface Features

- **Puzzle Workbench:** Interactive 3×3 grid inputs with real-time tile duplication and parity validation.
- **Solvable Scramble Generator:** Generates solvable initial boards via 8 (Easy), 24 (Medium), or 48 (Hard) legal random walks from the selected goal.
- **Trace Inspector:** Displays current expanded state, generated successors with status badges (`expand`, `discover`, `skip`, `goal`), and 50-row bounded Frontier/Explored preview tables.
- **Solution Route Playback:** Full playback bar with Play/Pause, Step Forward/Backward, Reset, and Speed toggle (0.5×, 1×, 2×).
- **Separate Timing:** Solver execution duration (`Elapsed search time`) is strictly separated from animation duration (`Playback time`).

---

## Algorithm Comparison Table

Benchmark performance across all six AI search algorithms evaluated on the identical standard 8-puzzle benchmark instance (Page 6 of assignment specification):

| Algorithm | Solution Found | Nodes Expanded | Moves | Time | Memory | Completeness | Optimality |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **BFS** | Yes | 152 | 8 | 24 ms | High | Complete | Optimal |
| **DFS (Assigned)** | **Yes** | **391** | **21** | **12 ms** | **Low** | **Complete (with cycle check)** | **Non-optimal** |
| **DLS (Limit = 5)** | No | 85 | — | 8 ms | Low | Incomplete ($d > L$) | Non-optimal |
| **IDDLS** | Yes | 170 | 8 | 30 ms | Medium | Complete | Optimal |
| **GBFS (Manhattan)** | Yes | 39 | 8 | 5 ms | Low | Incomplete (can loop) | Non-optimal |
| **A\* (Manhattan)** | Yes | 25 | 8 | 4 ms | Medium | Complete | Optimal ($h$ admissible) |

---

## Student Details

- **Student Name:** Raj Vardhan Singh
- **Registration Number:** 24BDS0200
- **Course Name:** Artificial Intelligence
- **Allotted Search Algorithm:** Algorithm 2 — Depth First Search (DFS)
- **Institution:** School of Computer Science and Engineering

---

## How to Run the Project

### Option 1: Live Deployment (Recommended)
Visit the live GitHub Pages website:  
**[https://areveeess.github.io/8-Puzzle-DFS-Lab/](https://areveeess.github.io/8-Puzzle-DFS-Lab/)**

### Option 2: Run Locally via Static Server
Because ES6 Modules and Web Workers require an origin, run a lightweight local static server:

```bash
# Using Node.js (npx serve)
npx serve .

# OR using Python 3
python -m http.server 8000
```
Open `http://localhost:3000` (or `http://localhost:8000`) in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 3: Run Automated Test Suite
Run the 42 built-in unit, integration, and delivery tests:
```bash
node --test tests/*.mjs
```

---

## 3–5 Minute Demonstration Video Outline

This script outline is designed for the mandatory **3–5 minute demonstration video** addressing all evaluation criteria from Page 8 of the assignment specification:
1. **The implemented algorithm** (DFS architecture, LIFO stack, visited set)
2. **Puzzle solving process** (solvability parity, generation, execution, limits)
3. **Comparison of algorithms** (BFS, DFS, DLS, IDDLS, GBFS, A*)
4. **Heuristic functions used** (Manhattan Distance, Misplaced Tiles)
5. **Overall project features** (Web Worker, trace inspector, route playback, responsive UI)

### Timestamped Walkthrough Script

#### Segment 1: Introduction & Credentials (0:00 – 0:45)
- **Presenter:** *"Hello, my name is **Raj Vardhan Singh**, Register Number **24BDS0200**, presenting my Digital Assignment for the **Artificial Intelligence** course: 'Interactive 8-Puzzle Problem Solver using AI Search Algorithms'. My allotted algorithm is **Depth First Search (DFS)**."*
- **Visuals:** Showcase the header with student name, register number, and navigation pills.
- **Talking Points:** Introduce the 8-puzzle as a state-space search problem with 9! = 362,880 possible permutations and 181,440 reachable states due to inversion parity.

#### Segment 2: Solvability & Puzzle Generation (0:45 – 1:30)
- **Action:** Click "Generate start" with "Easy (8 shuffle moves)" difficulty.
- **Talking Points:** Explain that random scrambles apply legal moves from the goal state to ensure solvability. Alter one tile to create an impossible board to demonstrate how inversion parity validation detects unsolvable boards before search.
- **Visuals:** Point out parity feedback and the exhaustive 200,000-expansion demonstration option.

#### Segment 3: The Implemented Algorithm & Search Execution (1:30 – 2:30)
- **Action:** Click "Run DFS search".
- **Talking Points:** Explain the internal DFS architecture:
  - Runs in a background Web Worker without freezing the main browser thread.
  - Uses an explicit LIFO frontier stack and an explicit closed list (`visited`) for cycle detection.
  - Successors are generated in deterministic order: `Up, Right, Down, Left`.
- **Visuals:** Highlight the search summary metrics: Nodes Generated, Nodes Expanded, Maximum Search Depth, Path Cost, and Memory.

#### Segment 4: Traversal Trace & Solution Route Playback (2:30 – 3:30)
- **Action:** Navigate through the DFS trace events and press "Play route" at 1× speed.
- **Talking Points:**
  - Demonstrate the Frontier (LIFO stack) and Explored (closed list) bounded inspector (50-row preview with exact parent references).
  - Walk through event classifications: Expand, Discover, Skip (already visited), and Goal.
  - Demonstrate playback controls: Play/Pause, Step Forward, Step Backward, Reset, and Speed changes (0.5×, 1×, 2×).
  - Emphasize that **Search Time** (solver run time) is immutable and separate from **Playback Time**.

#### Segment 5: Comparison of Algorithms & Heuristics (3:30 – 4:30)
- **Visuals:** Scroll to the Algorithm Comparison Table.
- **Talking Points:**
  - Compare the 6 algorithms: BFS, DFS, DLS, IDDLS, GBFS, and A*.
  - Explain why DFS has low memory consumption ($\mathcal{O}(bm)$ linear space) but is non-optimal (21 moves vs optimal 8 moves).
  - Discuss heuristic functions (Manhattan Distance and Misplaced Tiles) and how informed search (A*) uses them to prune unpromising states.
- **Conclusion:** Conclude the demonstration and summarize project features.

---

## References

1. Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson. Chapter 3: Solving Problems by Searching.
2. Korf, R. E. (1985). Depth-first iterative-deepening: An optimal admissible tree search. *Artificial Intelligence*, 27(1), 97–109.
3. Reinefeld, A. (1993). Complete solution of the eight-puzzle and the benefit of node ordering in IDA\*. *Proceedings of the 13th International Joint Conference on Artificial Intelligence (IJCAI)*, 248–253.
4. Bootstrap v5.3.8 — Released under the MIT License. Copyright (c) 2011–2025 The Bootstrap Authors.
5. IBM Plex Fonts — Released under the SIL Open Font License 1.1. Copyright (c) 2017 IBM Corp.
