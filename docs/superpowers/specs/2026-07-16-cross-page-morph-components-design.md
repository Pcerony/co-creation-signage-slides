# Cross-Page Morph Components Design

**Status:** Approved by the user on 2026-07-16

**Date:** 2026-07-16

**Change level:** H - shared runtime, motion contract, component architecture, and three-slide behavior

## 1. Objective

Establish a reusable cross-page component system for visual structures that represent one continuing idea across adjacent slides. During navigation, the component must temporarily leave the moving slide track, transform geometrically, and land in the destination slide without appearing to travel with either page.

The first release applies the contract to two chains:

1. Page 2 to page 3: the interpretive-signage attention path changes from a four-stage learning path to the compact attention barrier row.
2. Page 3 to page 4: the co-creation workshop process changes from a four-step workshop strip to a research-gap loop with `GAP 1` and `GAP 2` endpoints.

Both chains must also work in reverse.

## 2. Non-Goals

- Do not create a general animation editor or timeline language.
- Do not use cross-page motion for ordinary text, decorative elements, or unrelated charts.
- Do not change carousel slot geometry, fullscreen behavior, title-rail behavior, claims, or research meaning.
- Do not duplicate a component's internal markup in individual slide files.
- Do not use opacity to conceal a failed geometric transition.

## 3. Chosen Architecture

Use a build-time component registry plus an independent runtime morph layer.

- Slide content declares a stable component mount, instance ID, and variant.
- A shared component renderer owns each component's semantic parts and markup.
- `deck-manifest.json` owns the allowed adjacent-page morph connections.
- `cross-page-components.mjs` measures endpoints, creates one fixed overlay, coordinates the morph, and restores the destination mount.
- `carousel.mjs` continues to own only page-track geometry and current/previous/next state.

This is preferred over duplicated slide markup because one source remains authoritative. It is preferred over the native View Transition API because the portable artifact must behave consistently in the supported offline browser. It is preferred over moving the live source node because an overlay clone preserves both pages' layout and makes cancellation deterministic.

## 4. Identity And Registration

Every cross-page component uses three identifiers:

- `componentId`: renderer and component family, such as `attention-path`.
- `instanceId`: one narrative object across slides, such as `background-attention`.
- `variant`: the slide-specific form, such as `expanded` or `barrier`.

The manifest registers directed adjacent connections. Reverse navigation is derived automatically.

```json
{
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
}
```

Validation must reject duplicate instance connections, unknown slide IDs, non-adjacent endpoints, unknown component IDs, unsupported variants, durations outside the registered motion-token range, or a mount missing from either endpoint.

## 5. Slide Authoring Contract

Slide files contain only a mount declaration at the intended layout position:

```html
<div
  data-cross-page-component="attention-path"
  data-cross-page-instance="background-attention"
  data-cross-page-variant="expanded"
></div>
```

Rules:

1. Component markup, icons, semantic part names, and shared wording belong to the component renderer, not the slide file.
2. Slide CSS may size the mount but must not select internal component parts.
3. Component CSS may use the declared variant but must not modify the surrounding slide grid.
4. Every morphable child has a stable `data-morph-part` key.
5. A part present in one variant but absent in another remains represented as a zero-size clipped endpoint so geometry can collapse or expand without a whole-component fade.
6. Translated component text continues to use the existing stable i18n keys. `en-ja` annotations are created by the shared language policy, not duplicated in component markup.

## 6. Runtime Sequence

For a registered adjacent navigation:

1. Capture the source mount and each source part rectangle before carousel state changes.
2. Mark source and target mounts `visibility: hidden`; their layout footprints remain intact.
3. Let the carousel move the pages to their new stable positions.
4. Measure the destination mount and destination part rectangles after the carousel state is applied.
5. Place a fixed overlay above the deck at the source rectangle.
6. Render the overlay in destination structure, then apply inverse transforms so its outer box and named parts visually match the source.
7. Animate outer position, dimensions, named-part translation, scale, clipping, border, and registered color tokens to the destination geometry.
8. Remove the overlay, reveal the destination mount, clear temporary attributes, and unlock navigation.

The overlay is attached to a dedicated `#cross-page-layer` under `#presentation-stage`, not inside `#deck`. It therefore remains in viewport coordinates while the slide track moves behind it.

## 7. Motion Contract

- Duration: 760 ms for both initial chains.
- Easing: the existing strong geometric production curve `cubic-bezier(0.16, 1, 0.3, 1)`.
- Outer and inner geometry start in the same animation frame and finish together.
- The visual component remains fully opaque. No component-wide fade is allowed.
- Entering or leaving parts use scale, height, gap, translation, and `clip-path`; opacity may not be the primary transition mechanism.
- Page motion and component motion are concurrent. The component remains visually detached from the moving pages for the whole transition.
- Navigation is locked until cleanup to prevent double dispatch and skipped pages.
- The overlay must not intercept pointer input.

