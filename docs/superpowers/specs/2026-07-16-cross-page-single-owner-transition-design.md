# Cross-Page Single-Owner Transition Design

**Status:** Approved by the user on 2026-07-16

**Change level:** H - shared motion lifecycle and component visibility contract

## Objective

Make every registered cross-page component behave as one continuous card rather
than two page-local copies. The component must keep an opaque card surface for
the full transition, start without a first-frame jump, and remain visible only
on the currently owned page while idle.

## Ownership Contract

- At rest, only the mount on the current slide may render visibly.
- Matching mounts on previous and next slides retain layout space but use
  `visibility: hidden` and do not participate in accessibility.
- At transition start, ownership moves from the source mount to one fixed
  overlay cloned from the source card.
- At transition completion, ownership moves atomically from the overlay to the
  destination mount.
- Cancellation resolves ownership to the controller's current slide and never
  reveals both endpoint mounts.
- Reduced-motion navigation skips the overlay and transfers ownership directly.

## Motion Model

The runtime captures both source and destination geometry before changing any
visibility. The overlay is created at the source rectangle with the source
component's complete background, border, radius, shadow, and content. It then
animates its own fixed-position `transform` from the exact source rectangle to
the destination rectangle. Internal named parts animate only their variant
differences inside that moving card.

The overlay must be present and visually identical to the source before the
first animated frame. Page-track and overlay animations start in the same frame.
No opacity animation, transparent shell, separate background surface, or
post-layout coordinate correction is allowed.

## Implementation Boundaries

- `src/runtime/cross-page-components.mjs` owns endpoint measurement, ownership,
  overlay lifecycle, cancellation, and navigation locking.
- `src/styles/components.css` owns card containment and hidden-owner states.
- Component renderers continue to own semantic markup and named morph parts.
- Carousel geometry, slide content, claims, translations, and fullscreen rules
  are out of scope.

## Verification

Browser tests must prove forward and reverse behavior for both registered
component chains: one visible owner while idle, an empty destination mount before
navigation, one fully styled overlay during navigation, first-frame source-rect
continuity, no opacity keyframes, destination-only visibility after cleanup, and
correct cancellation/reduced-motion ownership. Desktop screenshots must inspect
pages 2-4 and a paused midpoint.

Rollback is limited to the runtime, component visibility styles, tests, and this
contract; no slide content rollback is required.
