# Page Four Research Gap Hover Design

## Scope

Revise stable slide `s05-evaluation-limit` without changing slide order, chapter ownership, claims, assets, or the registered `workshop-research-gap` cross-page component.

## Content Hierarchy

- Treat the two columns as `GAP 1` and `GAP 2`, not research questions.
- Remove the visible `Research Question 1/2` labels in all Phase A display content.
- Keep each gap title visible above its image at rest.
- Move each existing explanatory paragraph into the corresponding image interaction layer.

## Interaction

- Each image container is a focusable interactive figure.
- Default state: show the image without an overlay; keep the gap badge and title above it.
- Hover or keyboard-focus state: apply a subtle blur to the image and reveal a translucent white overlay containing the existing explanatory paragraph.
- The overlay covers the full image area and uses a short opacity transition.
- Losing hover or focus restores the default image state.
- Reduced-motion mode removes the transition while preserving the state change.

## Layout And Ownership

- Slide markup owns the two local gap figures and their overlay copy.
- Page-specific styles in `src/styles/layouts.css` own hover, focus, blur, and overlay geometry.
- No runtime module is required; CSS pseudo-state behavior is sufficient.
- The bottom `workshop-flow` mount remains unchanged and outside the interactive figures.
- The visual exception is explicitly requested: the white overlay is an interaction state, not a persistent card surface.

## Accessibility

- Figures use `tabindex="0"` so keyboard users can reveal the same content with `:focus-visible`.
- Each figure receives an accessible label that identifies its gap.
- Overlay text remains real DOM text and does not rely on generated CSS content.
- Text contrast remains readable over the translucent white layer.

## Verification

- Browser test the default, hover, keyboard-focus, and reduced-motion states.
- Assert that no research-question labels remain visible.
- Assert that the overlay paragraph matches the corresponding gap content.
- Verify desktop and narrow screenshots for slide 4.
- Run shared tests, build, browser tests, and `git diff --check`.
