# Stable Track Transition

**Status:** Approved by the user's explicit rewrite request on 2026-07-15

## Goal

Replace mode-boundary FLIP compensation with a stable carousel geometry in which no slide, including adjacent slides, is reflowed when the current slide changes between presentation and fullscreen modes.

## Root cause

The previous runtime changed global shell width, height, scale, and gap according to the current page mode. Every shell therefore received new geometry at a fullscreen boundary. Animating only the source and target shells could not preserve other visible neighbors, so adjacent pages still jumped.

## Geometry contract

- Compute one presentation-size slot width, slot height, and track gap for the viewport.
- Keep those slot dimensions unchanged for every shell and every current-page mode.
- Compute the deck X position from the fixed slot pitch only.
- Center each logical 1200x900 slide inside its slot.
- Render ordinary and adjacent slides at presentation scale.
- When a registered fullscreen slide becomes current, animate only that slide's local scale from presentation scale to fullscreen scale around the slot center.
- Move the deck vertically so the current slot center reaches the viewport center in fullscreen mode.
- Never change track pitch, shell dimensions, or neighboring slide scale because another slide became fullscreen.

## Motion contract

- The deck X/Y transform and current slide scale use the same 800ms symmetric easing.
- When entering fullscreen, keep the outgoing presentation slide and the opposite adjacent slide unclipped for the complete 800ms movement; hide non-current slides only after the track settles.
- Stage chrome follows the existing geometric vertical exit and entry.
- No opacity transition, cloned content, temporary source/target layers, FLIP measurement, or Web Animations API is used.
- Navigation remains locked for the boundary duration to reject repeated input.
- Reduced-motion mode applies final transforms immediately.

## Runtime boundary

`carousel.mjs` computes stable slot geometry, applies the two scale variables, changes current/adjacent classes, and manages only the short navigation lock. CSS centers slides in their slots and transitions deck position plus current fullscreen scale.

## Verification

- Unit tests prove shell width, height, gap, and pitch are identical in presentation and fullscreen states.
- Browser tests prove the current slide and both visible neighbors preserve their first-frame rectangles, and that the outgoing presentation slide remains unclipped at midpoint.
- Midpoint tests prove the deck and current slide are moving/scaling while remaining opaque.
- Final desktop and narrow screenshots retain the intended fullscreen and presentation framing.
