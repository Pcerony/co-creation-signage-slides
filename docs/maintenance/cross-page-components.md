# Cross-page Component Maintenance

This document is the current operating contract for components that continue
across adjacent slides. Read it only when a task names a registered cross-page
component or requests a new cross-page relationship. Historical design context
lives in `docs/superpowers/specs/2026-07-16-cross-page-morph-components-design.md`.

## Current registrations

| Instance ID | Component | Source slide / variant | Destination slide / variant |
|---|---|---|---|
| `background-attention` | `attention-path` | `s02-background` / `expanded` | `s04-knowledge-overload` / `barrier` |
| `workshop-research-gap` | `workshop-flow` | `s04-knowledge-overload` / `workshop` | `s05-evaluation-limit` / `gap-loop` |

The slide IDs are stable identifiers. Visible page numbers are presentation
labels and must never be used for component lookup.

At rest, a connected component has exactly one visible owner: its mount on the
current slide. The matching mount on an adjacent slide keeps its layout space
but remains hidden and `aria-hidden` until the transition arrives. During a
transition, one fixed overlay owns the complete card, including its opaque
background, border, radius, and internal parts. Never animate a transparent
component skeleton separately from its card surface, and never reveal the
destination copy before overlay cleanup transfers ownership to it.

Registered cross-page components are the only slide elements allowed to own a
card surface. Their background, border, radius, and shadow are part of the
moving component. Page-local context around a mount must remain unboxed and
must use spacing, type, dividers, and color rather than a second card surface.

For `workshop-research-gap`, only field research, idea discussion, prototype
design, their connectors, and the two gap markers belong to the morph. The
workshop title and participant card are page-local context on
`s04-knowledge-overload` and must stay outside the cross-page mount. In the
`gap-loop` variant, `GAP 1` is ordered between field research and idea
discussion; `GAP 2` remains after prototype design.

## Ownership map

| Concern | Source of truth | Maintenance rule |
|---|---|---|
| Instance, adjacency, endpoint variants, duration | `deck-manifest.json` | Register each connection once under `crossPageComponents` |
| Valid component and variant names | `src/components/cross-page/catalog.mjs` | Keep this catalog small and explicit |
| Shared markup and morph-part identity | `src/components/cross-page/registry.mjs` | Render once; slides contain mounts only |
| Endpoint size and placement | Target slide JSON plus `src/styles/layouts.css` | Page selectors may size the mount, not its internals |
| Variant appearance | `src/styles/components.css` | Use component and variant selectors |
| Overlay lifecycle and geometry | `src/runtime/cross-page-components.mjs` | Never duplicate this behavior in a slide or carousel module |
| Manifest and mount validation | `scripts/lib/validate-project.mjs` and `scripts/validate-content.mjs` | Reject invalid IDs, nonadjacent endpoints, and missing mounts |
| Behavior regression | `tests/unit/cross-page-components.test.mjs` and `tests/browser/cross-page-components.test.mjs` | Test forward, reverse, interruption, and reduced motion |

`dist/index.html` is generated and is never an editing surface.

## Identity contract

Every connection has three independent identifiers:

- `componentId` names the reusable component family.
- `instanceId` names one semantic object continuing between two slides.
- `variant` names the endpoint presentation of that object.

Each endpoint slide declares exactly one empty mount:

```html
<div class="cross-page-mount attention-mount"
  data-cross-page-component="attention-path"
  data-cross-page-instance="background-attention"
  data-cross-page-variant="expanded"></div>
```

The component renderer hydrates the mount. Do not paste rendered component
markup into slide JSON, and do not add a second copy to simulate continuity.

The corresponding manifest connection is:

```json
{
  "instanceId": "background-attention",
  "componentId": "attention-path",
  "from": { "slideId": "s02-background", "variant": "expanded" },
  "to": { "slideId": "s04-knowledge-overload", "variant": "barrier" },
  "durationMs": 760
}
```

Connections must follow adjacent entries in manifest slide order. Forward and
reverse navigation use the same registration.

## Morph-part contract

`data-morph-part` is the stable identity used to pair internal elements across
variants. All variants of one component family must render the same unique part
IDs in the same semantic order.

- Keep a part ID when its meaning continues, even if its size, color, position,
  border, or clipping changes.
- Add or remove a part only as a Level H architecture change. Update every
  variant and both unit and browser tests together.
- Never use CSS class names, visible text, DOM position, or translated strings
  as morph identity.
- Elements that visually disappear should normally remain in both variants and
  collapse geometrically with layout or `clip-path`.
- Do not animate component-wide opacity. The transition must show spatial
  continuity rather than conceal movement with a fade.

## Runtime sequence

1. The runtime resolves the connection from the previous and next stable slide IDs.
2. It snapshots the source mount and all named parts before the carousel moves.
3. It hides both endpoint mounts and locks repeated navigation.
4. On the next animation frame it measures the destination, creates one fixed
   overlay in `#cross-page-layer`, and clones the destination variant into it.
5. The overlay surface and paired parts transform from source geometry to
   destination geometry while the deck moves behind them.
