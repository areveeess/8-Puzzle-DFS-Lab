# AI-8Puzzle-Visualizer

## What This Is

An educational web application for exploring the 8-puzzle as a state-space search problem. It lets a student enter or generate a solvable puzzle, then demonstrates how the assigned Depth First Search (DFS) algorithm explores states and reaches a goal. The application is intended for an Artificial Intelligence course assignment and a short project demonstration.

## Core Value

Make the behavior of the assigned DFS algorithm on the 8-puzzle correct, inspectable, and easy to explain.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] A user can provide an initial state and goal state for the 8-puzzle.
- [ ] A user can generate a random solvable puzzle.
- [ ] The application implements the assigned DFS algorithm from scratch in JavaScript and prevents revisiting explored states.
- [ ] The application visualizes DFS expansion and the resulting solution path, including animated blank-tile moves.
- [ ] A user can run, pause, resume, step forward and backward, reset, and adjust playback speed.
- [ ] The application reports whether a solution was found and useful search statistics.
- [ ] The project is organized for GitHub Pages deployment and documents how to run and demonstrate it.

### Out of Scope

- Implementing BFS, DLS, IDDLS, uniform-cost search, GBFS, or A* — the assignment says each student must implement only the algorithm assigned to them, and 24BDS0200 is assigned algorithm number 2 (DFS).
- A live multi-algorithm selector or performance comparison between implemented algorithms — these conflict with the assigned-algorithm-only constraint. Explanatory information about other algorithms may be included if it does not implement them.
- User accounts, a server, persistence, or a backend — the brief calls for a static web application deployable with GitHub Pages.

## Context

- Course: Artificial Intelligence.
- Assignment: “Interactive 8-Puzzle Problem Solver using AI Search Algorithms.”
- Register number: 24BDS0200.
- The assignment mapping on page 10 assigns algorithm number 2; the algorithm list on page 1 maps number 2 to Depth First Search (DFS).
- Required web technologies include HTML5, CSS3, and JavaScript (ES6), plus one UI framework (Bootstrap or Tailwind CSS). React, Vue, or Angular are optional.
- The PDF also describes all-algorithm selection and comparison in its general website requirements/rubric. Those are excluded from implementation scope because the per-student instruction explicitly limits implementation to the assigned algorithm.
- Source assignment: `assignment-materials/Artificial Intelligence QP 1 (1).pdf`.
- The homepage requires a student name, but it was not present in the supplied context; use a placeholder until provided.

## Constraints

- **Assignment scope**: Implement only DFS for the assigned algorithm — required by the per-student assignment instructions.
- **Technology**: HTML5, CSS3, and JavaScript (ES6); use Bootstrap or Tailwind CSS as the required UI framework.
- **Deployment**: GitHub Pages — the submission requires both a repository URL and a live URL.
- **Student details**: Show register number 24BDS0200; student name remains a placeholder until known.
- **Academic integrity**: Acknowledge third-party resources in the README.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement DFS only | Register 24BDS0200 maps to algorithm number 2, which is DFS; the assignment says to implement only the assigned algorithm. | — Pending |
| Treat the broad multi-algorithm selector/comparison as out of scope | It conflicts with the assigned-algorithm-only instruction. Keep the core app focused on demonstrating DFS. | — Pending |
| Target a static GitHub Pages application | The submission requires a live GitHub Pages URL, and the brief does not require a backend. | — Pending |
| Use a placeholder for the student name | The PDF requires a name on the homepage, but only the register number was supplied. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-23 after initialization*