### 7.1 Attention path morph

- `INFORMATION`, `01 ATTENTION`, and the interpretive-signage node retain stable part IDs.
- The four learning rows compress into the single barrier row when moving page 2 to page 3.
- Rows 2-4 collapse toward the active attention axis using clipping and vertical compression.
- Reverse navigation expands the same parts back to their page 2 positions.

### 7.2 Workshop flow morph

- Participants, field research, idea discussion, prototype design, and their connectors retain stable part IDs.
- Moving page 3 to page 4 preserves the central process while the component changes width and container treatment.
- `GAP 1` and `GAP 2` expand geometrically from the left and right boundaries.
- Reverse navigation collapses both GAP endpoints and returns the central steps to the page 3 workshop strip.

## 8. Coordination And Cancellation

`cross-page-components.mjs` subscribes before `carousel.mjs`. It captures source geometry synchronously, then completes destination measurement on the next animation frame after carousel state application.

The component runtime owns its navigation lock and must release it exactly once. It never writes carousel transforms or slide state classes.

An active morph is cancelled and finalized immediately when:

- navigation uses `force`;
- the viewport resizes;
- overview opens;
- the language changes;
- the document is hidden or unloaded;
- a required mount or named part cannot be measured.

Cancellation reveals the endpoint matching the controller's current state and removes every overlay and hidden-state attribute.

## 9. Reduced Motion And Failure Fallback

When low-power or `prefers-reduced-motion` mode is active, apply the destination page and component variant immediately with no overlay.

If Web Animations, a component renderer, a manifest connection, or measurable endpoints are unavailable, navigation still succeeds. The runtime reveals the destination component and reports a diagnostic only through the existing debug surface in development; the portable presentation must not display an error message.

## 10. Performance And Accessibility

- At most one overlay and one active component morph may exist.
- Measurements are batched before writes and after the carousel state change to avoid layout thrashing.
- Animation uses transforms and clipping where possible; layout-sensitive width and height are limited to the single fixed overlay.
- Component instances are rendered before i18n and icon hydration so normal language and icon behavior remains unchanged.
- The overlay is `aria-hidden="true"`; only the destination mount participates in the accessibility tree after navigation.
- Hidden endpoints use `visibility`, never `display: none`, during measurement.
- No runtime network request or new dependency is permitted.

## 11. Maintenance Thresholds

- Level L: edit component wording through existing i18n keys only; do not change part IDs or variants.
- Level M: adjust registered component colors, spacing, or one existing variant without changing the runtime protocol.
- Level H: add a new component family, connection, part mapping, motion primitive, duration policy, or runtime behavior.

A small agent handling ordinary slide detail must not read the runtime. It only needs the target slide mount, the relevant component renderer, and matching language keys. A major change must read this specification, the manifest connection, the runtime module, component module, styles, and direct tests.

## 12. Verification Contract

Unit tests must prove:

- manifest connection validation;
- forward and reverse connection lookup;
- stable named-part pairing;
- generated keyframes contain geometry and no component-wide opacity;
- cancellation resolves to the controller's current endpoint;
- reduced-motion bypasses overlay creation.

Browser tests must prove at desktop and narrow viewports:

- page 2 to 3 and page 3 to 2 use one overlay and never show duplicate components;
- page 3 to 4 and page 4 to 3 use one overlay and preserve the central workshop steps;
- the overlay's first rectangle matches the source within one pixel;
- the overlay remains detached from the moving page at midpoint;
- the final rectangle matches the destination within one pixel;
- both endpoint mounts are visible after cleanup;
- repeated wheel or keyboard input cannot skip a page;
- `en-ja` and `zh` produce the same geometry contract without overflow;
- reduced-motion navigation has no transition residue.

Final QA follows the Level H gate in `AGENTS.md`, including `npm ci`, `npm run build`, `npm run qa`, `git diff --check`, desktop and narrow screenshots for pages 2-4 in `en-ja` and `zh`, deterministic-build verification, and a second code review before integration.

## 13. Affected Interfaces And Rollback

Affected interfaces:

- `deck-manifest.json`: new cross-page component registry.
- slide 2-4 content: component mounts replace duplicated diagram markup.
- component registry and two component renderers: shared semantic structures.
- runtime initialization: component rendering and morph lifecycle.
- styles: overlay layer, component variants, and named-part geometry.
- validation and browser tests: registry and transition contracts.

Rollback is bounded: remove the two manifest connections and restore the three slide-local diagram blocks. The carousel, title rail, language system, and fullscreen geometry remain independent and require no rollback.
