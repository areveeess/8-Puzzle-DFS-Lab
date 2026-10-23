<!-- GSD:project-start source:PROJECT.md -->

## Project

**AI-8Puzzle-Visualizer**

An educational web application for exploring the 8-puzzle as a state-space search problem. It lets a student enter or generate a solvable puzzle, then demonstrates how the assigned Depth First Search (DFS) algorithm explores states and reaches a goal. The application is intended for an Artificial Intelligence course assignment and a short project demonstration.

**Core Value:** Make the behavior of the assigned DFS algorithm on the 8-puzzle correct, inspectable, and easy to explain.

### Constraints

- **Assignment scope**: Implement only DFS for the assigned algorithm — required by the per-student assignment instructions.
- **Technology**: HTML5, CSS3, and JavaScript (ES6), plus Bootstrap or Tailwind CSS as required by the assignment. GSD research recommends a build-free Bootstrap CSS setup; confirm the exact choice before implementation.
- **Deployment**: GitHub Pages — the submission requires both a repository URL and a live URL.
- **Student details**: Show student name Raj Vardhan Singh and register number 24BDS0200.
- **Academic integrity**: Acknowledge third-party resources in the README.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| HTML | HTML Living Standard | Semantic page structure | Explicitly required by the assignment and directly served by GitHub Pages. A small educational single-page app does not need a component framework. |
| CSS | CSS | Custom layout, board states, responsive polish | Explicitly required. Keep app-specific styling in a small local stylesheet so the 3×3 puzzle board remains visually clear and independent of framework defaults. |
| JavaScript | ES6+ (browser native) | Puzzle state, DFS traversal, animation/playback, controls | Explicitly required. Modern browsers supply the needed language features and DOM APIs without a compile step. Keep DFS implementation visible in source for assessment. |
| Bootstrap | 5.3.8 stable | Responsive grid, spacing, buttons, form controls | The assignment permits Bootstrap or Tailwind. Use Bootstrap CSS to meet that requirement with minimal setup and no build pipeline. Do not use the Bootstrap 6 alpha for an assessed project. Load only the CSS unless a Bootstrap JavaScript component is actually used. |
| GitHub Pages | Current hosted service | Static hosting | The assignment names GitHub Pages. Publish the repository root directly from a branch; the site needs no server-side runtime. |

### Database

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Git / GitHub | Current | Version control and repository hosting | Fits the requested GitHub Pages deployment and makes the source inspectable for an academic submission. |
| GitHub Pages branch publishing | Current | Deploy `index.html` and static assets | GitHub recommends branch publishing when no custom build process is needed. Select the repository root (or `/docs` only if the assignment repository requires it). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Bootstrap CSS via jsDelivr | 5.3.8 | Grid, spacing, controls and responsive utilities | Include pinned version with the official integrity and crossorigin attributes from Bootstrap's quick-start snippet. Keep custom puzzle styling in `styles.css`. |
| React | Optional; latest official docs report 19.3 | Declarative UI rendering | Do not include in the baseline. Consider only if the implementation grows into many independently updating views; it adds a build/tooling layer and is not needed for the assignment's compact interactive board. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI framework | Bootstrap 5.3.8 CSS | Tailwind CSS 4.3 | Both satisfy the assignment, but Tailwind's documented production setup uses a build tool or CLI and adds tooling to an otherwise static beginner project. Bootstrap is available as a versioned CDN stylesheet. |
| UI architecture | Plain HTML + ES6 modules | React 19.3 + Vite | React is explicitly optional. A framework and bundler add setup, generated output and deployment configuration without helping the single 3×3 board enough to justify them. |
| Deployment | GitHub Pages from branch root | Custom GitHub Actions build/deploy workflow | No compilation is required, so branch publishing is simpler. Use Actions only if a later requirement introduces a build step or needs deployment automation beyond branch publishing. |
| Styling | Bootstrap plus small custom CSS | Bootstrap JavaScript components | The board and controls can use native buttons and form elements; no Bootstrap JavaScript dependency is necessary. |

## Installation

## Sources

- [Bootstrap 5.3 Introduction and quick start](https://getbootstrap.com/docs/5.3/getting-started/introduction/) — versioned CDN setup and integrity guidance.
- [Bootstrap official blog: v5.3.8](https://blog.getbootstrap.com/2025/08/25/bootstrap-5-3-8/) — stable 5.3 patch release; official site currently also lists Bootstrap 6.0.0-alpha.1, which is pre-release.
- [Tailwind CSS installation](https://tailwindcss.com/docs/installation) and [upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — current docs report v4.3 and describe the build-tool/CLI setup and browser compatibility requirements.
- [React official version page](https://react.dev/versions) — current documented version is 19.3; React remains optional under the assignment.
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — branch publishing supports repository root or `/docs`; recommends branch publishing when no custom build is needed.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — documents when Actions is appropriate and current Pages actions.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| design-taste-frontend | >- tasteskill v2, the anti-slop frontend skill. Art direction for websites, distilled from a study of 247 curated gallery sites (One Page Love, Awwwards Sites of the Day). Deals researched directions (idea, composition, type, palette, photographs, section blueprints) from a library, enforces a strict no-slop house style with a real-browser inspector, and runs a look-and-fix loop on screenshots. Use this whenever you build, design, redesign, restyle, polish or review a landing page, marketing site, portfolio, product page, one-pager, hero or any public-facing web page, in any stack (HTML/CSS, React, Next.js, Vue, Svelte, Astro, Tailwind) — also when the user says a page looks generic, templated, "AI-made", sloppy, or asks to make it look designed, premium, award-level or less like every other site. Also for app screens: dashboards, admin and analytics views, settings, inboxes and other screens people work in, with their own run and rules. | `.agents/skills/design-taste-frontend/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `$gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `$gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
