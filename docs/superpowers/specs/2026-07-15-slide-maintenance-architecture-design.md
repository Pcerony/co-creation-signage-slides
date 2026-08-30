# Slide Maintenance Architecture Design

**Status:** Approved design baseline

**Date:** 2026-07-15

**Scope:** Project structure, source materials, build system, runtime, tests, and multi-agent maintenance rules. Slide visual and narrative redesign is outside this specification.

## 1. Objective

Replace the current hand-edited, 5,800-line presentation HTML with modular source files that build deterministically into one portable `dist/index.html`.

The resulting system must let a small model complete routine slide edits by reading only the target slide data, its language entries, and one short maintenance rule. Shared runtime and design changes must remain possible through a documented, fully verified heavy-change path.

## 2. Success Criteria

The migration is complete only when all of the following are true:

1. `dist/index.html` is generated and never edited directly.
2. A text-only slide change requires reading no more than five project files.
3. Slide content, translations, sources, and assets use stable IDs rather than visible Chinese text or page numbers as identifiers.
4. One command performs a clean install and one command runs the complete release gate.
5. A clean clone can build and test without relying on ignored local dependencies.
6. The runtime remains usable without a network connection.
7. The initial page does not decode every heatmap and full-resolution image.
8. No participant name or unapproved research data appears in tracked public assets.
9. Routine edits have a fast validation path; shared and visual changes have progressively stronger gates.
10. Project records, page counts, navigation, and QA derive from a single manifest.

## 3. Non-Goals

- Redesigning slide content, visual style, or narrative.
- Replacing the existing three-slide carousel interaction unless required for correctness or performance.
- Introducing a general-purpose frontend framework.
- Creating a content-management server or database.
- Preserving obsolete string-replacement scripts.

## 4. Chosen Approach

Use plain JavaScript ES modules, structured JSON/YAML content, and a deterministic Node.js build script. The source is modular; the release artifact is one self-contained HTML file.

This approach is preferred over keeping the monolith because it sharply reduces the context needed for edits. It is preferred over a multi-file release because the project retains a portable presentation artifact that can be opened or hosted without deployment coordination.

## 5. Target Repository Structure

```text
.
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── deck-manifest.json
├── sources.yml
├── claims.yml
├── src/
│   ├── entry.html
│   ├── content/
│   │   ├── chapters.json
│   │   └── slides/
│   │       ├── s01-cover.json
│   │       └── s21-references.json
│   ├── i18n/
│   │   ├── zh.json
│   │   ├── en.json
│   │   ├── ja.json
│   │   └── es-MX.json
│   ├── layouts/
│   │   ├── registry.js
│   │   ├── evidence.js
│   │   ├── process.js
│   │   ├── comparison.js
│   │   ├── data.js
│   │   └── closing.js
│   ├── runtime/
│   │   ├── deck-controller.js
│   │   ├── navigation.js
│   │   ├── carousel.js
│   │   ├── overview.js
│   │   ├── i18n.js
│   │   ├── motion.js
│   │   └── asset-loader.js
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── stage.css
│   │   ├── layouts.css
│   │   ├── components.css
│   │   └── languages.css
│   └── assets/
│       ├── presentation/
│       ├── thumbnails/
│       ├── fonts/
│       └── vendor/
├── scripts/
│   ├── build.mjs
│   ├── validate-content.mjs
│   ├── validate-i18n.mjs
│   ├── validate-assets.mjs
│   ├── validate-claims.mjs
│   └── capture-slides.mjs
├── tests/
│   ├── unit/
│   ├── dom/
│   ├── browser/
│   └── fixtures/
├── dist/
│   └── index.html
└── docs/
    ├── maintenance/
    └── superpowers/
```

Each source file has one responsibility. Files that small models frequently change are separated from shared runtime and styling code.

## 6. Source-of-Truth Model

### 6.1 Deck manifest

`deck-manifest.json` owns slide order, stable slide IDs, chapter membership, layout name, content file, asset IDs, and claim IDs. Page numbers are computed and must not be stored in slide markup.

```json
{
  "schemaVersion": 1,
  "deckId": "co-creation-signage-report",
  "defaultLanguage": "zh",
  "languages": ["zh", "en", "ja", "es-MX"],
  "slides": [
    {
      "id": "s01-cover",
      "chapterId": "background",
      "layout": "cover",
      "content": "src/content/slides/s01-cover.json",
      "assets": ["cover-qr"],
      "claims": []
    }
  ]
}
```

The manifest is validated against a JSON Schema. Duplicate IDs, missing content files, unknown layouts, missing assets, and unknown claims fail the build.

### 6.2 Slide content

Each slide file stores semantic content and layout slots, not HTML or CSS.

