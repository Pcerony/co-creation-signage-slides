# Agent Maintenance Contract

This file is the mandatory entry point for every automated change.

## Source-of-truth order

1. `deck-manifest.json`: slide order, stable IDs, layouts, assets, and claim IDs.
2. `src/content/slides/`: visible slide content and semantic slots.
3. `src/i18n/`: translations keyed by stable IDs.
4. `claims.yml` and `sources.yml`: research wording and provenance.
5. `src/styles/` and `src/runtime/`: shared presentation behavior.
6. `dist/index.html`: generated output, never a source.

If two sources disagree, stop at the higher item and report the conflict. Page numbers and visible Chinese strings are not identifiers.

## Language modes

- `zh`, `en`, `ja`, and `es-MX` are source dictionaries. `en-ja` is the default composite display mode and must reuse `en` plus `ja`; never create an `en-ja.json` dictionary.
- The balanced-emphasis policy owns Japanese annotations. Do not duplicate Japanese text in slide markup.
- For an exceptional semantic target, use `data-hybrid-ja="always"` or `data-hybrid-ja="never"`. Changing the shared selector or annotation typography is Level M.

## Two-stage language workflow

Use this workflow for all page-by-page content-detail work unless the user explicitly requests another scope.

### Phase A: page draft, default

- The only acceptance targets are the `en-ja` and `zh` display modes.
- Update the target `zh` entry and the target `en`/`ja` entries required to generate `en-ja`. This technical reuse does not authorize separate English or Japanese polishing.
- Do not edit `es-MX`. Do not broaden review or screenshots to the three standalone display modes `en`, `ja`, and `es-MX`.
- Keep the task in Phase A until the user explicitly confirms the page is complete. An agent must not infer completion from passing tests or positive feedback.

### Phase B: confirmed-page synchronization

- Enter Phase B only after explicit page-complete confirmation from the user.
- Review the already shared `en` and `ja` entries as standalone languages, then synchronize `es-MX` from the confirmed meaning.
- Validate all five display modes only in this phase. Do not revise the confirmed `en-ja` or `zh` meaning while synchronizing without reporting the conflict.

## Frozen page content

- The visible content of `s02-background` and `s04-knowledge-overload` is user-confirmed and frozen, including the `60%` visit-motivation assertion and the `20%` deep-reading assertion.
- Layout, cross-page component, and animation work on these slides must preserve their wording, metrics, claim IDs, and semantic order.
- Do not paraphrase, fact-check away, replace, or remove this content during general review. Change it only when the user explicitly names one of these stable slide IDs or the exact assertion to revise.

## Cross-page component contract

- Cross-page identity and adjacency live in `deck-manifest.json`; page numbers are never component identifiers.
- A slide declares only a mount with `data-cross-page-component`, `data-cross-page-instance`, and `data-cross-page-variant`. Never duplicate component internals in slide markup.
- Shared markup and stable `data-morph-part` names live under `src/components/cross-page/`. Page CSS may size the mount but must not select component internals.
- `src/runtime/cross-page-components.mjs` owns the fixed overlay, navigation lock, cancellation, and cleanup. It must not write carousel transforms or slide state classes.
- Cross-page motion is geometric. Do not add component-wide opacity keyframes or hide movement with a fade.
- Existing registrations are `background-attention` for pages 2-3 and `workshop-research-gap` for pages 3-4; both directions must remain valid.
- Editing existing component wording through registered i18n keys is Level L. Styling one existing variant without changing part identity is Level M. Adding a cross-page component family, variant, connection, part mapping, or motion primitive is Level H.
- Before changing a registered component, read the current operating guide at `docs/maintenance/cross-page-components.md`. It defines ownership, shortest safe workflows, identity and CSS boundaries, required tests, and failure diagnosis.
- The historical design rationale is `docs/superpowers/specs/2026-07-16-cross-page-morph-components-design.md`; do not use it in place of the current operating guide.

## Before editing

- Run `git status --short` and do not stage, overwrite, or revert existing work.
- Work on a `codex/` branch. Shared modules require declared ownership in the task handoff.
- Read only the files permitted by the change level. Do not perform a repository-wide review for a local edit.
- Do not run `update-master-slides`, `update-slides`, or `scratch/update_languages.js`.
- Do not edit `dist/index.html`; run the builder.

## Level L: local detail

Use for one slide's text, translation, claim value, asset reference, or registered token value.

Read at most:

1. this file;
2. the target slide content file;
3. in Phase A, only the matching `zh`, `en`, and `ja` entries needed for `zh` and composite `en-ja`; in Phase B, add `es-MX`;
4. the referenced claim/source entry;
5. the directly related test when one exists.

Allowed files are the target files named in the task. Run:

```bash
npm run validate:content
npm run validate:i18n
npm run test:fast
npm run build
npm run build:check
git diff --check
```

No screenshot is required unless wrapping, cropping, media, or computed layout changes.

## Level M: shared component

Use for one layout, component, language rule, runtime module, or asset-loader behavior.

Read the owned module, its direct tests, referenced tokens, and affected registry entry. Run:

```bash
npm run test:shared
npm run build
npm run test:browser
git diff --check
```

Capture desktop and narrow screenshots only for affected slides. Do not modify unrelated layouts.

## Level H: major design or architecture

Use for canvas geometry, carousel behavior, typography scale, global tokens, layout contracts, build pipeline, or changes spanning multiple layout families.

Requirements:

- approved design note and implementation plan;
- isolated branch/worktree when the active source tree is clean;
- affected-interface and rollback ledger;
- complete browser, offline, accessibility, deterministic-build, and performance gates;
- screenshot inspection for every affected slide and supported language;
- second review before integration;
- human privacy/source review when research data changes.

Run:

```bash
npm ci
npm run build
npm run qa
git diff --check
```

## Generated files and dependencies

- Never hand-edit generated output.
- Never add a CDN or unpinned dependency.
- Use local fonts, icons, and runtime libraries.
- Build tools default to check/read-only mode; writing requires explicit intent.
- Temporary output belongs in ignored `tmp/`, `output/qa/`, or `dist/.tmp-*` paths.

## Visual surface rule

- Card surfaces are reserved for registered cross-page components. Their opaque background, border, radius, and shadow move as one complete surface during the transition.
- Ordinary slide content, text groups, captions, charts, images, semantic sections, and page-local labels must not receive card-like backgrounds, enclosing borders, or decorative shadows. Build hierarchy with spacing, alignment, typography, dividers, and color instead.
- A page-local label may use an icon and text, but it must remain visually unboxed. Any exception is a Level M change and requires explicit user approval plus a record in `docs/maintenance/style-exceptions.md`.

## Privacy and research claims

- Public assets use anonymous participant IDs.
- Do not add raw or identifiable participant material to Git.
- Every research number or strong conclusion needs a claim ID and source reference.
- Do not strengthen exploratory wording without human approval.

## Commit and handoff

One bounded task produces one focused commit. Stage exact paths only. The handoff must record:

- task ID and change level;
- base and final commit;
- files changed;
- commands and results;
- generated artifact status;
- unresolved risks or source/privacy decisions.

## Stop and escalate

Stop without editing unrelated files when:

- the manifest, slide content, claim, or source disagree;
- a requested file is already modified by another task;
- a participant identity or permission is uncertain;
- a test fails for a reason outside the allowed files;
- an L change affects shared layout/runtime behavior;
- three focused fix attempts fail;
- the task requires deleting history, raw data, or a user-owned untracked file.