6. After the stage transition settles, cleanup removes the overlay, restores
   both mounts, unlocks navigation, and cancels pending timers or animations.

The overlay is viewport-fixed and must not be placed inside `#deck`. The runtime
may read deck transforms to compensate geometry, but it must not write carousel
transforms, change slide state classes, or advance the slide index.

Resize, page hide, forced navigation, language change, and low-power mode must
leave no overlay, hidden mount, timer, animation, or navigation lock behind.

## Change levels and shortest safe workflow

### Level L: wording only

Use when changing text already connected to registered i18n keys.

Read only the relevant renderer line, matching `zh`/`en`/`ja` dictionary entries,
and the affected slide. Do not change component identity, markup, layout, or
motion. Follow Phase A language rules until the page is explicitly confirmed.

Run the Level L commands in `AGENTS.md`.

### Level M: one existing variant's appearance

Use when changing colors, borders, clipping, spacing, or mount dimensions
without changing part IDs, connection endpoints, or motion primitives.

Edit shared component styling in `src/styles/components.css`. Use
`src/styles/layouts.css` only for page-specific mount dimensions and placement.
Capture desktop and narrow screenshots for the affected endpoint slides in
`en-ja` and `zh` during Phase A.

Run:

```bash
npm run test:shared
npm run build
npm run test:browser
git diff --check
```

### Level H: identity, connection, variant, or motion

Use when adding a family, variant, instance, endpoint, `data-morph-part`, runtime
primitive, or nonadjacent navigation concept. This level requires an approved
design note and implementation plan before editing.

Run the complete Level H gate in `AGENTS.md`, including `npm ci`, `npm run qa`,
all affected language and viewport screenshots, and a second review.

## Adding a new connection

1. Confirm that both adjacent slides represent one continuing semantic object.
   Ordinary text, decoration, and unrelated charts do not qualify.
2. Reuse an existing component family and variants when their part identities
   match. Otherwise design a new family as Level H.
3. Register the family and variants in `catalog.mjs`.
4. Add one shared renderer in `registry.mjs`. Every variant must emit the same
   unique `data-morph-part` set.
5. Add one empty mount to each endpoint slide and size those mounts in page CSS.
6. Register the instance and endpoints in `deck-manifest.json` using stable IDs.
7. Add unit coverage for catalog, rendering, part equality, mount hydration,
   manifest validation, and forward/reverse lookup.
8. Add browser coverage for both directions, midpoint detachment, destination
   landing, repeated input, cleanup, reduced motion, and narrow `en-ja`/`zh` fit.
9. Build through `npm run build`; never modify `dist/index.html` directly.

## CSS boundaries

Allowed page-level rule:

```css
.slide[data-slide-id="s02-background"] .attention-mount {
  width: 100%;
  height: 132px;
}
```

Disallowed page-level rule:

```css
.slide[data-slide-id="s02-background"] .attention-path__stage {
  /* This reaches into shared component internals. */
}
```

Put internal component rules under the shared component selector and express
endpoint differences with `.is-<variant>`. Prefer layout, transform, border,
color, and `clip-path` changes that preserve visible geometric continuity.

## Required checks

Use focused tests while editing:

```bash
node --test tests/unit/cross-page-components.test.mjs
node --test tests/browser/cross-page-components.test.mjs
```

Before handoff, the selected L/M/H gate remains authoritative. For a Level H
cross-page change, acceptance additionally requires:

- exactly one overlay during the transition;
- two hidden endpoint mounts only while the overlay is active;
- no opacity property in component animation keyframes;
- correct source geometry at time zero and destination geometry at completion;
- no slide skipping under repeated input;
- no overlay in reduced-motion or low-power mode;
- no overflow on affected narrow `en-ja` and `zh` slides;
- current deterministic `dist/index.html` after the build.

## Failure diagnosis

| Symptom | First check | Typical cause |
|---|---|---|
| No morph occurs | Manifest instance and both mount attributes | Misspelled ID, unsupported variant, missing endpoint mount, or nonadjacent slides |
| Component appears twice | Count mounts and rendered internals | Duplicated slide markup instead of one hydrated mount |
| Component follows a moving page | Overlay parent and positioning | Overlay placed inside `#deck` or lost `position: fixed` |
| Jump at transition start | Source snapshot timing and target deck delta | Geometry measured after movement or without deck compensation |
| Destination flashes or disappears | Hidden attributes and cleanup timing | Endpoint restored before the 800 ms stage transition settles |
| Repeated key press skips a slide | Controller navigation lock | Runtime did not lock or cleanup unlocked too early |
| Reverse direction differs | Reverse browser scenario | Direction-specific markup, CSS, or endpoint assumptions |
| Mobile clipping | Mount dimensions and named-part rectangles | Fixed internal width or page CSS reaching into component internals |
| Build check drifts | `git status --short` before rebuilding | Source changed after the artifact was generated; never patch the artifact |

## Handoff record

Record the task ID and change level, base and final commits, connection instance
IDs, component and variant IDs, exact files changed, commands and results,
screenshot paths, generated artifact status, and any unresolved reduced-motion,
viewport, language, source, or privacy risk. Stage only the named paths.
