# Cross-Page Morph Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, bidirectional cross-page morph system for the page 2-3 attention diagram and page 3-4 workshop diagram without coupling component motion to carousel geometry.

**Architecture:** Slides declare stable component mounts; a small component registry renders shared semantic markup for each variant. A dedicated runtime captures source geometry before carousel state application, creates one fixed overlay, applies named-part FLIP transforms after the target settles, and cleans up deterministically. The manifest owns allowed adjacent connections and validators reject invalid registrations.

**Tech Stack:** ES modules, plain DOM and Web Animations API, CSS, JSON Schema, Node test runner, Playwright, esbuild.

---

## File Structure

- Create `src/components/cross-page/registry.mjs`: component IDs, supported variants, shared renderers, and mount hydration.
- Create `src/runtime/cross-page-components.mjs`: connection lookup, geometry helpers, transition lifecycle, cancellation, and cleanup.
- Create `tests/unit/cross-page-components.test.mjs`: pure connection and geometry contracts.
- Create `tests/browser/cross-page-components.test.mjs`: page 2-4 forward/reverse behavior and reduced-motion regression.
- Modify `schemas/deck-manifest.schema.json`: schema for `crossPageComponents`.
- Modify `scripts/lib/validate-project.mjs`: semantic validation for registered component chains.
- Modify `tests/unit/validate-project.test.mjs`: invalid and valid registry cases.
- Modify `deck-manifest.json`: register the two approved chains.
- Modify `src/content/slides/s02-background.json`: replace local attention diagram with an expanded component mount.
- Modify `src/content/slides/s04-knowledge-overload.json`: replace local attention and workshop diagrams with two component mounts.
- Modify `src/content/slides/s05-evaluation-limit.json`: replace the local bottom flow with the gap-loop mount and split its giant markup string.
- Modify `src/styles/components.css`: shared component variants and fixed overlay layer.
- Modify `src/styles/layouts.css`: page-local mount sizing only; remove duplicated diagram internals.
- Modify `src/runtime/main.mjs`: hydrate components and subscribe the morph runtime before the carousel.
- Modify `src/entry.html`: add `#cross-page-layer` under the stage.
- Modify `AGENTS.md`: concise maintenance rules and change-level thresholds.
- Modify `dist/index.html`: generated only through `npm run build`.

### Task 1: Manifest Contract

**Files:**
- Modify: `schemas/deck-manifest.schema.json`
- Modify: `scripts/lib/validate-project.mjs`
- Modify: `tests/unit/validate-project.test.mjs`
- Modify: `deck-manifest.json`

- [ ] **Step 1: Write failing validator tests**

Add a valid two-slide manifest fixture and assertions for duplicate instances, unknown component IDs, unknown slide IDs, non-adjacent endpoints, identical endpoints, unsupported variants, and durations outside 200-1200 ms. The accepted component/variant map is:

```js
const CROSS_PAGE_COMPONENT_VARIANTS = new Map([
  ['attention-path', new Set(['expanded', 'barrier'])],
  ['workshop-flow', new Set(['workshop', 'gap-loop'])]
]);
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/validate-project.test.mjs`

Expected: FAIL because `validateManifest()` does not inspect `crossPageComponents`.

- [ ] **Step 3: Implement schema and semantic validation**

Add required connection fields `instanceId`, `componentId`, `from`, `to`, and `durationMs`. Validate adjacency by manifest slide indexes and reject unknown IDs or variants with messages containing the instance ID.

- [ ] **Step 4: Register approved chains**

Add exactly:

```json
"crossPageComponents": [
  {
    "instanceId": "background-attention",
    "componentId": "attention-path",
    "from": { "slideId": "s02-background", "variant": "expanded" },
    "to": { "slideId": "s04-knowledge-overload", "variant": "barrier" },
    "durationMs": 760
  },
  {
    "instanceId": "workshop-research-gap",
    "componentId": "workshop-flow",
    "from": { "slideId": "s04-knowledge-overload", "variant": "workshop" },
    "to": { "slideId": "s05-evaluation-limit", "variant": "gap-loop" },
    "durationMs": 760
  }
]
```

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/unit/validate-project.test.mjs && npm run validate:content`

Expected: all validator tests pass and content validation reports 20 slides.

- [ ] **Step 6: Commit**

```bash
git add schemas/deck-manifest.schema.json scripts/lib/validate-project.mjs tests/unit/validate-project.test.mjs deck-manifest.json
git commit -m "feat(deck): register cross-page component chains"
```

### Task 2: Shared Component Renderers

**Files:**
- Create: `src/components/cross-page/registry.mjs`
- Create: `tests/unit/cross-page-components.test.mjs`
- Modify: `src/content/slides/s02-background.json`
- Modify: `src/content/slides/s04-knowledge-overload.json`
- Modify: `src/content/slides/s05-evaluation-limit.json`

- [ ] **Step 1: Write failing renderer tests**

Test `renderCrossPageComponent()` and `hydrateCrossPageComponents()` for both component families and all four variants. Assert one root, stable `data-morph-part` keys, no inline styles, no scripts, and identical shared-part key sets across each pair.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/cross-page-components.test.mjs`