```json
{
  "id": "s17-result-coverage",
  "titleKey": "slides.s17.title",
  "summaryKey": "slides.s17.summary",
  "metrics": [
    { "labelKey": "slides.s17.control", "value": "38.6", "unit": "%" },
    { "labelKey": "slides.s17.intervention", "value": "45.3", "unit": "%" }
  ],
  "claimIds": ["claim-initial-coverage"]
}
```

Layout modules accept validated content objects and return DOM strings or nodes. Content files cannot contain arbitrary scripts, inline event handlers, or inline styles.

### 6.3 Internationalization

Language dictionaries use stable semantic keys such as `slides.s17.title`. The Chinese dictionary is no longer inferred from visible DOM text.

All dictionaries must have the same key set. Validation fails on missing keys, extra keys, duplicate JSON properties, empty translations, or disallowed Chinese leakage in English and Spanish values. Japanese uses a separate configurable leakage rule because Japanese legitimately contains CJK characters.

### 6.4 Sources and claims

`sources.yml` records source identity and provenance:

```yaml
sources:
  - id: source-aoi-analysis-v1
    path: sources/extracted/aoi-analysis-v1.txt
    sha256: "required lowercase SHA-256 digest calculated from the source file"
    sourceType: analysis
    title: AOI analysis corrected sample
    versionDate: 2026-07-15
    access: restricted-derived
```

`claims.yml` binds every research number or strong conclusion to a source and permitted wording strength:

```yaml
claims:
  - id: claim-initial-coverage
    sourceId: source-aoi-analysis-v1
    locator: lines 349-353
    sample: 9 valid corrected heatmaps
    metric: relative text-region coverage in first 10 seconds
    allowedStrength: exploratory trend
```

The build only verifies referential integrity and checksums. Scientific review remains a human responsibility and is recorded through an `approvedBy` and `approvedAt` release ledger rather than inferred by code.

## 7. Runtime Architecture

`DeckController` is the sole owner of mutable presentation state:

```js
{
  currentSlideIndex: 0,
  language: "zh",
  overviewOpen: false,
  lowPowerMode: false
}
```

Runtime modules receive state and explicit callbacks. They do not discover or mutate unrelated globals. Only a small diagnostic API may be exposed under `window.__deckDebug` in non-production builds.

Responsibilities are separated as follows:

- `navigation.js`: keyboard, click, and URL navigation.
- `carousel.js`: slide states and three-slide geometry.
- `overview.js`: overview lifecycle and thumbnail selection.
- `i18n.js`: dictionary lookup and language application.
- `motion.js`: animation recipes and reduced-motion behavior.
- `asset-loader.js`: current/adjacent asset preloading and deferred media loading.

Runtime initialization must be idempotent. Event listeners are registered once and every module provides a cleanup function for browser tests.

## 8. Styling Architecture

`tokens.css` defines the logical 1200x900 canvas, typography scale, spacing, colors, radii, z-index levels, and motion timing. Layout and component CSS consume only registered tokens except where intrinsic media dimensions require explicit values.

Rules:

1. No new inline styles in slide data or generated markup.
2. No viewport-relative font sizes.
3. New `!important` declarations require a documented exception in `docs/maintenance/style-exceptions.md`.
4. Layout modules own geometry; component styles do not override slide-specific grids.
5. Language-specific adjustments live only in `languages.css` and must not hide or truncate text.
6. All supported layouts declare their minimum slot count, maximum density, and permitted assets in the layout registry.

## 9. Build Pipeline

`npm run build` executes these deterministic stages:

1. Validate schemas, manifest references, source checksums, claims, assets, and translations.
2. Render each slide from its layout module and semantic content.
3. Bundle runtime modules and CSS with pinned local dependencies.
4. Optimize and embed approved fonts, icons, thumbnails, and release-critical images.
5. Embed a build metadata block containing source commit, schema version, and build timestamp controlled by `SOURCE_DATE_EPOCH` for reproducibility.
6. Write to a temporary file, validate the generated HTML, then atomically replace `dist/index.html`.

The build must support `npm run build -- --check`, which compares generated output without modifying files. CI uses check mode to detect stale artifacts.

## 10. Performance Design

Performance budgets are release gates rather than suggestions:

- Generated HTML before embedded presentation media: at most 750KB uncompressed.
- Initial decoded image memory: at most 24MiB at the desktop test viewport.
- Initial render must load only the current, previous, and next slide media plus overview thumbnails.
- Heatmaps load on slide entry or participant selection, not at document startup.
- Overview uses generated thumbnails rather than cloned full slide DOM.
- No unversioned CDN dependency or runtime network request is permitted.
- Navigation response begins within one animation frame after input in the reference browser test.

Large original research images remain outside the release bundle. Build-time asset variants provide dimensions appropriate for the logical canvas.

## 11. Test Strategy

### Fast gate: routine content edits

Runs in seconds and includes schema, manifest, translation-key, claim-reference, asset-existence, generated-page-count, and syntax checks.

