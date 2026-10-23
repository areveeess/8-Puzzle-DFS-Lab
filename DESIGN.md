---
name: 8-Puzzle DFS Lab
description: An ink-first worked-solution folio for configuring and inspecting bounded 8-puzzle DFS.
colors:
  route-teal: "#1b6c80"
  route-teal-deep: "#145361"
  ground: "#eaf1f3"
  sheet: "#ffffff"
  raised: "#f6f9fa"
  selection: "#e4f0f2"
  border: "#d7e1e4"
  divider: "#e7edef"
  control-stroke: "#c5d2d6"
  ink: "#172127"
  muted-ink: "#485960"
  success-green: "#17633f"
  error-red: "#9c1d2b"
typography:
  headline:
    fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: '"IBM Plex Mono", monospace'
    fontSize: "14px"
    fontWeight: 500
  tile:
    fontFamily: '"IBM Plex Mono", monospace'
    fontSize: "24px"
    fontWeight: 500
rounded:
  control: "6px"
  card: "8px"
  sheet: "16px"
spacing:
  compact: "12px"
  panel: "16px"
  rail: "20px"
  workspace: "24px"
components:
  button-primary:
    backgroundColor: "{colors.route-teal}"
    textColor: "{colors.sheet}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
  button-primary-hover:
    backgroundColor: "{colors.route-teal-deep}"
    textColor: "{colors.sheet}"
  button-outline-primary:
    textColor: "{colors.route-teal-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
  button-outline-secondary:
    textColor: "#34434a"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
  select-field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
  board-panel:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  puzzle-tile:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.tile}"
    rounded: "{rounded.control}"
  route-list:
    textColor: "{colors.ink}"
    padding: "12px 0 0 1.75rem"
  brand-bar:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  workbench-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "clamp(22px, 3vw, 40px)"
  confirmation-dialog:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: 8-Puzzle DFS Lab

## Overview

**Creative North Star: "The Worked-Solution Folio"**

The app carries a student's worked-solution folio into a compact builder-like workspace. The pair of boards establishes the puzzle; an ordered DFS route is evidence that belongs below setup. Reading hierarchy stays quiet and ink-first, while the 3×3 tile mark and numbered route supply the visual signature.

Across the surface, a cool blue-grey frame, white working sheet, soft raised panels, and one teal route/selection accent make structure visible without decoration. IBM Plex Sans handles explanation; IBM Plex Mono is reserved for tile values and measured identifiers. The white sheet is this lab's surface treatment, not a universal container for unrelated screens. The build avoids the oversized landing-page headline, generic KPI treatment, paper texture, and decorative grid named in the direction brief.

**Key Characteristics:**
- A compact, task-first builder interface.
- One teal accent against cool, low-chroma surfaces.
- The board pair and ordered route carry the product's visual identity.

## Colors

The palette keeps the page cool and quiet so board states, controls, and the search route remain easy to scan.

### Primary
- **Route Teal:** The primary action, keyboard focus, tile hover, and route markers use this accent; its deeper companion handles hover and link emphasis.

### Neutral
- **Blue-Grey Ground:** Frames the workbench outside the sheet.
- **Working-Sheet White:** Holds the main workspace and control surfaces.
- **Raised Panel:** Separates the two board panels from the sheet.
- **Selection Wash:** Marks the blank tile's selected or active state.
- **Quiet Border, Divider, and Control Stroke:** Separate panels, sections, and form controls without adding heavy outlines.
- **Ink and Muted Ink:** Carry primary reading and supporting instructions.

### Feedback
- **Success Green:** Reserved for positive reachability and scramble status.
- **Error Red:** Marks invalid board feedback.

The exhaustive-search warning uses a local warm callout. Keep it attached to that exceptional action state rather than promoting it to a general brand accent.

**The Route Accent Rule.** Keep teal attached to the primary action, route, selection, links, and keyboard focus; let the cool neutrals carry the rest.

## Typography

**Display Font:** IBM Plex Sans (with Inter, system-ui, sans-serif fallbacks)  
**Body Font:** IBM Plex Sans (with Inter, system-ui, sans-serif fallbacks)  
**Label/Mono Font:** IBM Plex Mono (with monospace fallback), for tile values and measured identifiers only.

**Character:** IBM Plex Sans keeps instructions and outcomes compact and direct. IBM Plex Mono gives tile values, register number, route indices, and measured statistics a clear data character without turning explanatory copy into code.

