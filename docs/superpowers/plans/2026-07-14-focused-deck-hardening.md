# Focused Deck Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [x]\`) syntax for tracking.

**Goal:** Bring the focused 4:3 deck, its conventions, browser behavior, and Git history into one consistent, testable state.

**Architecture:** Keep the single-file HTML deck and vanilla runtime. Make the stage indicator the only presentation chrome, keep the legacy chapter-timeline-plus-footer navigation contract, remove truncation and viewport-dependent typography from the source, and retain the existing carousel/motion architecture. Generated QA output remains local and is ignored; source rules and durable QA documentation are committed.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node assertion scripts, Playwright CLI, Git.

---

### Task 1: Establish A Clean Git Baseline

**Files:**
- Modify: \`.gitignore\`
- Add: \`.agents/AGENTS.md\`
- Commit: the existing focused-deck checkpoint in \`docs/superpowers/specs/\`, \`docs/superpowers/plans/\`, \`ppt/index.html\`, and \`ppt/项目记录.md\`

- [x] **Step 1: Review the pre-existing diff and separate durable files from generated artifacts**

Confirm that the four modified tracked files are the focused-deck work already present, while \`output/playwright/\`, \`pdf/\`, and source archive files are not part of the implementation checkpoint.

- [x] **Step 2: Commit the existing focused-deck checkpoint**

\`\`\`bash
git add docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md docs/superpowers/plans/2026-07-14-focused-4x3-deck.md ppt/index.html ppt/项目记录.md
git commit -m "feat: checkpoint focused 4x3 deck redesign"
\`\`\`

- [x] **Step 3: Ignore generated QA artifacts and track the project rules**

Add \`output/playwright/\`, \`pdf/\`, and \`.playwright-cli/\` to \`.gitignore\`, then add \`.agents/AGENTS.md\` without adding the research archive or screenshots.

- [x] **Step 4: Verify the repository boundary and commit the hygiene change**

\`\`\`bash
git status --short --untracked-files=all
git check-ignore -v output/playwright/focused-deck-desktop.png pdf/1.png .playwright-cli
git add .gitignore .agents/AGENTS.md
git commit -m "chore: establish deck repository rules"
\`\`\`

### Task 2: Add Regression Tests For The Known Failures

**Files:**
- Modify: \`test/check-focused-deck.js\`
- Create: \`test/check-focused-deck-browser.js\`

- [x] **Step 1: Add structural checks that fail against the current source**

Assert that all indicator fields are in the visible header, no \`line-clamp\` declaration remains, no font-size declaration contains \`vw\` or \`vh\`, the legacy \`100vw\` deck shell is gone, localized indicator titles exist, and the runtime reads the current language when updating the indicator.

- [x] **Step 2: Run the structural test and confirm RED**

\`\`\`bash
node test/check-focused-deck.js
\`\`\`

Expected: the new visibility, truncation, typography, and localization checks fail against the current implementation.

- [x] **Step 3: Add a browser regression script**

The script opens \`http://127.0.0.1:4174/ppt/index.html\`, checks the legacy footer fields and 4:3 bounds, switches the overview language without changing the heading-driven footer contract, verifies all 19 overview thumbnails occupy five usable rows, navigates once, and asserts exactly one previous/current/next state where applicable.

- [x] **Step 4: Commit only the regression tests**

\`\`\`bash
git add test/check-focused-deck.js test/check-focused-deck-browser.js
git commit -m "test: lock deck hardening regressions"
\`\`\`

### Task 3: Make The Presentation Indicator Visible And Localized (Superseded By Task 7)

**Files:**
- Modify: \`ppt/index.html\`

- [x] **Step 1: Move chapter, title, local page, and total page into the visible header**

Replace the hidden footer/display-none structure with a header containing an upper chapter row, a lower title/page row, and the chapter timeline. Keep the IDs used by the runtime, remove the deprecated full-width progress track, and make the narrow layout wrap without overlapping the slide.

- [x] **Step 2: Add localized indicator-title data**

Define one \`INDICATOR_TITLES\` table for the 19 slides with \`zh\`, \`en\`, \`ja\`, and \`es-MX\` values. Keep the source slide headings unchanged; the table owns only the compact stage indicator labels.

- [x] **Step 3: Update the indicator from the current language**

Set chapter text from the localized chapter table, set the title from \`INDICATOR_TITLES[currentLanguage][idx]\`, and preserve local page and overall page updates in \`go()\` and \`applyLanguage()\`.

- [x] **Step 4: Run the browser regression and the existing structural suites**

\`\`\`bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
node test/check-focused-deck-browser.js
\`\`\`

- [x] **Step 5: Commit the indicator fix**

\`\`\`bash
git add ppt/index.html
git commit -m "fix: expose localized focused deck indicator"
\`\`\`

### Task 4: Remove Source-Level Typography And Truncation Conflicts

**Files:**
- Modify: \`ppt/index.html\`

- [x] **Step 1: Remove all line-clamp declarations and duplicate override blocks**

Delete the focused \`-webkit-line-clamp\` rules and the repeated inline \`<style>\` blocks that attempt to undo them. Preserve full text visibility and use the existing compact layout, overflow, and fixed canvas dimensions instead.

- [x] **Step 2: Replace the legacy viewport-sized deck shell**

Make the original \`#deck\` and \`.slide\` declarations use the logical 1200x900 tokens from the first declaration. Keep the carousel geometry as the sole runtime positioning mechanism.

- [x] **Step 3: Convert font-size declarations from viewport units to logical pixels**

Convert every \`font-size\` value containing \`vw\` or \`vh\` to a fixed \`px\` value appropriate to its existing scale. Do not alter non-typographic image/layout ratios unless required to prevent overflow.

- [x] **Step 4: Run static and browser checks**

\`\`\`bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
node test/check-focused-deck-browser.js
git diff --check
\`\`\`

- [x] **Step 5: Commit the typography cleanup**

\`\`\`bash
git add ppt/index.html
git commit -m "refactor: normalize deck typography and overflow"
\`\`\`

### Task 5: Align The Written Contract And Durable QA Record

**Files:**
- Modify: \`docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md\`
- Modify: \`docs/superpowers/plans/2026-07-14-focused-4x3-deck.md\`
- Modify: \`ppt/项目记录.md\`
- Add or modify: \`docs/reviews/design-qa.md\`

- [x] **Step 1: Remove stale 16-slide references**

Use 19 slides and 6 chapters consistently, including the indicator page example and Task 3 documentation step. Keep the overview grid at four columns by five rows so all 19 thumbnails have usable height.

- [x] **Step 2: Update QA claims to match the enforced rules**

Replace the line-clamp claim with full-text visibility, record the legacy footer fields and heading-driven title check, and preserve the actual browser viewport and console evidence.

- [x] **Step 3: Run documentation consistency checks**

\`\`\`bash
rg -n "16 slides|16-slide|06 / 16|five chapter|clamped|line-clamp" docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md docs/superpowers/plans/2026-07-14-focused-4x3-deck.md ppt/项目记录.md docs/reviews/design-qa.md
\`\`\`

Expected: no stale implementation-contract references remain; historical research text outside the deck contract may remain.

- [x] **Step 4: Commit the documentation alignment**

\`\`\`bash
git add docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md docs/superpowers/plans/2026-07-14-focused-4x3-deck.md ppt/项目记录.md docs/reviews/design-qa.md
git commit -m "docs: align focused deck contract and QA record"
\`\`\`

### Task 6: Final Verification And Git Review

- [x] **Step 1: Run the complete verification set**

\`\`\`bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
node test/check-focused-deck-browser.js
git diff --check
git status --short --branch
\`\`\`

- [x] **Step 2: Inspect the commit history and final diff**

\`\`\`bash
git log --oneline --decorate -8
git diff HEAD~6..HEAD --stat
\`\`\`

Confirm every implementation/documentation change is represented by a focused commit and generated artifacts remain ignored or intentionally untracked.

- [x] **Step 3: Stop the temporary server and report only verified results**

Do not claim completion until all commands above have fresh, successful output.

### Task 7: Restore The Legacy Navigation Contract

**Files:**
- Modify: \`ppt/index.html\`
- Modify: \`test/check-focused-deck.js\`
- Modify: \`test/check-focused-deck-browser.js\`
- Modify: the durable design and QA records

- [x] **Step 1: Lock the rollback contract with failing tests**

Require the chapter timeline in the upper region, the active heading and total
page in the lower footer, no two-row title header, and no visible wide progress
bar.

- [x] **Step 2: Restore the pre-hardening navigation implementation**

Return the markup and CSS to the timeline-plus-footer structure used by the
pre-hardening focused deck. Derive the footer title from the active slide's
\`h1\` or \`h2\` instead of maintaining an independent title table.

- [x] **Step 3: Verify desktop and narrow layouts**

At 1440 x 1000 and 900 x 900, confirm the timeline and footer remain visible,
the deprecated header and progress bar stay absent, the slide remains 4:3,
adjacent previews remain usable, and the browser console stays clean.
