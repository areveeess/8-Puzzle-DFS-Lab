# Taste Critique — Phase 1

## ROUND 3

Seen in one second: Two editable 3×3 puzzle boards and the title “8-Puzzle DFS Lab.”

Idea (one sentence): A worked-solution folio turns the assigned DFS puzzle into a clear student demonstration workbench.

Live thing: Users edit a start and goal, generate a legal-move scramble, bound DFS, and inspect its route and counters.

Layout words by section: utility bar=identity / intro=title and instruction / puzzle setup=paired boards / controls=stacked actions / result=outcome and disclosures

Scores: design 6.5 · usability 8.5 · creativity 7 · content 5 → overall 7.1

Caps applied: Design capped at 6.5 because the interface appropriately uses no real photography. Content capped at 5 because the required student-name placeholder is visible until the name is supplied.

Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. At 390px, the goal board starts below the first viewport, so users must scroll to compare boards; visible in `mobile-fold.jpg`. Keep the selected stacked-board topology and full-size tiles, since fitting both grids above the fold would make the controls and tiles cramped.
2. The student identity still reads `[Your name]`; visible in all three fold captures. Replace it when the student supplies their name; this placeholder is required by the assignment context for now.
3. The default first view ends after setup and the run controls, before any outcome exists; visible in `desktop-fold.jpg` and `mobile-fold.jpg`. This is the expected empty state; the prominent “Run DFS search” action makes the next step clear, and a result appears after running.

The inspector reported 0 FAIL and 0 WARN across 1440px, 768px, and 390px. The separate full-page captures were reviewed for clipping and responsive flow.
