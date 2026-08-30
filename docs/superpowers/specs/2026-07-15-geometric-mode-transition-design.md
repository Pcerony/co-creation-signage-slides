# Geometric Mode Transition

**Status:** Approved by the user's explicit direction on 2026-07-15

## Goal

Make fullscreen/presentation boundaries communicate one continuous horizontal deck. The transition must emphasize direction, translation, and scale; it must not hide geometry with opacity.

## Motion contract

- Keep the existing navigation lock for the duration of a mode-boundary transition.
- Snap the underlying global deck geometry to its target without exposing the page-index-amplified track transform.
- Preserve the outgoing shell at its pre-layout viewport rectangle with a FLIP transform, then move it out in the navigation direction.
- Preserve the target shell at its exact pre-layout adjacent-page rectangle, then move and scale it continuously to its final rectangle. Do not replace that real starting position with an arbitrary viewport-relative offset.
- Keep both slide shells fully opaque throughout the transition. Do not animate deck or slide opacity.
- Move the top indicator above the viewport and the footer below it in fullscreen mode; return both along the same vertical paths in presentation mode.
- Use the same duration and production easing for source translation, target translation, target scale, and chrome movement.
- Reduced-motion mode applies the target geometry immediately without an intermediate animation.

## Runtime boundary

`carousel.mjs` owns transition measurements, FLIP keyframes, navigation direction, animation cleanup, and the navigation lock. CSS owns transition-layer stacking, the no-opacity contract, and chrome transforms. No slide content, manifest, language, claim, or source files change.

## Failure handling

- If Web Animations are unavailable or either shell cannot be measured, apply the target state immediately and release the navigation lock.
- Forced diagnostic navigation cancels active animations before applying its destination.
- Cleanup cancels every running animation, removes temporary shell classes, and releases the lock.

## Verification

- Unit tests prove the generated keyframes contain translation and scale but no opacity.
- Browser tests prove rapid input cannot skip pages 15, 16, or 17.
- Browser tests prove the target shell's first-frame rectangle matches its pre-transition rectangle within one pixel, then sample the midpoint and prove both shells are visible, displaced, and fully opaque.
- Desktop and narrow screenshots confirm final fullscreen and presentation geometry remain unchanged.
