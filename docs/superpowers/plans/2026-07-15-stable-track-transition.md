# Stable Track Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild mode transitions on a fixed-slot carousel so current and neighboring pages remain spatially continuous.

**Architecture:** Replace global mode-dependent shell geometry and two-shell FLIP animations with stable presentation-size slots. The deck moves between fixed slot centers while only the current registered fullscreen slide changes local scale.

**Tech Stack:** Browser DOM APIs, CSS transforms and custom properties, Node.js `node:test`, Playwright.

---

### Task 1: Stable geometry contract

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Test: `tests/dom/runtime.test.mjs`

- [ ] Replace the FLIP helper test with a failing geometry test that compares fullscreen and presentation slot width, height, gap, and pitch.
- [ ] Rewrite `stageGeometry()` to return stable slot geometry plus separate presentation and fullscreen slide scales.
- [ ] Run `node --test tests/dom/runtime.test.mjs`; expect PASS.

### Task 2: Stable carousel runtime

**Files:**
- Modify: `src/runtime/carousel.mjs`
- Test: `tests/browser/deck.test.mjs`

- [ ] Add a failing first-frame browser assertion for the previous, target, and next shells at the 15→16 boundary.
- [ ] Remove rectangle measurement, FLIP keyframes, Web Animations, temporary shell classes, and animation-generation state.
- [ ] Apply stable slot variables and a separate fullscreen-current scale variable.
- [ ] Retain the 800ms navigation lock, forced diagnostic cancellation, resize cleanup, and reduced-motion shortcut.
- [ ] Run the targeted 15→16→17 browser test; expect PASS.

### Task 3: Fixed-slot CSS and release artifact

**Files:**
- Modify: `scripts/migrate-css.mjs`
- Generate: `src/styles/layouts.css`
- Generate: `dist/index.html`

- [ ] Center each slide absolutely inside its stable shell and transition its local scale around the shell center.
- [ ] Remove all temporary FLIP layer selectors, keep adjacent slides unclipped while entering fullscreen, and synchronize deck motion, slide scale, and chrome motion.
- [ ] Run `node scripts/migrate-css.mjs --write`, `npm run build`, and `node scripts/migrate-css.mjs`; expect PASS.
- [ ] Run `npm run qa` and `git diff --check`; expect PASS.
- [ ] Inspect desktop and narrow first, midpoint, and final frames for 15→16 and 16→17.
- [ ] Stage only owned paths and create one focused implementation commit.
