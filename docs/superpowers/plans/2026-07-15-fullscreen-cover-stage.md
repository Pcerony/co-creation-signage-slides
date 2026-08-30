# Selected Fullscreen Slides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give slides 1, 8, and 16 a fullscreen chrome-free stage and smooth transitions to the balanced standard stage.

**Architecture:** Keep stage geometry in the carousel module, select fullscreen slides by stable ID, and apply the result through existing CSS variables and one body state class. Migration-owned CSS handles chrome visibility, background matching, and synchronized transitions.

**Tech Stack:** Browser DOM APIs, CSS custom properties, Node.js `node:test`, Playwright.

---

### Task 1: Geometry contract

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Test: `tests/dom/runtime.test.mjs`

- [ ] Add failing tests for fullscreen cover containment and four equal presentation gaps.
- [ ] Add a stable-ID registry test for `s01-cover`, `s08-research-process`, and `s16-heatmap-overview`.
- [ ] Export `stageGeometry()` with fixed 1200x900 source geometry.
- [ ] Use viewport size plus measured chrome heights; return scale, render dimensions, deck top, horizontal offset, and balanced gap.
- [ ] Run `node --test tests/dom/runtime.test.mjs`; expect PASS.

### Task 1A: Navigation gate

**Files:**
- Modify: `src/runtime/deck-controller.mjs`
- Test: `tests/dom/runtime.test.mjs`

- [ ] Add a failing test proving repeated relative navigation is ignored while locked and a forced diagnostic jump remains available.
- [ ] Add `setNavigationLocked()` to the controller and reject `NEXT`, `PREVIOUS`, and `GO_TO` while locked unless `force` is explicit.
- [ ] Lock only across fullscreen/presentation boundaries and always release through transition cleanup.

### Task 2: Stage state and style

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Modify: `scripts/migrate-css.mjs`
- Generate: `src/styles/layouts.css`

- [ ] Toggle `fullscreen-stage` for the three registered stable IDs.
- [ ] Apply geometry variables and deck position on navigation and resize.
- [ ] Hide stage chrome, match current slide background, and remove radius/shadow in fullscreen state.
- [ ] Synchronize deck, scale, chrome, and fade-through-black transition timing; keep the deck fully transparent during global shell reflow.
- [ ] Use the balanced gap variable for both normal chrome edges.
- [ ] Run `node scripts/migrate-css.mjs --write` and its read-only drift check.

### Task 3: Browser regression and release artifact

**Files:**
- Modify: `tests/browser/deck.test.mjs`
- Modify: `tests/browser/performance.test.mjs`
- Generate: `dist/index.html`

- [ ] Add browser assertions for fullscreen pages 1, 8, and 16, restored stage chrome, equal gaps, and navigation.
- [ ] Add a 15→16→17 regression that sends repeated navigation during the boundary transition and proves no page is skipped.
- [ ] Capture desktop and 390px screenshots for pages 1, 8, 16, and one standard page.
- [ ] Run `npm run build`, `npm run qa`, `node scripts/migrate-css.mjs`, and `git diff --check`; expect PASS.
- [ ] Stage only owned files and commit the completed feature.