Expected: FAIL with module-not-found for `registry.mjs`.

- [ ] **Step 3: Implement the registry**

Export:

```js
export const componentDefinitions = new Map([
  ['attention-path', { variants: new Set(['expanded', 'barrier']), render: renderAttentionPath }],
  ['workshop-flow', { variants: new Set(['workshop', 'gap-loop']), render: renderWorkshopFlow }]
]);

export function renderCrossPageComponent({ componentId, instanceId, variant }) {
  const definition = componentDefinitions.get(componentId);
  if (!definition?.variants.has(variant)) throw new Error(`unsupported ${componentId}/${variant}`);
  return definition.render({ instanceId, variant });
}

export function hydrateCrossPageComponents({ root = document } = {}) {
  const mounts = [...root.querySelectorAll('[data-cross-page-component]')];
  for (const mount of mounts) {
    if (mount.dataset.crossPageHydrated === 'true') continue;
    mount.innerHTML = renderCrossPageComponent({
      componentId: mount.dataset.crossPageComponent,
      instanceId: mount.dataset.crossPageInstance,
      variant: mount.dataset.crossPageVariant
    });
    mount.dataset.crossPageHydrated = 'true';
  }
  return mounts;
}
```

The attention renderer always emits `information`, `axis`, `attention`, `encoding`, `integration`, `consolidation`, and `signage`. The workshop renderer always emits `gap-1`, `participants`, `field-research`, `idea-discussion`, `prototype-design`, `gap-2`, and connector parts. Variant classes determine which parts occupy space.

- [ ] **Step 4: Replace slide-local duplicates with mounts**

Use mount-only markup:

```html
<div class="cross-page-mount attention-mount"
  data-cross-page-component="attention-path"
  data-cross-page-instance="background-attention"
  data-cross-page-variant="expanded"></div>
```

Page 3 uses `barrier` and `workshop`; page 4 uses `gap-loop`. Split page 4 into a markup-fragment array and preserve all non-component meaning.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/unit/cross-page-components.test.mjs tests/unit/render-slide.test.mjs`

Expected: all tests pass and no slide contains duplicated internal component markup.

- [ ] **Step 6: Commit**

```bash
git add src/components/cross-page/registry.mjs tests/unit/cross-page-components.test.mjs src/content/slides/s02-background.json src/content/slides/s04-knowledge-overload.json src/content/slides/s05-evaluation-limit.json
git commit -m "refactor(deck): share page two to four diagrams"
```

### Task 3: Runtime Morph Engine

**Files:**
- Create: `src/runtime/cross-page-components.mjs`
- Modify: `tests/unit/cross-page-components.test.mjs`
- Modify: `src/runtime/main.mjs`
- Modify: `src/entry.html`

- [ ] **Step 1: Write failing pure-runtime tests**

Test these exports:

```js
findCrossPageConnection(connections, fromSlideId, toSlideId)
pairMorphParts(sourceParts, targetParts)
inverseRectTransform(sourceRect, targetRect)
```

Assert forward/reverse lookup, stable pairing, and transforms containing translation and scale but no opacity.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/cross-page-components.test.mjs`

Expected: FAIL because runtime helpers are missing.

- [ ] **Step 3: Implement pure helpers and lifecycle**

Export `mountCrossPageComponents({ controller, slides, connections, layer })`. Subscribe before the carousel; on a registered adjacent action capture source geometry synchronously, hide both mounts, then use two animation frames to measure the post-carousel destination, clone the destination component into the fixed overlay, and animate outer plus named-part inverse transforms to identity.

Cleanup must:

```js
overlay?.remove();
sourceMount?.removeAttribute('data-cross-page-hidden');
targetMount?.removeAttribute('data-cross-page-hidden');
controller.setNavigationLocked(false);
```

Forced navigation, language change, resize, pagehide, missing parts, missing animation support, and low-power mode finalize immediately.

- [ ] **Step 4: Wire initialization order**

