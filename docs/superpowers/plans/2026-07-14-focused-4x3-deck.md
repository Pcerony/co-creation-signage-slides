# Focused 4:3 Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 19-slide deck into a compact 4:3 carousel with visible adjacent-page edges, rounded surfaces, compressed content, and a chapter-aware indicator with a legacy footer.

**Architecture:** Keep the single-file HTML deck and its existing slide markup, translations, and motion system. Add a stage-level presentation shell, compute one responsive carousel geometry in JavaScript, and derive indicator state from slide metadata. Lock behavior with a structural Node test before modifying production code, then verify visually in a real browser.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js assertion scripts, Playwright CLI.

---

### Task 1: Lock the New Presentation Contract

**Files:**
- Create: `test/check-focused-deck.js`
- Test: `test/check-focused-deck.js`

- [ ] **Step 1: Write the failing structural test**

Create a Node script that reads `ppt/index.html` and asserts the required shell,
metadata, geometry, state classes, and indicator update hooks:

```js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'ppt', 'index.html'), 'utf8');

function check(name, pattern) {
  if (!pattern.test(html)) {
    console.error(`FAIL ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${name}`);
}

check('deck exposes a presentation stage', /id="presentation-stage"/);
check('slides use a fixed 4:3 logical canvas', /--slide-width:\s*1200px[\s\S]*--slide-height:\s*900px/);
check('top indicator includes chapter', /id="indicator-chapter"/);
check('top indicator includes title', /id="indicator-title"/);
check('top indicator includes page number', /id="indicator-page"/);
check('top indicator keeps the chapter timeline in the upper region', /id="presentation-indicator"[\s\S]*id="indicator-timeline-chapters"/);
check('legacy footer owns the title and page', /id="presentation-footer"[\s\S]*id="indicator-title"[\s\S]*id="indicator-page"/);
check('deprecated two-row header and wide progress bar are absent', !/indicator-detail-row|indicator-track/.test(html));
check('slides provide chapter metadata', /data-chapter="\d+"\s+data-chapter-title=/);
check('navigation assigns previous state', /classList\.toggle\('is-prev'/);
check('navigation assigns current state', /classList\.toggle\('is-current'/);
check('navigation assigns next state', /classList\.toggle\('is-next'/);
check('navigation updates indicator', /updatePresentationIndicator\(\)/);
check('carousel geometry is responsive', /updateCarouselGeometry/);
check('navigation no longer translates by viewport pages', !/translateX\(`?\$\{-idx\*100\}vw/.test(html) ? /[\s\S]*/ : /a^/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node test/check-focused-deck.js`

Expected: failures for the missing presentation stage, indicator, chapter
metadata, state classes, and responsive carousel geometry.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add test/check-focused-deck.js
git commit -m "test: define focused deck presentation contract"
```

### Task 2: Build the 4:3 Carousel and Indicator

**Files:**
- Modify: `ppt/index.html`
- Test: `test/check-focused-deck.js`
- Test: `test/check-motion-system.js`
- Test: `test/check-i18n-system.js`

- [ ] **Step 1: Add the stage and indicator markup**

Wrap the deck in a stage and place this indicator before it:

```html
<main id="presentation-stage">
  <header id="presentation-indicator" aria-live="polite">
    <div class="indicator-timeline-container">
      <div id="indicator-timeline-chapters"></div>
    </div>
  </header>
  <footer id="presentation-footer">
    <span id="indicator-title" class="chapter-sub-zh"></span>
    <span id="indicator-page" class="indicator-page-wrapper"></span>
    <div style="display:none;">
      <span id="indicator-chapter"></span>
      <span id="indicator-section-page"></span>
      <div class="indicator-track" aria-hidden="true"><span id="indicator-progress"></span></div>
    </div>
  </footer>
  <div id="deck">...</div>
</main>
```

- [ ] **Step 2: Replace viewport-sized slides with responsive 4:3 geometry**

Add logical canvas tokens and stage styles:

```css
:root {
  --slide-width:1200px;
  --slide-height:900px;
  --slide-radius:18px;
  --slide-gap:28px;
  --slide-scale:1;
  --slide-render-width:1200px;
  --slide-render-height:900px;
}
#presentation-stage { position:fixed; inset:0; overflow:hidden; }
#deck { position:absolute; display:flex; width:max-content; height:var(--slide-height); }
.slide {
  width:var(--slide-width);
  height:var(--slide-height);
  flex:0 0 var(--slide-width);
  border-radius:var(--slide-radius);
  transform:scale(var(--slide-scale));
  transform-origin:top left;
}
```

Use fixed logical pixels for slide geometry while leaving existing `vw` and
`vh` content sizing temporarily intact; a later compact-mode rule normalizes
text and spacing inside the scaled canvas.

- [ ] **Step 3: Add one geometry function and state updater**

Implement the runtime contract:

```js
function updateCarouselGeometry() {
  const indicatorHeight = presentationIndicator.offsetHeight;
  const maxHeight = innerHeight - indicatorHeight - 56;
  const maxWidth = innerWidth * 0.72;
  const scale = Math.min(maxWidth / 1200, maxHeight / 900, 1);
  const renderedWidth = 1200 * scale;
  const renderedHeight = 900 * scale;
  const gap = Math.max(16, Math.min(28, innerWidth * 0.018));
  document.documentElement.style.setProperty('--slide-scale', scale);
  document.documentElement.style.setProperty('--slide-render-width', `${renderedWidth}px`);
  document.documentElement.style.setProperty('--slide-render-height', `${renderedHeight}px`);
  document.documentElement.style.setProperty('--slide-gap', `${gap}px`);
  deck.style.gap = `${gap}px`;
  deck.style.top = `${indicatorHeight + 28}px`;
  positionDeck();
}

function updateSlideStates() {
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-prev', slideIndex === idx - 1);
    slide.classList.toggle('is-current', slideIndex === idx);
    slide.classList.toggle('is-next', slideIndex === idx + 1);
  });
}
```

