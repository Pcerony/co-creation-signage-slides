# Focused 4:3 Deck Redesign

## Goal

Rebuild the presentation surface so the current slide remains dominant while the
right edge of the previous slide and the left edge of the next slide remain
visible. The deck must read as a compact research presentation rather than a
full-screen website.

## Scope

- Keep the existing 19-slide research narrative and multilingual content.
- Compress each slide to one claim plus one evidence group. Remove repeated
  explanations, secondary labels, and long prose where the data or image already
  communicates the point.
- Rebuild pages 2 and 3 as editorial evidence pages: one heading and one short
  copy column on the left, with a dominant field image on the right. Do not nest
  a second heading inside a neutral card.
- Change every slide to a fixed 4:3 landscape canvas.
- Show the current slide centered, with narrow, clipped previews of adjacent
  slides on both sides.
- Add rounded corners to the slide canvas and to meaningful visual elements.
- Keep the chapter timeline in the upper indicator area. Show the active slide
  heading and overall page number in the lower footer; do not render a wide
  progress bar or a two-row title header.
- Preserve keyboard, wheel, touch, click-to-navigate, overview, language switch,
  reduced-motion, and low-power behavior.

## Display Architecture

The viewport becomes a neutral presentation stage. `#deck` remains the source of
truth for all slide elements, but it is transformed as a horizontal carousel
inside a fixed stage rather than as a `100vw` strip.

Each `.slide` has a fixed logical size of 1200 by 900 pixels and scales uniformly
to fit the available viewport. The stage reserves vertical space for the top
indicator and horizontal space for adjacent-slide peeks. The current slide is
centered. Neighboring slides remain in the DOM, receive state classes, and are
visibly clipped by the viewport.

The carousel uses one shared geometry calculation based on the rendered slide
width and the inter-slide gap. Navigation changes the carousel transform by one
pitch. No slide-specific JavaScript positioning is allowed.

## Top Indicator

The indicator is outside the slide canvases and contains:

- A chapter timeline with clickable slide dots in the upper region.
- The active slide heading and overall page number in the lower footer.
- Runtime-only chapter and local-position fields retained for compatibility.

Chapter metadata is stored directly on each slide through `data-chapter` and
`data-chapter-title`. The runtime derives page values from the current slide.
The indicator updates on every `go()` call and after language changes.

## Content Compression

The deck keeps 19 slides to preserve the current speaking sequence. Compression
follows these rules:

1. One visible claim per slide.
2. At most one short explanatory paragraph.
3. At most three metrics or evidence items per slide.
4. Repeated method explanation is removed once introduced.
5. Captions describe evidence, not interface mechanics.
6. Long multilingual translations are allowed to wrap but may not increase the
   slide's logical dimensions.
7. Visible text remains fully readable; the focused canvas does not truncate
   copy or use viewport-dependent font sizes.

Existing content is simplified in place so translation lookup and slide-specific
motion recipes remain compatible.

## Visual System

- Stage background: quiet neutral grey with no decorative gradients.
- Slide radius: 18 logical pixels.
- Media, charts, controls, and intentional ink/accent surfaces: 8 to 12 logical
  pixels.
- Generic neutral content cards are open editorial groupings: transparent paper,
  no shadow or rounded container, and one separating rule. Data surfaces,
  accent/ink blocks, and functional image frames remain bounded where their
  contrast or geometry carries meaning.
- Current slide uses a restrained shadow and full opacity.
- Adjacent previews use reduced opacity and no blur so their content remains
  recognizable.
- The existing forest green remains the accent. Neutral paper, ink, grey, and
  photographic assets prevent a one-note palette.
- Sharp Swiss rules remain, but their containers gain subtle rounding where a
  bounded surface exists.

## Interaction

- Left/right arrows, Page Up/Down, space, wheel, and swipe retain their current
  behavior.
- Clicking the visible previous or next slide preview navigates to that slide.
- Clicking the current slide does not navigate.
- ESC overview remains available and shows all 19 4:3 thumbnails in a 4-column,
  5-row grid.
- On narrow screens, adjacent previews become slimmer but remain visible.

## Testing

Automated structural tests must fail before implementation and then verify:

- Logical slide dimensions are 1200 by 900 or an equivalent 4:3 ratio.
- The deck uses a carousel pitch rather than `100vw` navigation.
- Previous, current, and next state classes are assigned.
- The top indicator exposes the upper chapter timeline and lower title/page
  footer, without a full-width progress bar or a two-row title header.
- `go()` updates the top indicator and neighboring slide states.
- Pages 2 and 3 expose one `h2`, no nested `h3`, a visible evidence image, and
  a stable left-copy/right-image desktop layout that stacks on narrow screens.
- Neutral card reduction preserves intentional data, accent, ink, and image
  surfaces while removing generic nested white card treatments.
- Existing motion and internationalization tests continue to pass.

Browser QA must capture at least one desktop viewport and one narrow viewport,
confirm the center slide is fully visible, both adjacent previews are present,
the top indicator does not overlap the slide, and navigation changes all state
correctly.

## Non-goals

- No change to research claims, sample counts, or numerical results.
- No new backend, framework, build system, or external data dependency.
- No conversion to a different presentation format.
- No replacement of the existing image assets.
