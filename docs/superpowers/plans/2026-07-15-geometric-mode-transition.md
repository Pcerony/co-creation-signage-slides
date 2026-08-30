# Geometric Mode Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace opacity masking with a directional FLIP transition that visibly connects fullscreen and presentation pages.

**Architecture:** Keep controller navigation gating unchanged. Measure the outgoing shell, apply target geometry without CSS interpolation, then animate the outgoing and incoming shells in viewport space with Web Animations. CSS supplies stacking and geometric chrome movement only.

**Tech Stack:** Browser DOM APIs, Web Animations API, CSS transforms, Node.js `node:test`, Playwright.

---

### Task 1: Pure geometric keyframes

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Test: `tests/dom/runtime.test.mjs`

- [ ] Add a failing unit test for a `modeTransitionFrames()` helper that maps both shells from their exact pre-layout rectangles and contains no opacity keys.
- [ ] Export the minimal helper using rectangle centers, width ratios, viewport width, and navigation direction.
- [ ] Run `node --test tests/dom/runtime.test.mjs`; expect PASS.

### Task 2: FLIP boundary animation

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Test: `tests/browser/deck.test.mjs`

- [ ] Replace the delayed fade/reflow timers with source/target shell measurement and two Web Animations.
- [ ] Apply target state synchronously while deck interpolation is disabled, then animate shells from calculated FLIP keyframes.
- [ ] Retain navigation locking, forced-navigation cancellation, reduced-motion fallback, and complete cleanup.
- [ ] Extend the 15→16→17 regression to require first-frame target continuity plus two opaque, displaced transition shells at midpoint.
- [ ] Run `node --test tests/browser/deck.test.mjs`; expect PASS.

### Task 3: Geometric chrome and generated output

**Files:**
- Modify: `scripts/migrate-css.mjs`
- Generate: `src/styles/layouts.css`
- Generate: `dist/index.html`

- [ ] Remove the deck opacity keyframes and animation.
- [ ] Disable underlying deck interpolation only during the FLIP phase, keep source and target shells opaque, and move chrome out of the viewport with transforms.
- [ ] Run `node scripts/migrate-css.mjs --write`, `npm run build`, and `node scripts/migrate-css.mjs`; expect PASS.
- [ ] Run `npm run qa` and `git diff --check`; expect PASS.
- [ ] Capture desktop and narrow screenshots for slides 15, 16, and 17 and inspect the transition midpoint.
- [ ] Stage only owned paths and create one focused implementation commit.
