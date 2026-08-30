# Selected Fullscreen Slides

**Status:** Approved by user request on 2026-07-15

## Goal

Render slides `s01-cover`, `s08-research-process`, and `s16-heatmap-overview` fullscreen without stage chrome. All other slides use the focused carousel, top page metadata, and bottom chapter progress with balanced vertical spacing.

## Stage states

### Fullscreen state

- Selected by stable slide ID, never by visible page number.
- Hide the top metadata and bottom chapter progress without removing them from the DOM.
- Scale the 4:3 slide to the largest uncropped size that fits the viewport, center it in both axes, remove its radius and shadow, and extend the stage with the current slide's computed background color.
- Keep navigation, language controls, keyboard input, and adjacent-slide transitions active.

### Presentation state

- Active for every slide not listed in the fullscreen set.
- Preserve the existing 78% viewport-width limit and 4:3 geometry.
- Measure the top and bottom chrome heights, then divide remaining vertical whitespace into four equal gaps: viewport-to-top-meta, top-meta-to-slide, slide-to-progress, and progress-to-viewport.
- Recalculate on navigation and resize. The geometry must remain deterministic and must not depend on individual slide content.

## Runtime boundary

`carousel.mjs` owns stable-ID selection, stage geometry, the `fullscreen-stage` body class, and the short-lived transition state. CSS owns only the visual consequences. No slide content, dictionary, manifest, or research claim changes are required.

## Transition behavior

- Geometry, scale, and deck movement share one easing and duration.
- Crossing a mode boundary locks relative navigation until the current visual transition completes; repeated keys and adjacent-slide clicks cannot advance a second page.
- The deck fades fully out before global shell geometry is exposed and fades in only near the final position. This prevents page-index-amplified shell-width changes from appearing as a long horizontal flight, especially around slides 15-17.
- Chrome hides immediately when entering fullscreen and returns after the geometry transition has begun.
- Reduced-motion mode removes the softening animation and transition delay.

## Affected interfaces and rollback

- Affected: controller navigation gating, `mountCarousel()` geometry, fullscreen ID registry, root slide-size variables, deck top/transform, stage chrome offsets, radius/background, and mode-transition timing.
- Unaffected: controller actions, stable slide IDs, URLs, language state, slide markup, claims, sources, and generated-file policy.
- Rollback: restore the fullscreen set to `s01-cover`, remove `fullscreen-stage` transition styling, regenerate `layouts.css`, and rebuild `dist/index.html`.

## Verification

- Pure tests cover cover and presentation geometry.
- Browser tests confirm slides 1, 8, and 16 fill one viewport axis, hide both chrome components, and have no radius.
- Browser tests confirm slide 2 restores chrome and has four equal vertical gaps within pixel tolerance.
- Desktop and narrow screenshots must show no incoherent overlap or clipping.
