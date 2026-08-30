# Native 16:9 Fullscreen Slides

**Status:** Approved by the user's explicit request on 2026-07-15

## Goal

Change every registered fullscreen slide from a 4:3 logical canvas to a native 16:9 logical canvas without stretching content, destabilizing the carousel track, or changing ordinary presentation slides.

## Scope

- Fullscreen slide IDs remain `s01-cover`, `s08-research-process`, and `s16-heatmap-overview`.
- Those slides use a 1600x900 logical canvas in both adjacent preview and current fullscreen states.
- Ordinary slides remain 1200x900.
- Slide content, translations, claims, sources, and asset references are unchanged.
- The stage height and configured page gap remain unchanged; the horizontal track uses static page-specific slot widths.

## Geometry Contract

- A fullscreen-capable slide is centered inside the existing stable shell.
- When it is adjacent in stage mode, it scales uniformly to the same rendered height as an ordinary slide; its additional 16:9 width may extend beyond the stable 4:3 slot.
- The track reserves that additional preview width in the fullscreen slide's shell, so the configured gap is preserved on both sides without overlap.
- When it is current, it scales uniformly to the largest uncropped 16:9 rectangle that fits the viewport.
- During entry to fullscreen, the runtime offsets the two visible neighboring slides by the signed difference between the fullscreen canvas and its stage slot, preserving the configured gap while the current canvas expands or contracts.
- No non-uniform scaling, clipping, or viewport-filling crop is allowed.
- Changing the current slide must not change any page's precomputed shell width, stage height, or configured gap.
- The fullscreen slide's local scale and the deck movement continue to use the existing synchronized geometric transition.

## Runtime and Style Boundary

`carousel.mjs` remains the source of truth for fullscreen IDs and assigns reusable capability and shell classes to those slides. `stageGeometry()` computes separate logical dimensions and scales for ordinary presentation slots, fullscreen previews, and the current fullscreen slide, then derives deck position from the static sequence of slot widths. CSS consumes those dimensions but does not infer fullscreen identity from page number or content.

## Verification

- Unit tests prove a 16:9 current fullscreen rectangle and stable track pitch.
- Browser tests prove exactly the registered slides use 16:9 canvases while an ordinary slide remains 4:3.
- Browser tests prove every fullscreen preview keeps both its stage height and the configured gap to its immediate neighbor.
- Browser transition tests retain first-frame and midpoint continuity checks.
- Desktop and narrow screenshots cover slides 1, 8, and 16.
- The full build and QA gates must pass.

## Rollback

Revert the focused implementation commit. The earlier stable-track implementation remains intact because no content schema, manifest entry, or slide registry is migrated.