Add `#cross-page-layer` after `#deck`. In `main.mjs`, hydrate mounts before controller-bound i18n, then mount the cross-page runtime before `mountCarousel()`.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/unit/cross-page-components.test.mjs tests/dom/*.test.mjs`

Expected: all tests pass with deterministic cleanup.

- [ ] **Step 6: Commit**

```bash
git add src/runtime/cross-page-components.mjs src/runtime/main.mjs src/entry.html tests/unit/cross-page-components.test.mjs
git commit -m "feat(runtime): animate registered cross-page components"
```

### Task 4: Component Geometry And Variants

**Files:**
- Modify: `src/styles/components.css`
- Modify: `src/styles/layouts.css`
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add the motion token and overlay contract**

Register `--dur-cross-page:.76s` and `--ease-cross-page:cubic-bezier(.16,1,.3,1)`. Style `#cross-page-layer` as fixed, inset zero, pointer-events none, and above slide content but below overview UI.

- [ ] **Step 2: Implement shared component variants**

Use shared `.cross-page-component`, `.attention-path`, and `.workshop-flow` selectors. Variants control grid tracks and clipping; slide selectors only size `.cross-page-mount`. Remove obsolete `.s02-path-*`, `.s02-signage-node`, `.s04-attention-*`, and `.s04-workshop-*` internals.

- [ ] **Step 3: Verify static policy**

Run: `npm run test:shared && npm run build`

Expected: CSS audit passes, the generated deck builds, and component markup has no inline styles.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/styles/components.css src/styles/layouts.css dist/index.html
git commit -m "style(deck): define cross-page component variants"
```

### Task 5: Browser Transition Contract

**Files:**
- Create: `tests/browser/cross-page-components.test.mjs`

- [ ] **Step 1: Write failing browser tests before enabling final transition classes**

Cover page 2→3, 3→2, 3→4, and 4→3. At transition start assert one overlay and hidden endpoints; at midpoint assert the overlay remains fully opaque and detached from the moving source slide; after 800 ms assert no overlay, no hidden mounts, correct current slide, and target rectangle agreement within one pixel.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/browser/cross-page-components.test.mjs`

Expected: FAIL on the first missing overlay or geometry assertion.

- [ ] **Step 3: Complete transition and cancellation behavior**

Adjust runtime only to satisfy the browser contract. Add repeated wheel/keyboard input checks, narrow viewport checks, `en-ja` and `zh` geometry checks, and reduced-motion residue checks.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/browser/cross-page-components.test.mjs`

Expected: all forward, reverse, narrow, language, input-lock, and reduced-motion cases pass.

- [ ] **Step 5: Commit**

```bash
git add tests/browser/cross-page-components.test.mjs src/runtime/cross-page-components.mjs src/styles/components.css
git commit -m "test(deck): cover cross-page morph transitions"
```

### Task 6: Maintenance Rule And Level-H Verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `dist/index.html`
- Create: `output/qa/cross-page-components/` screenshots (ignored, not committed)

- [ ] **Step 1: Add the concise agent rule**

Document stable IDs, mount-only slide markup, renderer ownership, manifest registration, Level L/M/H thresholds, no component-wide opacity, no carousel coupling, and the page 2-4 registered instances.

- [ ] **Step 2: Run complete release gate**

Run:

```bash
npm ci
npm run build
npm run qa
git diff --check
```

Expected: all commands pass and `dist/index.html` is current.

- [ ] **Step 3: Capture and inspect screenshots**

Capture pages 2, 3, and 4 at 1440x1000 and 390x844 for `en-ja` and `zh`, plus midpoint frames for both forward chains. Inspect for overlap, clipping, duplicate diagrams, blank components, and text overflow.

- [ ] **Step 4: Perform second review and rollback audit**

Confirm carousel geometry and title rail files changed only where declared; confirm removing `crossPageComponents` connections produces immediate static mounts; confirm the unrelated dirty worktree files remain untouched.

- [ ] **Step 5: Commit final documentation and generated artifact**

```bash
git add AGENTS.md dist/index.html
git commit -m "docs(deck): codify cross-page component maintenance"
```

## Completion Record

The final handoff records:

- Task ID: `cross-page-morph-components-v1`
- Change level: H
- Base commit: `289eca3`
- Final commit: recorded after implementation
- Files changed: exact committed paths from Tasks 1-6
- Commands: validator tests, shared tests, focused browser tests, `npm ci`, build, QA, and diff check
- Generated artifact: rebuilt and verified current
- Risks: Web Animations fallback, narrow viewport geometry, language-triggered cancellation
- Privacy/source decision: no research assets or claims changed
