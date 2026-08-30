# Native 16:9 Fullscreen Slides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every registered fullscreen slide on a native 1600x900 canvas while preserving the fixed 4:3 carousel track for ordinary slides.

**Architecture:** Keep the stable shell geometry and track pitch based on the existing 1200x900 presentation slot. Give registered fullscreen slides a 1600x900 logical canvas, a slot-fitting preview scale, and a separate viewport-fitting current scale.

**Tech Stack:** Browser DOM APIs, CSS transforms and custom properties, Node.js `node:test`, Playwright.

---

### Task 1: Encode the 16:9 geometry contract

**Files:**
- Modify: `tests/dom/runtime.test.mjs`
- Modify: `src/runtime/carousel.mjs`

- [ ] Change the fullscreen geometry assertion to require a 16:9 current rectangle at 1440x1000 and add an assertion for a complete slot-fitting 16:9 preview.
- [ ] Run `node --test tests/dom/runtime.test.mjs`; expect the new ratio assertions to fail against the 4:3 implementation.
- [ ] Add 1600x900 fullscreen dimensions, compute preview and current scales from those dimensions, and preserve 1200x900 stable slot calculations.
- [ ] Run `node --test tests/dom/runtime.test.mjs`; expect PASS.

### Task 2: Apply intrinsic canvas dimensions

**Files:**
- Modify: `tests/browser/deck.test.mjs`
- Modify: `src/runtime/carousel.mjs`
- Modify: `scripts/migrate-css.mjs`
- Generate: `src/styles/layouts.css`

- [ ] Add browser assertions that slides 1, 8, and 16 have a 16:9 logical/rendered ratio and that slide 2 remains 4:3.
- [ ] Run the targeted browser test; expect the fullscreen ratio assertion to fail against the 4:3 canvases.
- [ ] Assign `is-fullscreen-capable` from the stable-ID registry, expose the fullscreen preview scale, and set 1600x900 dimensions only on that class.
- [ ] Keep the existing fixed shells, synchronized transform duration, clipping rules, and navigation lock unchanged.
- [ ] Run `node scripts/migrate-css.mjs --write`, `npm run build`, and the targeted browser test; expect PASS.

### Task 3: Verify and integrate

**Files:**
- Generate: `dist/index.html`
- Inspect: `output/qa/`

- [ ] Run `npm ci`, `npm run build`, `npm run qa`, and `git diff --check`; expect all commands to exit zero.
- [ ] Capture and inspect desktop and narrow screenshots for slides 1, 8, and 16, plus transition frames around slides 15, 16, and 17.
- [ ] Confirm ordinary pages remain 4:3 and the fixed track does not jump at fullscreen boundaries.
- [ ] Stage only the owned runtime, style, test, and documentation paths; exclude concurrent content, translation, generated distribution, and asset changes.
- [ ] Create one focused implementation commit with the affected-interface and rollback notes recorded in this design document.
