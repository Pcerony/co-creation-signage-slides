# Slides 10-14 Continuous Method Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild displayed slides 10-14 as a coherent, readable method sequence in `zh` and `en-ja` while preserving all existing research claims and metrics.

**Architecture:** Each slide keeps its stable manifest identity and semantic content file. The five content files use a shared `method-sequence` class vocabulary, while a bounded section in `src/styles/layouts.css` owns geometry and responsive behavior. Phase A i18n entries own visible wording; a focused DOM test protects structure, metric preservation, and the no-ordinary-card rule.

**Tech Stack:** JSON slide content, CSS Grid/Flexbox, project i18n dictionaries, Node test runner, Playwright browser tests, existing build pipeline.

---

## File Map

- Modify `src/content/slides/s11-principles-ar.json`: principles framework and evidence strip.
- Modify `src/content/slides/s13-baseline-audit.json`: audit metrics, finding, and tool evidence.
- Modify `src/content/slides/s13b-state-analysis.json`: primary 15% finding, distributions, and deficiency matrix.
- Modify `src/content/slides/s14-stimulus-comparison.json`: image-led controlled comparison.
- Modify `src/content/slides/s15-eye-tracking-system.json`: four-step system flow and calibration evidence.
- Modify `src/i18n/zh.json`: Phase A Chinese sequence copy.
- Modify `src/i18n/en.json`: English source for the default composite display.
- Modify `src/i18n/ja.json`: Japanese annotations for the default composite display.
- Modify `src/styles/layouts.css`: bounded `.method-sequence` layout system and narrow rules.
- Create `tests/dom/method-sequence-slides.test.mjs`: semantic and visual-contract regression tests.

### Task 1: Protect The Sequence Contract

**Files:**
- Create: `tests/dom/method-sequence-slides.test.mjs`

- [ ] **Step 1: Write the failing semantic contract test**

Create a Node test that loads the five JSON files and asserts:

```js
const expected = new Map([
  ['s11-principles-ar', ['method-sequence', 'method-principles']],
  ['s13-baseline-audit', ['method-sequence', 'method-audit']],
  ['s13b-state-analysis', ['method-sequence', 'method-diagnosis']],
  ['s14-stimulus-comparison', ['method-sequence', 'method-comparison']],
  ['s15-eye-tracking-system', ['method-sequence', 'method-system']],
]);
```

Assert that every markup string contains both required classes, uses `data-i18n` for revised visible copy, and contains no inline `background:#fff`, `box-shadow`, or ordinary section `border-radius` declarations. Assert that the audit/diagnosis markup still contains `70`, `182`, `15%`, `31`, `46`, and `94` in the appropriate slides.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/dom/method-sequence-slides.test.mjs`

Expected: FAIL because the five slide files do not yet use the shared method-sequence classes and still contain card-like inline styles.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add tests/dom/method-sequence-slides.test.mjs
git commit -m "test(deck): define method sequence contract"
```

### Task 2: Rebuild Principles And Audit

**Files:**
- Modify: `src/content/slides/s11-principles-ar.json`
- Modify: `src/content/slides/s13-baseline-audit.json`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/ja.json`

- [ ] **Step 1: Replace page 10 markup**

Use a root `canvas-card method-sequence method-principles`, a `method-sequence__header`, three semantic `.principle` columns connected by one `.principles__rail`, and a substantial `.method-evidence` figure using `asset:intervention-sign`. Put all revised visible strings behind `slides.s11.*` keys.

- [ ] **Step 2: Replace page 11 markup**

Use `canvas-card method-sequence method-audit`, a three-part `.audit-metrics` row for `70`, `182`, and `A/R/S`, an unboxed `.audit-finding`, and a large `.method-evidence` figure using `asset:annotation-tool`. Preserve claim `claim-baseline-ar-absence` and the values A=41, R=47, S=94 recorded on this slide.

- [ ] **Step 3: Add Phase A language entries**

Add matching `slides.s11.*` and `slides.s13.*` keys to `zh.json`, `en.json`, and `ja.json`. English and Japanese must express the same meaning as Chinese without adding stronger conclusions. Do not edit `es-MX.json`.

- [ ] **Step 4: Run content validation**

Run: `npm run validate:content && npm run validate:i18n`

Expected: both commands PASS with no missing keys or malformed slide JSON.

- [ ] **Step 5: Commit pages 10-11**

```bash
git add src/content/slides/s11-principles-ar.json src/content/slides/s13-baseline-audit.json src/i18n/zh.json src/i18n/en.json src/i18n/ja.json
git commit -m "refactor(deck): unify principles and audit slides"
```

### Task 3: Rebuild Diagnosis

**Files:**
- Modify: `src/content/slides/s13b-state-analysis.json`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/ja.json`

- [ ] **Step 1: Replace page 12 markup**

Use `canvas-card method-sequence method-diagnosis`. Place `15%` in `.diagnosis-hero`, totals `7`, `70`, and `180` in `.diagnosis-totals`, A/R/S counts `31`, `46`, and `94` in one ruled comparison, and the six greenhouse deficiencies in a semantic list. Remove the circular chart, colored pills, white panels, shadows, and decorative illustration thumbnail.

- [ ] **Step 2: Preserve existing Phase A keys**

Reuse the existing `slides.s13b.*` dictionary entries. Add only small keys needed for A/R/S labels or section metadata; do not rewrite the 15% conclusion or deficiency mappings.

