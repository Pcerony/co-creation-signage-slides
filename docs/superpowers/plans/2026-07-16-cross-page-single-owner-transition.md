# Cross-Page Single-Owner Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicate endpoint visibility and split-shell animation with one opaque, continuous cross-page card owner.

**Architecture:** A runtime ownership synchronizer hides non-current endpoint mounts while preserving layout. Navigation promotes the source card to one fixed overlay, animates that complete card with source-first FLIP geometry, then atomically hands visibility to the destination mount.

**Tech Stack:** ES modules, DOM, Web Animations API, CSS, Node test runner, Playwright.

---

## File Structure

- Modify `src/runtime/cross-page-components.mjs`: owner synchronization, source-first overlay creation, FLIP lifecycle, and cancellation.
- Modify `src/styles/components.css`: inactive-owner and complete overlay-card styles.
- Modify `tests/browser/cross-page-components.test.mjs`: visible-owner, empty destination, first-frame, card-surface, completion, cancellation, and reduced-motion assertions.
- Modify `tests/unit/cross-page-components.test.mjs`: pure ownership endpoint selection where useful.
- Modify `docs/maintenance/cross-page-components.md`: small-agent maintenance rules for the single-owner contract.

### Task 1: Lock The Regressions

- [ ] Add browser assertions that, before navigation, only the current endpoint is visible and the next endpoint is hidden while retaining a non-zero rectangle.
- [ ] Add transition assertions that exactly one overlay exists, its first rectangle matches the source within two pixels, its computed background is non-transparent, and neither overlay nor descendants animate opacity.
- [ ] Add completion assertions that only the destination endpoint is visible.
- [ ] Run `node --test tests/browser/cross-page-components.test.mjs` and verify failures identify duplicate idle visibility and the transparent/split overlay shell.

### Task 2: Implement Single Ownership

- [ ] Add one `syncOwnership(currentSlideIndex)` path that marks every registered non-current mount inactive and reveals only current mounts.
- [ ] Call ownership synchronization at initialization, after direct/forced navigation, after language changes, and during cleanup.
- [ ] Preserve mount layout with `visibility`, and set `aria-hidden` on inactive mounts.
- [ ] Run the focused browser tests and verify idle and completion ownership pass.

### Task 3: Replace The Overlay Lifecycle

- [ ] Clone the complete source component into a fixed overlay before hiding the source mount.
- [ ] Position the overlay at the source rectangle and animate one outer transform to the precomputed destination rectangle.
- [ ] Remove the separate `.cross-page-overlay__surface`; the cloned component itself supplies background, border, radius, and shadow.
- [ ] Animate named parts from source snapshots to destination variant snapshots without opacity.
- [ ] Resolve cancellation to the controller's current endpoint and unlock navigation exactly once.
- [ ] Run the focused unit and browser tests until forward/reverse chains pass.

### Task 4: Document And Verify

- [ ] Update `docs/maintenance/cross-page-components.md` with the one-owner, opaque-card, and empty-destination rules.
- [ ] Run `npm run test:shared`, `npm run build`, `node --test tests/browser/cross-page-components.test.mjs`, `npm run build:check`, and `git diff --check`.
- [ ] Capture desktop screenshots of pages 2-4 and paused transition midpoints; inspect for duplicate cards, empty shells, jumps, clipping, and overlap.
- [ ] Run the Level H `npm run qa` gate and record any unrelated pre-existing blocker without editing unrelated files.
