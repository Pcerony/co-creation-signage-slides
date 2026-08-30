# Modular Slide Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not dispatch subagents for this execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-maintained presentation monolith with modular slide, translation, style, and runtime sources that deterministically build one offline `dist/index.html`.

**Architecture:** Preserve the current rendered deck as the migration baseline while extracting stable slide files, semantic metadata, dictionaries, shared CSS, and runtime modules. A small Node build pipeline validates all inputs, bundles local dependencies, and writes the release artifact atomically. Fast, shared, and release test gates keep routine edits cheap while protecting cross-slide behavior.

**Tech Stack:** Node.js 20+, npm lockfile, plain ES modules, JSON/JSON Schema, YAML, esbuild, Playwright, built-in `node:test`.

---

## Operating Constraints

- Work on the existing `codex/focused-4x3-deck` branch because uncommitted deck fixes are part of the current migration baseline.
- Never stage unrelated pre-existing changes.
- Never run `test/update-master-slides*.js`, `test/update-slides.js`, or `scratch/update_languages.js`.
- Keep `ppt/index.html` available as the rollback baseline until the final cutover task.
- Use test-first development for every validator, builder, and runtime behavior.
- Commit each task independently.

### Task 1: Reproducible Node Toolchain

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.nvmrc`
- Create: `scripts/serve.mjs`
- Create: `tests/unit/serve.test.mjs`

- [ ] **Step 1: Write a failing server lifecycle test**

The test imports `startStaticServer`, requests `/ppt/index.html`, verifies a 200 response, rejects `../` traversal with 403, then closes the server in `finally`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/serve.test.mjs`
Expected: FAIL because `scripts/serve.mjs` does not exist.

- [ ] **Step 3: Implement the minimal server**

Export `startStaticServer({ root, host = '127.0.0.1', port = 0 })`. Resolve the decoded URL against `root`, reject any path outside it, return `{ server, origin, close }`, and set content types for HTML, CSS, JS, JSON, PNG, JPG, SVG, and fonts.

- [ ] **Step 4: Lock dependencies and scripts**

`package.json` scripts:

```json
{
  "build": "node scripts/build.mjs",
  "build:check": "node scripts/build.mjs --check",
  "test:fast": "node --test tests/unit/*.test.mjs",
  "test:shared": "node --test tests/unit/*.test.mjs tests/dom/*.test.mjs",
  "test:browser": "node --test tests/browser/*.test.mjs",
  "qa": "npm run test:fast && npm run test:shared && npm run test:browser && npm run build:check",
  "serve": "node scripts/serve.mjs"
}
```

Pin `esbuild`, `playwright`, `ajv`, and `yaml`; set `engines.node` to `>=20`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm ci && npm run test:fast`
Expected: server test passes and dependencies install from the lockfile.

Commit: `build: add reproducible node toolchain`

### Task 2: Root Project and Multi-Agent Contract

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `docs/maintenance/task-packet.md`
- Create: `docs/maintenance/style-exceptions.md`
- Modify: `.gitignore`

- [ ] **Step 1: Add documentation contract checks**

Create `tests/unit/project-contract.test.mjs` that asserts root documentation exists, generated output is labeled read-only, L/M/H commands are present, legacy write scripts are forbidden, and `.worktrees/`, temporary build files, and QA outputs are ignored.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/project-contract.test.mjs`
Expected: FAIL for missing root documents.

- [ ] **Step 3: Write concise routing documents**

`AGENTS.md` must fit within 180 lines and contain: source-of-truth order, dirty-tree protection, one-task/one-commit rule, L/M/H file-reading budgets, exact gates, stop conditions, ownership and handoff fields, generated-file prohibition, and privacy escalation.

