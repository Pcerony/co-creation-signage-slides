# EN+JA Composite Language Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default `en-ja` presentation mode that reuses English and Japanese dictionaries and annotates important English text with smaller Japanese text.

**Architecture:** Declare the composite mode in the deck manifest, keep only four source dictionaries, and let the runtime combine `en` and `ja` through one balanced-emphasis policy. Generated annotations are disposable DOM nodes and never become content or dictionary source.

**Tech Stack:** Node.js ES modules, JSON Schema, browser DOM APIs, CSS, node:test, Playwright.

---

### Task 1: Composite Language Contract

**Files:**
- Modify: `deck-manifest.json`
- Modify: `schemas/deck-manifest.schema.json`
- Modify: `scripts/build.mjs`
- Modify: `scripts/validate-i18n.mjs`
- Modify: `scripts/lib/i18n.mjs`
- Test: `tests/unit/i18n.test.mjs`
- Test: `tests/unit/validate-project.test.mjs`

- [ ] Add a failing unit fixture with `languages: ["en-ja", "zh", "en", "ja", "es-MX"]`, `defaultLanguage: "en-ja"`, and:

```json
"compositeLanguages": {
  "en-ja": { "primary": "en", "secondary": "ja", "policy": "balanced-emphasis" }
}
```

- [ ] Assert missing component languages, self-references, and unknown default languages fail validation.
- [ ] Extend the schema and manifest with the exact contract above.
- [ ] Export `sourceLanguageIds(manifest)` so build and i18n validation load `zh`, `en`, `ja`, and `es-MX` once while excluding `en-ja`.
- [ ] Run `node --test tests/unit/i18n.test.mjs tests/unit/validate-project.test.mjs`; expect PASS.

### Task 2: Balanced Emphasis Runtime

**Files:**
- Create: `src/runtime/hybrid-language.mjs`
- Modify: `src/runtime/i18n.mjs`
- Modify: `src/runtime/main.mjs`
- Test: `tests/dom/runtime.test.mjs`

- [ ] Add failing pure tests for `languageTag("en-ja") === "en"`, composite resolution to `{ primary: "en", secondary: "ja" }`, and the centralized selector string.
- [ ] Implement:

```js
export const BALANCED_EMPHASIS_SELECTOR = [
  'h1', 'h2', 'h3', '.lead', '.t-cat', '.tag', '.keyword', '.main-st',
  '.t-body-emp', '.quote', 'blockquote', '.kpi-cell .lbl', '.row-lbl',
  '.row-val', '.bar-tower .lbl', '.ledger-row', '.phase', '.ttl', '.col-ttl'
].join(',');
```

- [ ] Respect `data-hybrid-ja="always"` and `data-hybrid-ja="never"` before selector matching.
- [ ] In composite mode, set each captured node to the English value and insert one `<span class="hybrid-ja-text" lang="ja">` with the Japanese value for important targets.
- [ ] Remove all generated spans before every language render and on cleanup. Set the HTML language tag to `en` for `en-ja`.
- [ ] Pass `manifest.compositeLanguages` from `main.mjs` into `mountI18n`.
- [ ] Run `npm run test:shared`; expect PASS.

### Task 3: Language UI and Typography

**Files:**
- Modify: `src/content/slides/s01-cover.json`
- Modify: `src/entry.html`
- Modify: `src/styles/languages.css`
- Modify: `scripts/migrate-css.mjs`
- Test: `tests/unit/render-slide.test.mjs`

- [ ] Preserve the current removal of `.chrome-min`; add only this button to the surviving `.cover-lang-switch`:

```html
<button class="lang-top-btn" data-language="en-ja">EN+JA</button>
```

- [ ] Make `src/entry.html` start with `lang="en"` and `lang-en-ja`.
- [ ] Append the exact hybrid style to the migration-owned language CSS so drift checks stay valid:

```css
.hybrid-ja-text{
  display:block;margin-top:.22em;font-family:var(--sans-zh);font-size:.62em;
  font-weight:400;line-height:1.25;letter-spacing:0;text-transform:none;opacity:.72;
}
```

- [ ] Add compact spacing for labels and metrics, plus `body.lang-en-ja` selectors that prevent inherited negative or uppercase styling.
- [ ] Run `node scripts/migrate-css.mjs --write`, then `node scripts/migrate-css.mjs`; expect drift check PASS.

### Task 4: Generated Deck and Browser QA

**Files:**
- Modify: `tests/browser/deck.test.mjs`
- Modify: `tests/browser/performance.test.mjs`
- Generate: `dist/index.html`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] Add browser assertions that initial state is `en-ja`, the cover title starts in English, Japanese annotations exist, and switching to each base language removes annotations.
- [ ] Navigate all 21 slides and require at least one hybrid annotation on each slide containing an important translated target.
- [ ] Confirm five language buttons exist and `EN+JA` becomes active when selected.
- [ ] Document four source dictionaries plus one composite display mode and the `always/never` override.
- [ ] Run `npm ci`, `npm run build`, `npm run qa`, `node scripts/migrate-css.mjs`, and `git diff --check`; expect all checks PASS.
- [ ] Stage only owned files, preserving pre-existing unrelated modifications, and commit with `feat: add default en-ja language mode`.
