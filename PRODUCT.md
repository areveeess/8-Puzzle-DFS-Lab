# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML5, CSS3, and ES6+ JavaScript with Bootstrap 5.3 CSS stored in the project. No framework build step. Target GitHub Pages.

## Users

The primary user is a student presenting and explaining the assigned DFS project. Classmates learning the search process and the assignment evaluator are secondary users.

## Product Purpose

An educational 8-puzzle web app that lets a student configure a start and goal board, run the assigned Depth First Search algorithm, and explain the result during an Artificial Intelligence assignment demonstration.

## Positioning

The app focuses on one assigned algorithm, DFS, and makes its behavior correct, inspectable, and easy to explain. It does not implement or compare unassigned algorithms.

## Operating Context

The app is used in a browser for a short course assignment demonstration and is intended for static GitHub Pages hosting. The assignment requires HTML5, CSS3, and JavaScript (ES6), plus Bootstrap or Tailwind CSS. The Bootstrap stylesheet will be stored with the project to support offline demonstrations.

## Capabilities and Constraints

- Users configure initial and goal 8-puzzle boards, validate them, and generate solvable starts from the selected goal.
- The app runs a from-scratch graph-search DFS and reports found, exhausted, and expansion-limit outcomes distinctly.
- A found route is a DFS route and is not represented as a shortest path.
- The app reports search counters, depth, path cost, execution time, and approximate memory with their meanings.
- The assignment assigns DFS to register number 24BDS0200; other algorithm implementations and live comparison are out of scope.
- The homepage must show register number 24BDS0200 and student name Raj Vardhan Singh.

## Evidence on Hand

- Assignment brief: `assignment-materials/Artificial Intelligence QP 1 (1).pdf`.
- Register number: 24BDS0200.
- Student name: Raj Vardhan Singh.

## Product Principles

- Correct search behavior comes before visual effects.
- Make the choices, progress, and limits of DFS easy to explain.
- Be explicit when a search finds a route, exhausts the reachable state space, or reaches its limit.
- Keep the implementation small and static so the assignment remains easy to run and inspect.

## Accessibility & Inclusion

The interface should be responsive and keyboard accessible. It should respect reduced-motion preferences and communicate search state without relying only on color or animation.
