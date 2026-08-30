# Slide 2-3 And Card Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild slides 2 and 3 as editorial left-copy/right-image evidence pages and reduce neutral card surfaces across the 19-slide deck without changing research content or navigation behavior.

**Architecture:** Keep the single-file HTML deck and existing carousel runtime. Give slides 2 and 3 a dedicated `evidence-slide` structure with one heading, one short paragraph, and a large right-side image frame. Add a body-level `card-reduction-mode` styling contract that removes neutral fills, nested borders, and rounded card treatments while preserving intentional ink/accent contrast and functional image frames.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node assertion scripts, Playwright CLI.

---

### Task 1: Lock The New Layout Contract With Failing Tests

**Files:**
- Modify: `test/check-focused-deck.js`
- Create: `test/check-slide-2-3.js`

- [x] **Step 1: Add structural checks for the evidence slides and card mode**

Assert that both slides identified by `data-short-title="困境：知识超载"` and
`data-short-title="困境：评估局限"` have `evidence-slide`,
`.evidence-layout`, `.evidence-copy`, and `.evidence-media` elements; each has
exactly one `h2` and no `h3`. Assert that the source declares
`card-reduction-mode`, the neutral card override uses transparent backgrounds,
and the old S22 thumbnail sizing is not applied to these slides.

- [x] **Step 2: Run the new test and verify RED**

Run:

```bash
node test/check-slide-2-3.js
```

Expected: the current slides fail because they still use the generic stacked
layout, duplicate heading levels, and a small inline image frame.

- [x] **Step 3: Commit the failing contract**

```bash
git add test/check-focused-deck.js test/check-slide-2-3.js
git commit -m "test: lock slide 2-3 evidence layout"
```

### Task 2: Rebuild Slides 2 And 3 As Evidence Pages

**Files:**
- Modify: `ppt/index.html:2165-2220`

- [x] **Step 1: Replace the nested title/card/thumbnail markup**

Use this structure for both slides, preserving the existing title, paragraph,
image source, alt text, and page metadata:

```html
<div class="evidence-layout">
  <div class="evidence-copy">
    <h2 class="h-xl-zh">现有页面标题</h2>
    <div class="evidence-rule" aria-hidden="true"></div>
    <p class="t-body">现有正文段落</p>
    <div class="evidence-meta">
      <span class="t-meta">SITE / FIELD TRIAL</span>
      <span class="evidence-index">01</span>
    </div>
  </div>
  <figure class="evidence-media frame-img fit-cover">
    <img src="现有图片" alt="现有替代文本">
    <figcaption>现有现场标签</figcaption>
  </figure>
</div>
```

The visible hierarchy must be one slide `h2`, one paragraph, one image, and one
small metadata line. The former inner `h3` quote becomes the opening sentence
of the paragraph or a short accent line, not a second heading.

- [x] **Step 2: Add the dedicated evidence layout styles**

Add fixed logical-pixel-safe layout rules near the focused canvas overrides:

```css
.evidence-layout{
  display:grid;grid-template-columns:5fr 7fr;gap:4vw;
  flex:1;min-height:0;align-items:stretch;
}
.evidence-copy{
  display:flex;flex-direction:column;min-width:0;
  padding:2vh 0 1vh;
}
.evidence-copy h2{max-width:12ch}
.evidence-rule{border-top:2px solid var(--accent);margin:3vh 0 2.4vh}
.evidence-copy .t-body{max-width:30ch}
.evidence-meta{
  display:flex;justify-content:space-between;align-items:end;
  margin-top:auto;padding-top:2vh;border-top:1px solid var(--border-subtle);
}
.evidence-index{font-family:var(--mono);font-size:14px;color:var(--accent)}
.evidence-media{
  min-height:0;height:auto;aspect-ratio:4/3;align-self:center;
  border:0;border-top:2px solid var(--accent);background:var(--grey-1);
}
.evidence-media img{object-fit:cover;object-position:center}
.evidence-media figcaption{
  position:absolute;left:0;right:0;bottom:0;padding:1.2vh 1vw;
  background:rgba(0,0,0,.62);color:#fff;font-family:var(--mono);
  font-size:13px;letter-spacing:.08em;
}
```