`positionDeck()` must center the current slide using the rendered width, gap,
and current index. It must not use `100vw` page translation.

- [ ] **Step 4: Add chapter metadata and indicator updates**

Assign chapters across the existing sequence:

```text
01-02  01 / Context
03-06  02 / Research Design
07-12  03 / Method & Tool
13-14  04 / Result Overview
15-17  05 / Findings
18-19  06 / Discussion & Conclusion
```

Implement `updatePresentationIndicator()` to derive the chapter-local position,
read the active slide's `h1` or `h2` into the footer title, and set the overall
page string. Keep the chapter timeline dots synchronized with the current slide.

- [ ] **Step 5: Preserve interactions and add preview click navigation**

Add one delegated click handler:

```js
deck.addEventListener('click', event => {
  const slide = event.target.closest('.slide');
  if (!slide) return;
  if (slide.classList.contains('is-prev')) go(idx - 1);
  if (slide.classList.contains('is-next')) go(idx + 1);
});
```

Call the geometry function on `resize`, and call state plus indicator updates on
every `go()` invocation and language change.

- [ ] **Step 6: Run all structural tests and verify GREEN**

Run:

```bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
```

Expected: all checks pass with no warnings.

- [ ] **Step 7: Commit the carousel implementation**

```bash
git add ppt/index.html test/check-focused-deck.js
git commit -m "feat: present slides in a focused 4x3 carousel"
```

### Task 3: Compress Content and Round the Visual System

**Files:**
- Modify: `ppt/index.html`
- Modify: `ppt/项目记录.md`
- Test: `test/check-focused-deck.js`

- [ ] **Step 1: Add compact typography and spacing rules**

Create a focused block after existing layout rules that uses logical pixel
values inside the 1200 by 900 canvas. Override slide padding, headings, body
copy, grids, and captions so the scaled result remains legible:

```css
.slide { padding:48px 56px 54px; }
.slide h1,.slide h2 { letter-spacing:0 !important; }
.slide .h-xl-zh { font-size:52px !important; line-height:1.08; }
.slide .t-body { font-size:18px; line-height:1.45; }
.slide .t-body-sm { font-size:15px; line-height:1.4; }
.slide .chrome-min,.slide .t-meta { font-size:12px; }
```

- [ ] **Step 2: Apply rounded surfaces consistently**

Add radii without nesting decorative cards:

```css
.canvas-card,.card-fill,.sub-card,.frame-img,.tile img,.heatmap-side,
.flow-step,.data-tower,.duo-compare .col,.bar-track {
  border-radius:10px;
}
.slide img { border-radius:8px; }
.slide.is-current { box-shadow:0 24px 60px rgba(10,10,10,.16); }
.slide:not(.is-current) { opacity:.58; }
```

- [ ] **Step 3: Simplify each slide's visible copy**

Keep every numerical value and research boundary intact. Shorten visible copy
to one paragraph or three evidence points. Remove duplicated tool descriptions,
interface instructions, and conclusions repeated on later slides. Keep the same
Chinese source strings in translation dictionaries only where still rendered;
remove unused translation keys only when clearly safe.

- [ ] **Step 4: Update project documentation**

Change `ppt/项目记录.md` to record 19 slides, the six chapter groups, the
fixed 4:3 canvas, the adjacent-slide preview, the 5-row overview grid, and the
top indicator.

- [ ] **Step 5: Run all tests**

Run:

```bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
```

Expected: all checks pass.

- [ ] **Step 6: Commit visual and content compression**

```bash
git add ppt/index.html ppt/项目记录.md
git commit -m "refactor: compress deck content and round presentation surfaces"
```

### Task 4: Browser Verification and Final Corrections

**Files:**
- Modify: `ppt/index.html` only if QA finds defects
- Create: `output/playwright/focused-deck-desktop.png`
- Create: `output/playwright/focused-deck-narrow.png`
- Create: `docs/reviews/design-qa.md`

- [ ] **Step 1: Start a local server**

Run: `python3 -m http.server 4173 --directory .`

Expected: server listens on `http://127.0.0.1:4173/`.

- [ ] **Step 2: Capture the desktop state**

Open `http://127.0.0.1:4173/ppt/index.html` at 1440 by 1000. Confirm:

- The current 4:3 slide is fully visible.
- Both adjacent slide edges are visible.
- The top indicator contains the chapter timeline, while the lower footer shows
  the active title and page without a full-width progress bar.
- No text overlaps the indicator or escapes the slide.

Capture `output/playwright/focused-deck-desktop.png`.

- [ ] **Step 3: Exercise navigation and capture narrow state**

Navigate forward with ArrowRight, click the visible previous preview, switch to
a non-Chinese language in overview, and close overview. Resize to 900 by 900 and
capture `output/playwright/focused-deck-narrow.png`.

- [ ] **Step 4: Write and pass design QA**

Compare both captures against the provided reference's spatial model. Write
`docs/reviews/design-qa.md` with sections for layout fidelity, visual hierarchy, typography,
interaction, and responsiveness. The last line must be exactly:

```text
final result: passed
```

Do not mark passed until all P0, P1, and P2 findings are fixed.

- [ ] **Step 5: Run final verification**

Run:

```bash
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
```

Expected: all tests pass and both screenshots show the required three-page
composition.

- [ ] **Step 6: Commit QA artifacts and corrections**

```bash
git add ppt/index.html docs/reviews/design-qa.md output/playwright/focused-deck-desktop.png output/playwright/focused-deck-narrow.png
git commit -m "test: verify focused deck presentation"
```