`README.md` must define installation, source directories, build/test commands, release artifact, rollback file, and common edit recipes.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm run test:fast && git diff --check`
Commit: `docs: add project and multi-agent maintenance contract`

### Task 3: Manifest, Sources, Claims, and Privacy Gates

**Files:**
- Create: `deck-manifest.json`
- Create: `schemas/deck-manifest.schema.json`
- Create: `sources.yml`
- Create: `claims.yml`
- Create: `DATA_GOVERNANCE.md`
- Create: `scripts/lib/validate-project.mjs`
- Create: `scripts/validate-content.mjs`
- Create: `tests/unit/validate-project.test.mjs`

- [ ] **Step 1: Write failing validator tests**

Cover duplicate slide IDs, unknown chapters/layouts/assets/claims, missing files, mismatched slide counts, invalid SHA-256 shape, forbidden participant-name filenames, and valid fixtures.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/validate-project.test.mjs`
Expected: FAIL because validators are missing.

- [ ] **Step 3: Implement schemas and validators**

Expose pure functions `validateManifest`, `validateSources`, `validateClaims`, and `validatePublicAssetNames`. Diagnostics must include stable IDs and file paths.

- [ ] **Step 4: Inventory current deck**

Create 21 stable slide entries from the current DOM, six chapter entries, registered layouts, current presentation assets, and claim references. Record source checksums and distinguish public, internal, restricted-derived, and restricted-raw materials. Do not delete or rename historical assets in this task.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node scripts/validate-content.mjs && npm run test:fast`
Commit: `feat: establish deck and research source manifests`

### Task 4: Stable Internationalization Files

**Files:**
- Create: `src/i18n/zh.json`
- Create: `src/i18n/en.json`
- Create: `src/i18n/ja.json`
- Create: `src/i18n/es-MX.json`
- Create: `src/i18n/meta.json`
- Create: `scripts/lib/i18n.mjs`
- Create: `scripts/validate-i18n.mjs`
- Create: `tests/unit/i18n.test.mjs`

- [ ] **Step 1: Write failing i18n tests**

Require identical key sets, non-empty translations, no duplicate JSON properties, no CJK leakage in English/Spanish, stable key syntax, and formatting of parameterized values.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/i18n.test.mjs`
Expected: FAIL because dictionaries and helpers are missing.

- [ ] **Step 3: Extract and normalize dictionaries**

Convert visible content to stable keys organized by `common`, `chapters`, and `slides.<slide-id>`. Repair known mixed-language source strings during extraction. Japanese leakage validation uses explicit forbidden simplified-Chinese phrases rather than rejecting all CJK.

- [ ] **Step 4: Implement lookup and audit**

