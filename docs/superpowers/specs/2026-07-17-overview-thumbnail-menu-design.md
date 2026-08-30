# Overview Thumbnail Menu Design

## Goal

Replace the title-only ESC overview with a compact visual index that previews every rendered slide and labels each entry with a fixed English and Japanese title.

## Scope

This is a Level M shared-component change. It owns only the ESC overview runtime, overview styling, and directly related tests. It does not change slide content, slide order, claims, sources, translations, carousel geometry, or page-local layouts.

## Approved Direction

Use a four-column compact thumbnail grid on desktop. All 16 current slides should remain scannable within the overview without replacing their visual content with title-only placeholders. On narrow viewports, use two columns and allow the overview itself to scroll.

Each overview entry contains:

1. A stable 4:3 preview frame showing the corresponding rendered slide.
2. A two-line caption below the preview.
3. The zero-padded slide number and English short title on the primary line.
4. The Japanese short title on the secondary line.

The English and Japanese labels come from the existing `en` and `ja` dictionaries and remain EN+JA regardless of the active display language. The slide preview reflects the rendered deck content available when the overview is built.

## Runtime Architecture

`src/runtime/overview.mjs` continues to own overview construction and navigation. For each source slide it will create one button, clone the rendered slide into a dedicated preview viewport, and append a semantic caption.

The preview clone is inert presentation content. Runtime construction must:

- remove current-slide and animation state that could hide content;
- remove or neutralize interactive focus targets;
- remove IDs from the cloned subtree so the document has no duplicate IDs;
- mark the preview subtree as hidden from assistive technology;
- preserve the original slide DOM unchanged;
- preserve the existing click action that dispatches `GO_TO` for the selected stable slide index.

`mountOverview` will receive the existing dictionaries so it can resolve `slides.<stable-prefix>.shortTitle` from `en` and `ja`. Missing dictionary entries fall back to the source slide short title and then the stable slide ID without preventing the overview from opening.

## Layout

The overview remains a full-viewport overlay. The grid uses four equal columns on desktop with stable 4:3 preview frames. Each cloned slide keeps its authored 4:3 coordinate system and is uniformly scaled to fit the frame without cropping.

Captions sit outside and below the preview so they never obscure slide content. English is the stronger line; Japanese is smaller and visually secondary. Text must wrap rather than overflow.

On viewports at or below 700 px, the grid uses two columns, tighter gaps, and vertical scrolling inside the overlay. The language control remains available without covering the final row.

## Interaction And Accessibility

- Each complete preview and caption is one native button.
- Clicking or keyboard-activating the button navigates to that slide and closes the overview through the existing controller behavior.
- The button accessible name includes the slide number, English title, and Japanese title.
- Preview clones are non-interactive and excluded from the accessibility tree.
- Existing Escape behavior and language controls remain unchanged.

## Testing

Add or update focused tests before implementation to require:

- one overview button and one visual preview for every manifest slide;
- a cloned slide inside each 4:3 viewport rather than a title-only item;
- fixed English and Japanese caption text sourced from the dictionaries;
- no IDs or focusable controls inside preview clones;
- click navigation to the selected stable slide;
- four desktop columns and two narrow-screen columns;
- no clipping or overlap in desktop and narrow screenshots.

Run the Level M gates after the focused test passes:

```bash
npm run test:shared
npm run build
npm run test:browser
git diff --check
```

Capture desktop and narrow screenshots of the open overview for visual inspection.

## Risks And Boundaries

Cloning full slides can duplicate identifiers, event targets, and hidden animation state. Sanitizing clones before insertion is therefore part of the runtime contract, not optional styling cleanup.

Large embedded media may increase overview rendering cost. The implementation must reuse existing asset URLs and must not create new encoded image copies or add dependencies. If full browser testing exposes a material performance regression, optimization stays limited to overview clone construction and asset loading.

The existing dirty working tree belongs to ongoing work. Implementation and commits must touch only the declared overview files and exact related test paths, while leaving all other modifications intact.