At `max-width:900px`, switch to one column with the image below the copy and
keep the image aspect ratio stable instead of using viewport-height thumbnails.

- [x] **Step 3: Run the focused structural tests**

Run:

```bash
node test/check-slide-2-3.js
node test/check-focused-deck.js
```

Expected: both pass without changing slide count or navigation assertions.

- [x] **Step 4: Commit the slide layout**

```bash
git add ppt/index.html
git commit -m "fix: simplify slides 2 and 3 evidence layout"
```

### Task 3: Reduce Neutral Card Surfaces Across The Deck

**Files:**
- Modify: `ppt/index.html` (focused canvas CSS only)
- Modify: `test/check-slide-2-3.js`

- [x] **Step 1: Add the global reduction mode contract**

Apply `card-reduction-mode` to the body and add a focused-canvas override that:

- removes neutral `#fff`/`#f5f5f4` fills from generic content blocks;
- replaces their outer border with one top rule;
- removes box shadows and rounded corners from neutral cards;
- keeps `.card-ink`, `.card-accent`, `.stack-block`, heatmap frames, and actual
  image containers as intentional visual surfaces;
- turns the five issue tags on slide 8 into inline text separated by rules;
- leaves interactive controls and data-chart geometry untouched.

The selector must be scoped to `.slide` and `body.card-reduction-mode` so the
ESC overview and navigation chrome retain their existing behavior.

- [x] **Step 2: Extend the static regression**

Assert that the source contains the reduction mode, neutral surface override,
and no page-2/page-3 inline `background:#fff` card block remains.

- [x] **Step 3: Run focused tests and commit**

Run:

```bash
node test/check-slide-2-3.js
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
git diff --check
```

Then commit:

```bash
git add ppt/index.html test/check-slide-2-3.js
git commit -m "refactor: reduce neutral card surfaces"
```

### Task 4: Browser Verification And Documentation

**Files:**
- Create: `test/check-slide-2-3-browser.js`
- Modify: `docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md`
- Modify: `ppt/项目记录.md`
- Modify: `docs/reviews/design-qa.md`

- [x] **Step 1: Add browser checks for both target slides**

At 1440 x 1000 and 900 x 900, navigate to slides 2 and 3 and assert one
heading, no nested `h3`, a visible right-side image on desktop, a stable 4:3
current slide, no horizontal overflow inside the current slide, and no console
errors or warnings.

- [x] **Step 2: Run browser verification**

Start `python3 -m http.server 4174 --directory .`, then run:

```bash
node test/check-slide-2-3-browser.js
node test/check-focused-deck-browser.js
```

Capture desktop and narrow screenshots in `output/playwright/`, inspect them
visually, and stop the temporary server after verification.

- [x] **Step 3: Align durable documentation**

Record that pages 2 and 3 use the evidence layout and that neutral cards are
replaced by open editorial grouping while intentional accent/ink surfaces and
functional image frames remain.

- [x] **Step 4: Commit documentation**

The browser regression was committed separately so the test and durable
documentation remain independently traceable. The documentation commit follows
the same focused scope.

```bash
git add docs/superpowers/specs/2026-07-14-focused-4x3-deck-design.md ppt/项目记录.md docs/reviews/design-qa.md docs/superpowers/plans/2026-07-15-slide-2-3-card-simplification.md
git commit -m "docs: record evidence layout and card reduction"
```

### Task 5: Final Verification

- [x] **Step 1: Run the complete verification set**

```bash
node test/check-slide-2-3.js
node test/check-focused-deck.js
node test/check-motion-system.js
node test/check-i18n-system.js
node test/check-slide-2-3-browser.js
node test/check-focused-deck-browser.js
git diff --check
git status --short --branch
```

- [x] **Step 2: Confirm focused Git history**

```bash
git log --oneline --decorate -8
```

The working tree may retain the pre-existing untracked research/update files,
but no tracked implementation or documentation changes may remain unstaged.