### Hierarchy
- **Headline** (600, 22px, 1.2 line-height): The page title and search outcome.
- **Title** (600, 16px, 1.3–1.35 line-height): Section, board, and control-block headings.
- **Body** (400, 14px, 1.5 line-height): Instructions and explanations, with long copy capped around 65–72ch.
- **Label** (400, 12–13px, 1.5 line-height): Board roles, metadata, and secondary status.
- **Mono data** (500, 14px; tile values 24px): Register number, route indices, statistics, and the 3×3 tile values.

**The Data Face Rule.** Keep IBM Plex Mono on measured values and board identifiers; all explanatory reading stays in IBM Plex Sans.

## Layout

The project bar sits above a centered working sheet. At wide widths the bar is capped at 1440px, while the sheet is capped at 1424px with a narrow outer gutter. The bar is 44px tall on desktop; its student reference remains secondary to the product name.

The workbench pairs two equal board panels in a board column beside a narrower control rail. The board pair uses a 16px gap and the overall workspace uses 24px. At 980px and below, the workspace becomes one column and the control rail becomes two columns. At 600px and below, boards and controls stack; the sheet runs edge to edge, the student reference stacks, and the statistics use one column. The mobile sheet removes its outer side borders and rounded top corners.

The result follows the setup rather than competing with it: outcome and move count lead, the route stays behind a disclosure, and metric definitions follow. Reachability feedback stays beside the boards. The outer white sheet is a workbench-level surface; board panels use a separate raised fill and smaller corners.

## Elevation & Depth

Resting depth comes from changes in surface tone and thin borders rather than shadows. Board panels sit slightly above the white sheet through a pale fill. The only shadow is structural: the confirmation dialog floats above the page while its backdrop dims the underlying workbench.

### Shadow Vocabulary
- **Dialog float:** 0 14px 34px rgb(20 48 57 / 20%); use only on the confirmation dialog.

**The Flat-By-Default Rule.** Use tonal surfaces and borders for resting content; reserve elevation for the modal confirmation state.

## Shapes

The form language is restrained: control corners are gently rounded, board panels are a little broader, and the workbench sheet has the largest radius. At phone widths the sheet becomes square-edged and full-bleed. Board tiles keep a square silhouette with a 3×3 grid; panel and form borders remain thin. Keyboard focus is a clear 3px teal outline with a 2px offset.

## Components

### Buttons

Buttons feel like ordinary, confident browser controls. The primary DFS action uses the route accent with white text; hover moves to the deeper teal. The primary control has a 40px minimum height, with 44px minimum buttons in the mobile control rail. Outline-primary controls use deep teal text and a pale active fill; outline-secondary controls use neutral ink. Disabled primary actions use a softened blue-grey fill.

### Inputs / Fields

Difficulty and expansion-limit controls remain native selects. They use the control stroke, sheet fill, ink text, and control corner. The base minimum height is 38px and rises to 44px at phone width. Tile selectors are also native selects: keep the tile square, center its mono value, and use the selection wash for the blank tile.

Keyboard focus is shared across selects, buttons, and the route disclosure: teal border plus a 3px outline with a 2px offset. Do not replace the browser-control affordance with a decorative tile button.

### Cards / Containers

Board panels have a thin border, raised fill, compact internal padding, and the card corner. They stay flat at rest. The white workbench sheet has its own wider measure and larger corner; do not apply that sheet silhouette to every panel.

### Navigation

There is no navigation menu. The compact brand bar is a project identity header on the ground color, not a site-wide navigation pattern. Its 3×3 product mark uses one teal route tile; at phone width the mark reduces and the student details stack.

### Signature Components

**The numbered route** is an ordered list revealed by a native disclosure. Keep its numbered markers in mono and use a vertical rule to make sequence legible; it is the explanation trail, not a row of KPI cards.

**The exhaustive-search notice** is a localized warm callout attached to the option to demonstrate a full no-solution search. Keep its color treatment scoped to that exceptional warning state.

**The confirmation dialog** uses a native dialog and a dimmed backdrop. Its shadow belongs to this overlay state only.

## Do's and Don'ts

### Do:
- **Do** keep teal for primary action, selected-board feedback, keyboard focus, and the numbered route.
- **Do** reserve IBM Plex Mono for tile values, the register number, route indices, and measured search statistics.
- **Do** preserve the visible keyboard-focus outline and reduced-motion behavior.
- **Do** keep the white sheet and raised board panels as distinct levels of this workbench.

### Don't:
- **Don't** add paper texture or a decorative grid to the current visual world.
- **Don't** turn the puzzle setup into an oversized landing-page hero or a generic KPI dashboard.
- **Don't** replace native selects with non-interactive tile or control lookalikes.
- **Don't** add shadows to resting panels; the dialog is the one elevated surface.