Command: `npm run test:fast`

### Shared gate: runtime and component changes

Adds DOM behavior tests for controller state, navigation, i18n switching, overview lifecycle, lazy loading, and layout rendering.

Command: `npm run test:shared`

### Release gate: design, layout, and build changes

Adds Chromium browser tests across supported viewports and languages, screenshot comparison for affected slides, accessibility checks, performance budgets, offline mode, and deterministic build verification.

Command: `npm run qa`

Every browser suite owns its temporary server and closes browser/server resources in `finally`. Fixed ports and unconditional sleeps are prohibited.

## 12. Multi-Agent Maintenance Contract

The root `AGENTS.md` is short and routes agents to task-specific instructions. It defines three change levels.

### L: Local detail change

Examples: one slide's wording, translation, asset reference, numeric value, or registered token value.

- Read: root `AGENTS.md`, target content file, relevant language entries, and referenced claim/source entry.
- Modify: only those files and generated output when required.
- Verify: `npm run test:fast -- --slide <slide-id>` and `npm run build -- --check`.
- Screenshot: not required unless text wrapping or media presentation changes.

### M: Shared behavior change

Examples: one layout, component, language rule, asset loader, or navigation behavior.

- Declare ownership of the shared module before editing.
- Read the module, its direct tests, tokens, and affected layout registry entry.
- Verify targeted tests, `npm run test:shared`, and desktop/narrow screenshots of affected slides.

### H: Major design or architecture change

Examples: canvas geometry, carousel, typography scale, global tokens, layout registry contract, build pipeline, or multiple layout families.

- Work from an approved design note and isolated worktree/branch.
- Record affected interfaces, migration steps, rollback point, and performance impact.
- Run the full release gate and inspect all affected screenshots.
- Require a second-agent code review and a human check of claims/privacy when research data is affected.

All levels prohibit editing `dist/index.html` directly, running legacy write scripts, staging unrelated work, or overwriting a dirty shared tree.

## 13. Small-Model Task Packet

Every implementation or maintenance task handed to a small model must contain:

```text
Task ID:
Change level: L | M | H
Goal:
Allowed files:
Files to read first:
Forbidden files/actions:
Exact acceptance checks:
Exact commands:
Expected outputs:
Stop and escalate when:
Handoff fields:
```

Tasks must be independently executable and should target one commit. A small model is never asked to "review the whole project" before a local edit.

## 14. Data and Privacy Governance

- Raw participant data and identifiable filenames are removed from the code repository and stored in an access-controlled research location.
- Presentation assets use anonymous participant IDs.
- A migration ledger maps old filenames to anonymous IDs outside public Git history.
- `DATA_GOVERNANCE.md` defines consent scope, permitted derivatives, publication status, retention, and deletion responsibility.
- CI rejects filenames matching configured personal-name patterns in public asset directories.
- Release review distinguishes public, internal, restricted-derived, and restricted-raw materials.

Removing sensitive data from the current tree is not treated as removing it from Git history. History remediation requires a separately approved operation and remote coordination.

## 15. Migration Strategy

Migration is incremental and keeps a usable release artifact at every checkpoint.

1. Establish dependency locking, root documentation, CI, and a read-only baseline of current behavior.
2. Create manifest, schemas, and validators without changing rendered behavior.
3. Extract stable slide IDs, content, translations, and claim references.
4. Extract design tokens and CSS while retaining snapshot parity.
5. Extract runtime modules behind `DeckController`.
6. Implement lazy assets, thumbnails, offline vendor files, and performance budgets.
7. Switch the release path to generated `dist/index.html`.
8. Quarantine and then delete obsolete update scripts after parity and rollback checkpoints pass.
9. Complete privacy migration, repository asset cleanup, and release documentation.

Each stage has a compatibility checkpoint and its own commit series. The old entry remains available as a rollback artifact until the generated build passes the complete release gate.

## 16. Failure Handling and Rollback

- Validators print the stable slide/source/claim ID and exact file path, never only a page number.
- Build failures leave the previous `dist/index.html` untouched.
- Migration stages use tagged checkpoints so a failed stage can be reverted without discarding later research materials.
- No automated script rewrites source files unless invoked with an explicit `--write`; check mode is the default for migration tools.
- Destructive Git history cleanup, asset deletion, or source anonymization requires human confirmation and a verified backup.

## 17. Definition of Done

The architecture is accepted when a clean clone can run:

```bash
npm ci
npm run build
npm run qa
git diff --exit-code
```

and the commands finish successfully with:

- one generated `dist/index.html`;
- identical manifest and rendered slide counts;
- zero missing or leaked translation keys;
- zero unknown claims, sources, layouts, or assets;
- zero runtime console errors;
- all performance and offline budgets satisfied;
- no direct changes to generated output;
- no tracked identifiable participant asset in public directories.