- [ ] **Step 3: Run the focused test**

Run: `node --test tests/dom/method-sequence-slides.test.mjs`

Expected: pages 10-12 satisfy the contract; failures remain only for pages 13-14 until Task 4.

- [ ] **Step 4: Commit page 12**

```bash
git add src/content/slides/s13b-state-analysis.json src/i18n/zh.json src/i18n/en.json src/i18n/ja.json
git commit -m "refactor(deck): clarify state analysis slide"
```

### Task 4: Rebuild Comparison And System

**Files:**
- Modify: `src/content/slides/s14-stimulus-comparison.json`
- Modify: `src/content/slides/s15-eye-tracking-system.json`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/ja.json`

- [ ] **Step 1: Replace page 13 markup**

Use `canvas-card method-sequence method-comparison`. Give both stimulus figures equal dimensions and a shared baseline. Keep labels and one concise contrast statement below each image. Put revised copy behind `slides.s14.*` keys.

- [ ] **Step 2: Replace page 14 markup**

Use `canvas-card method-sequence method-system`. Create an ordered four-step rail for capture, calibration, mapping, and compensation. Integrate a large `asset:calibration-screen` figure beside or below the rail. Put revised copy behind `slides.s15.*` keys.

- [ ] **Step 3: Add Phase A language entries**

Add matching `slides.s14.*` and `slides.s15.*` keys to `zh.json`, `en.json`, and `ja.json`. Preserve technical terms WebGazer.js and Homography. Do not edit `es-MX.json`.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/dom/method-sequence-slides.test.mjs`

Expected: PASS for all five slides.

- [ ] **Step 5: Commit pages 13-14**

```bash
git add src/content/slides/s14-stimulus-comparison.json src/content/slides/s15-eye-tracking-system.json src/i18n/zh.json src/i18n/en.json src/i18n/ja.json
git commit -m "refactor(deck): unify comparison and tracking slides"
```

### Task 5: Add The Shared Layout System

**Files:**
- Modify: `src/styles/layouts.css`

- [ ] **Step 1: Confirm the contract test remains RED for missing layout ownership**

Extend the focused test to read `src/styles/layouts.css` and assert that it contains `.method-sequence`, `.method-sequence__header`, `.method-evidence`, and `@media (max-width:` ownership rules.

Run: `node --test tests/dom/method-sequence-slides.test.mjs`

Expected: FAIL because the new class vocabulary is not styled yet.

- [ ] **Step 2: Add bounded desktop styles**

Append a clearly marked `METHOD SEQUENCE: DISPLAYED SLIDES 10-14` section. Define shared title height, evidence grid, metric rhythm, dividers, image sizing, and slide-specific layouts. Use transparent/unboxed ordinary content and stable grid tracks.

- [ ] **Step 3: Add bounded narrow styles**

Within the existing narrow breakpoint pattern, stack evidence only where required, keep title order intact, use readable minimum body sizes, and prevent image or long-word overflow.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/dom/method-sequence-slides.test.mjs && npm run test:shared`

Expected: focused test and the complete shared suite PASS.

- [ ] **Step 5: Commit the layout system**

```bash
git add src/styles/layouts.css tests/dom/method-sequence-slides.test.mjs
git commit -m "style(deck): add continuous method sequence layout"
```

### Task 6: Build And Visual Verification

**Files:**
- Modify only if a focused defect is found in one of the owned files above.
- Generate ignored screenshots under `output/qa/method-sequence/`.

- [ ] **Step 1: Run source and build gates**

Run:

```bash
npm run validate:content
npm run validate:i18n
npm run test:shared
npm run build
npm run build:check
git diff --check
```

Expected: all commands PASS. Generated `dist/index.html` may change locally but must not be staged.

- [ ] **Step 2: Run browser gates**

Run: `npm run test:browser`

Expected: all browser tests PASS with no navigation, overflow, asset, or runtime regression.

- [ ] **Step 3: Capture desktop screenshots**

Capture displayed slides 10-14 at 1920x1080 for `zh` and `en-ja` into `output/qa/method-sequence/desktop/`. Verify title clearance, readable body text, equal image baselines, unboxed ordinary content, and neighboring-stage integrity.

- [ ] **Step 4: Capture narrow screenshots**

Capture the same slides at 900x1200 for `zh` and `en-ja` into `output/qa/method-sequence/narrow/`. Verify no clipping, overlap, unreadably small copy, or layout shifts.

- [ ] **Step 5: Apply only focused corrections**

If visual defects are found, change only the five content files, three Phase A dictionaries, bounded layout section, or focused test. Re-run the failed gate and the complete Task 6 commands.

- [ ] **Step 6: Commit verification corrections**

```bash
git add src/content/slides/s11-principles-ar.json src/content/slides/s13-baseline-audit.json src/content/slides/s13b-state-analysis.json src/content/slides/s14-stimulus-comparison.json src/content/slides/s15-eye-tracking-system.json src/i18n/zh.json src/i18n/en.json src/i18n/ja.json src/styles/layouts.css tests/dom/method-sequence-slides.test.mjs
git commit -m "fix(deck): polish method sequence responsiveness"
```

Skip this commit when no correction is required.

## Final Handoff

Record the task as Level H because it spans five layout families and shared typography/layout behavior. Report base commit `65b1672`, final commit, exact changed files, all command results, screenshot locations, generated `dist` status, and any unresolved claim or responsive risks.
