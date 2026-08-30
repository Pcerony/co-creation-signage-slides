# Overview Thumbnail Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the title-only ESC menu with 4:3 slide previews and fixed English plus Japanese captions.

**Architecture:** `overview.mjs` clones and sanitizes each rendered slide into an inert preview and resolves captions from the existing dictionaries. Shared component CSS scales the authored 4:3 slide into a four-column desktop grid and a scrollable two-column narrow grid.

**Tech Stack:** Browser DOM APIs, CSS Grid, Node test runner, Playwright.

---

### Task 1: Lock Overview Semantics

**Files:**
- Modify: `tests/browser/deck.test.mjs`

- [ ] Add a focused browser test that opens the overview and asserts one preview per manifest slide, a cloned `.slide`, fixed English and Japanese caption elements, no IDs or focusable descendants in clones, and navigation after clicking a preview.
- [ ] Run `node --test tests/browser/deck.test.mjs --test-name-pattern="overview renders"` and verify it fails because preview and caption elements do not exist.

### Task 2: Build Sanitized Visual Previews

**Files:**
- Modify: `src/runtime/overview.mjs`
- Modify: `src/runtime/main.mjs`

- [ ] Add a helper that clones a slide, removes IDs and active animation state, disables focusable descendants, and marks the clone `aria-hidden="true"`.
- [ ] Pass `data.dictionaries` into `mountOverview`.
- [ ] Resolve `slides.<stable-prefix>.shortTitle` from `en` and `ja`, render semantic primary and secondary caption lines, and retain the existing `GO_TO` action.
- [ ] Re-run the focused browser test and verify semantic assertions pass.

### Task 3: Implement Responsive Preview Geometry

**Files:**
- Modify: `src/styles/components.css`
- Test: `tests/browser/deck.test.mjs`

- [ ] Add stable 4:3 viewport geometry, scale cloned authored slides without cropping, use four desktop columns, and place captions below the preview.
- [ ] At 700px and below, switch to two columns and allow vertical overlay scrolling.
- [ ] Add computed-layout assertions for four and two columns, then rerun the focused test.

### Task 4: Verify Shared Behavior And Visual Output

**Files:**
- Modify only the owned files above if corrections are required.

- [ ] Run `npm run test:shared`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:browser`.
- [ ] Capture open-overview screenshots at desktop and narrow viewports and inspect for cropping, overlap, and caption overflow.
- [ ] Run `git diff --check`.
- [ ] Stage and commit only the overview runtime, styles, direct test, plan, and generated `dist/index.html` when all gates pass.