Expose `translate(dictionary, key, params)` and `auditDictionaries`. Missing keys throw in build/test and fall back to the key only in debug mode.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node scripts/validate-i18n.mjs && npm run test:fast`
Commit: `refactor: move translations to stable dictionaries`

### Task 5: Per-Slide Sources and Layout Registry

**Files:**
- Create: `src/content/slides/s01-cover.json` through `src/content/slides/s21-references.json`
- Create: `src/layouts/registry.mjs`
- Create: `src/layouts/*.mjs`
- Create: `scripts/lib/render-slide.mjs`
- Create: `tests/unit/render-slide.test.mjs`

- [ ] **Step 1: Write failing rendering contract tests**

Assert each manifest slide renders exactly one `<section class="slide">`, includes its stable `data-slide-id`, contains no inline event handler or script, references only registered translation/asset/claim IDs, and exposes chapter/layout metadata.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/render-slide.test.mjs`
Expected: FAIL because the renderer is missing.

- [ ] **Step 3: Implement the layout registry**

Use a small set of layout functions matching actual structural families: cover, evidence, process, comparison, data, heatmap, split-closing, and references. Each layout declares required slots and density limits.

- [ ] **Step 4: Extract all slide content**

Move text, metric values, asset IDs, and semantic slots into the 21 content JSON files. Keep layout geometry out of content. Preserve current visible behavior and stable slide order.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node scripts/validate-content.mjs && node --test tests/unit/render-slide.test.mjs`
Commit: `refactor: extract slide content and layout registry`

### Task 6: CSS Modules and Design Tokens

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/stage.css`
- Create: `src/styles/layouts.css`
- Create: `src/styles/components.css`
- Create: `src/styles/languages.css`
- Create: `scripts/lib/css-audit.mjs`
- Create: `tests/unit/css-audit.test.mjs`

- [ ] **Step 1: Write failing CSS policy tests**

Reject viewport-relative font sizes, unregistered colors and spacing, inline generated styles, undocumented `!important`, `line-clamp`, and duplicate top-level selectors.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/css-audit.test.mjs`
Expected: FAIL because modular CSS is missing.

- [ ] **Step 3: Extract and deduplicate styles**

Move current CSS into responsibility-based files, normalize tokens, retain only documented compatibility overrides, and keep slide-specific layout rules in the registered layout class.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/unit/css-audit.test.mjs && npm run test:fast`
Commit: `refactor: extract slide design tokens and css modules`

### Task 7: DeckController and Runtime Modules

**Files:**
- Create: `src/runtime/deck-controller.mjs`
- Create: `src/runtime/navigation.mjs`
- Create: `src/runtime/carousel.mjs`
- Create: `src/runtime/overview.mjs`
- Create: `src/runtime/i18n.mjs`
- Create: `src/runtime/motion.mjs`
- Create: `src/runtime/asset-loader.mjs`
- Create: `src/runtime/main.mjs`
- Create: `tests/dom/runtime.test.mjs`

- [ ] **Step 1: Write failing runtime tests**

Cover controller bounds, URL initialization, previous/current/next states, language switching, overview open/close, event-listener cleanup, reduced motion, and lazy asset selection.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/dom/runtime.test.mjs`
Expected: FAIL because runtime modules are missing.

- [ ] **Step 3: Implement explicit state ownership**

`DeckController` owns `{ currentSlideIndex, language, overviewOpen, lowPowerMode }`, exposes subscribe/dispatch/destroy, and passes state to independent modules. Do not create top-level mutable globals.

- [ ] **Step 4: Migrate behavior and diagnostics**

Port carousel, indicator, keyboard/click navigation, language switching, overview, and motion recipes. Expose only `window.__deckDebug` in debug builds.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm run test:shared`
Commit: `refactor: replace global runtime with deck controller modules`

### Task 8: Deterministic Single-File Build

**Files:**
- Create: `src/entry.html`
- Create: `scripts/build.mjs`
- Create: `scripts/lib/embed-assets.mjs`
- Create: `tests/unit/build.test.mjs`
- Create: `dist/index.html`

- [ ] **Step 1: Write failing build tests**

Assert atomic output, one embedded CSS bundle, one runtime bundle, 21 rendered slides, no remote URLs, build metadata, deterministic output under fixed `SOURCE_DATE_EPOCH`, and `--check` drift detection.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/build.test.mjs`
Expected: FAIL because the builder is missing.

- [ ] **Step 3: Implement the builder**

Validate first, render slides, bundle ES modules and CSS with esbuild, embed approved assets, write a temporary file, parse/sanity-check it, then rename atomically. `--check` builds in memory and compares against `dist/index.html` without writing.

- [ ] **Step 4: Verify GREEN and commit**

Run: `SOURCE_DATE_EPOCH=1784073600 npm run build && SOURCE_DATE_EPOCH=1784073600 npm run build:check && npm run test:fast`
Commit: `build: generate portable single-file slide deck`

### Task 9: Lazy Media, Offline Dependencies, and Performance Budgets

**Files:**
- Create: `src/assets/vendor/`
- Create: `src/assets/thumbnails/`
- Create: `scripts/optimize-assets.mjs`
- Create: `scripts/check-performance.mjs`
- Create: `tests/browser/performance.test.mjs`
- Modify: `src/runtime/asset-loader.mjs`
- Modify: `scripts/build.mjs`

- [ ] **Step 1: Write failing offline/performance tests**

Block network requests, assert current/adjacent media only, verify heatmaps load on selection, enforce generated-core size and initial decoded-image budgets, and verify overview uses thumbnails rather than cloned slide DOM.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/browser/performance.test.mjs`
Expected: FAIL against the first generated build.

- [ ] **Step 3: Vendor and optimize assets**

Pin local fonts/icons/motion code, generate presentation-sized image variants and thumbnails, add width/height metadata, and defer nonadjacent media.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm run build && node scripts/check-performance.mjs && node --test tests/browser/performance.test.mjs`
Commit: `perf: add offline lazy assets and release budgets`

### Task 10: Browser QA and Legacy Regression Replacement

**Files:**
- Create: `tests/browser/deck.test.mjs`
- Create: `tests/browser/i18n.test.mjs`
- Create: `tests/browser/viewports.test.mjs`
- Create: `scripts/capture-slides.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write browser tests against `dist/index.html`**

Use a per-suite ephemeral server and `try/finally`. Cover all slide IDs, navigation states, overview, four languages, console errors, image failures, offline mode, and supported viewports. Translation leakage tests inspect visible text directly and never depend on a production-only audit global.

- [ ] **Step 2: Verify RED where legacy bugs remain**

Run: `npm run test:browser`
Expected: FAIL until all generated-runtime contracts are implemented.

- [ ] **Step 3: Complete runtime parity**

Fix only failures demonstrated by the browser tests. Replace fixed sleeps with DOM conditions.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm run qa`
Commit: `test: add deterministic browser and multilingual qa`

### Task 11: Cutover and Legacy Quarantine

**Files:**
- Modify: `index.html`
- Create: `legacy/README.md`
- Move: obsolete update scripts to `legacy/unsafe-write-scripts/`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add failing cutover checks**

Extend `project-contract.test.mjs` to reject executable legacy write scripts under `test/` or `scratch/`, require the root entry to redirect to `dist/`, and require generated output drift checks.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/project-contract.test.mjs`
Expected: FAIL while legacy writers remain active.

- [ ] **Step 3: Quarantine unsafe scripts and switch entry**

Move obsolete writers without executing them, document why they are unsafe, update root navigation, and retain `ppt/index.html` as a dated rollback artifact until the release checkpoint is accepted.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm run qa && git diff --check`
Commit: `chore: cut over to generated deck and quarantine legacy writers`

### Task 12: Repository and Release Gate

**Files:**
- Create: `.github/workflows/qa.yml`
- Create: `.gitattributes`
- Create: `docs/maintenance/release-checklist.md`
- Modify: `README.md`

- [ ] **Step 1: Add release-contract assertions**

Require CI to run `npm ci` and `npm run qa`, enforce binary/LFS policy declarations, document privacy/source review, and record the release SHA and artifact checksum.

- [ ] **Step 2: Verify RED and implement**

Run: `node --test tests/unit/project-contract.test.mjs` before and after adding the workflow and release documentation.

- [ ] **Step 3: Run the complete release gate**

```bash
npm ci
SOURCE_DATE_EPOCH=1784073600 npm run build
SOURCE_DATE_EPOCH=1784073600 npm run qa
git diff --check
```

Expected: all tests pass, build check is clean, no browser process remains, and only intentionally modified files are present.

- [ ] **Step 4: Commit**

Commit: `ci: enforce reproducible slide release gate`

## Final Review Checklist

- [ ] A routine one-slide text edit needs at most five files.
- [ ] `dist/index.html` is the only release artifact and is never hand-edited.
- [ ] All 21 stable slide IDs are derived from `deck-manifest.json`.
- [ ] All four dictionaries have identical keys and pass leakage checks.
- [ ] Claims and sources have valid references and checksums.
- [ ] Public assets contain no identifiable participant filenames.
- [ ] No runtime CDN or unpinned dependency remains.
- [ ] Initial media and generated-size budgets pass.
- [ ] Legacy write scripts cannot run from normal test/scratch paths.
- [ ] Fast, shared, browser, offline, and deterministic-build gates pass from a clean install.
