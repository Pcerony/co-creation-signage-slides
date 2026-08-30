# Page Four Gap Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the two page-four gap images into accessible hover/focus reveals while removing research-question labels.

**Architecture:** Keep the behavior page-local and CSS-driven. Each gap article retains a visible badge and title, while its existing paragraph moves into a focusable figure overlay; the registered workshop mount remains unchanged.

**Tech Stack:** JSON slide markup, CSS hover/focus states, Node test runner, Playwright.

---

### Task 1: Lock The Interaction Contract

**Files:**
- Create: `tests/browser/page-four-gap-hover.test.mjs`

- [ ] **Step 1: Write the failing browser test**

Assert that page four has two `.s05-gap-visual` figures, no research-question labels, hidden overlays at rest, visible overlays after hover and keyboard focus, and unchanged workshop mount identity.

- [ ] **Step 2: Run the test to verify failure**

Run: `node --test tests/browser/page-four-gap-hover.test.mjs`

Expected: FAIL because `.s05-gap-visual` does not exist.

### Task 2: Implement Gap Figures

**Files:**
- Modify: `src/content/slides/s05-evaluation-limit.json`
- Modify: `src/styles/layouts.css`

- [ ] **Step 1: Restructure each article**

Keep `.s05-gap-badge` and the translated `h3` above a focusable `.s05-gap-visual`. Place the image and existing translated paragraph inside `.s05-gap-overlay`; remove `slides.s05.gap1.meta` and `slides.s05.gap2.meta` from visible markup.

- [ ] **Step 2: Add CSS interaction states**

Use `:hover` and `:focus-visible` to blur the image and reveal a full-size translucent white overlay. Disable transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 3: Run the focused test**

Run: `npm run build && node --test tests/browser/page-four-gap-hover.test.mjs`

Expected: PASS.

### Task 3: Verify The Slide

**Files:**
- Generated: `dist/index.html`
- Screenshot: `output/qa/page-four-gap-hover/`

- [ ] **Step 1: Capture desktop and narrow screenshots**

Inspect default and hovered states for overlap, text fit, image visibility, and bottom workshop placement.

- [ ] **Step 2: Run required regression gates**

Run: `npm run test:shared && npm run build && npm run test:browser && git diff --check`

Expected: all commands pass.
