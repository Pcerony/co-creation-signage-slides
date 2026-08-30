# Page Eight Image Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-image grid on `s13-baseline-audit` with one click-to-cycle image viewport and a visible `current / total` counter.

**Architecture:** The slide owns semantic carousel markup and the existing four asset IDs. A focused runtime module owns cycling, active-state visibility, counter updates, keyboard activation, and cleanup. Page-scoped CSS owns the fixed viewport geometry without introducing a new card surface.

**Tech Stack:** JSON slide markup, CSS, browser-native ES modules, Node test runner, Playwright.

---

### Task 1: Lock The Browser Behavior

**Files:**
- Create: `tests/browser/baseline-audit-carousel.test.mjs`

- [ ] **Step 1: Write a failing browser test**

Assert that page `s13-baseline-audit` has four carousel items, one visible item, a `1 / 4` counter, click-to-advance behavior, wraparound, and keyboard activation.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/browser/baseline-audit-carousel.test.mjs`

Expected: FAIL because the current slide still renders a four-image grid.

### Task 2: Implement The Image Cycle

**Files:**
- Modify: `src/content/slides/s13-baseline-audit.json`
- Modify: `src/styles/layouts.css`
- Create: `src/runtime/image-cycle.mjs`
- Modify: `src/runtime/main.mjs`

- [ ] **Step 1: Replace the gallery markup**

Wrap the four existing images in one `data-image-cycle` viewport. Give each image a `data-image-cycle-item` marker, make the viewport a button, and add a live `data-image-cycle-counter` containing `1 / 4`.

- [ ] **Step 2: Add page-scoped geometry**

Stack all items in one stable frame, hide inactive items, preserve full-image inspection with `object-fit: contain`, and place the counter unobtrusively at the lower right.

- [ ] **Step 3: Mount focused runtime behavior**

Export `mountImageCycles({ root })`, advance on click or Enter/Space, wrap from the last item to the first, update `is-active`, `hidden`, `aria-hidden`, and counter text, then return listener cleanup.

- [ ] **Step 4: Initialize the runtime**

Import and add `mountImageCycles({ root: deck })` to the cleanup list in `src/runtime/main.mjs`.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/browser/baseline-audit-carousel.test.mjs`

Expected: PASS.

### Task 3: Verify The Bounded Change

**Files:**
- Modify only focused source/test files if corrections are needed.

- [ ] **Step 1: Run shared tests**

Run: `npm run test:shared`

Expected: the new carousel does not introduce failures; pre-existing unrelated failures are reported separately.

- [ ] **Step 2: Build and run browser checks**

Run: `npm run build`

Run: `npm run test:browser`

Expected: build succeeds and carousel behavior passes across the browser suite.

- [ ] **Step 3: Inspect desktop and narrow screenshots**

Capture `s13-baseline-audit` in `en-ja` and `zh`; confirm the image is not cropped, the counter fits, and no content overlaps.

- [ ] **Step 4: Run final source checks**

Run: `git diff --check`

Expected: no whitespace errors.
