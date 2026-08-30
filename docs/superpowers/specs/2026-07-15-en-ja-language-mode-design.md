# EN+JA Composite Language Mode

**Status:** Approved 2026-07-15

## Goal

Add `en-ja` as a fifth language mode and make it the default. English remains
the primary presentation language. Important text receives a smaller Japanese
line immediately after the English text by reusing the existing `en` and `ja`
dictionaries.

## Data Contract

- Keep the four source dictionaries: `zh`, `en`, `ja`, and `es-MX`.
- Add `en-ja` to `deck-manifest.json.languages` and set it as
  `defaultLanguage`.
- Record `en-ja` in a manifest composite-language map with `en` as primary,
  `ja` as secondary, and `balanced-emphasis` as its policy.
- Do not create or maintain `en-ja.json`.

## Balanced Emphasis Policy

Japanese appears after:

- titles, section titles, and subtitles;
- keywords, named principles, and category labels;
- KPI/metric labels and key numeric explanations;
- quotations, conclusions, and key statements.

Japanese does not automatically follow long body paragraphs, author/date
metadata, source metadata, or reference-list details.

A centralized selector policy owns the default classification. Individual
elements may use `data-hybrid-ja="always"` or `data-hybrid-ja="never"` for
exceptions. Per-slide key allowlists and duplicated bilingual strings are
forbidden.

## Runtime Behavior

The i18n runtime captures translatable text once. In `en-ja` mode it renders the
English value and inserts one Japanese annotation for targets selected by the
policy. Switching to any base language removes every generated annotation.
`document.documentElement.lang` remains `en` in composite mode, while the body
uses `lang-en-ja` for styling.

Japanese annotations use normal weight, zero letter spacing, approximately
`0.62em`, a compact line height, and reduced emphasis. They are block-level
annotations so English remains the first reading layer.

## UI

The language control exposes `EN+JA` alongside ZH, EN, JA, and ES. The already
removed top cover language bar remains removed; only the surviving bottom cover
control is updated.

## Verification

- Manifest/schema validation accepts the explicit composite contract.
- Dictionary validation still audits exactly four source dictionaries.
- Runtime unit tests cover composite resolution and emphasis classification.
- Browser tests assert `en-ja` is default, Japanese annotations appear on all
  slides where important text exists, annotations disappear in base modes, and
  no console/image errors occur.
- Desktop and 390px viewports must remain framed without incoherent overlap.

## Existing Work Protection

The current uncommitted `s01-cover.json` and `dist/index.html` changes are the
approved baseline. Implementation must preserve the removed top language bar,
stage only explicitly owned files, and regenerate rather than hand-edit `dist`.
