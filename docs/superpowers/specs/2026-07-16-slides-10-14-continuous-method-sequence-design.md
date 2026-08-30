# Slides 10-14 Continuous Method Sequence

## Scope

Optimize the five displayed pages numbered 10 through 14, identified by stable IDs:

- `s11-principles-ar`
- `s13-baseline-audit`
- `s13b-state-analysis`
- `s14-stimulus-comparison`
- `s15-eye-tracking-system`

The sequence must read as one continuous method chain: principles, baseline audit, diagnosis, stimulus comparison, and eye-tracking deployment. The work covers layout, visual hierarchy, and concise content presentation. It does not change research claims, source strength, claim IDs, slide order, or unrelated slides.

## Language Scope

This is Phase A page-detail work. Acceptance covers only `zh` and the default `en-ja` composite mode. Update matching `zh`, `en`, and `ja` entries where visible copy changes. Do not edit `es-MX` or polish standalone English and Japanese modes.

## Shared Visual System

All five slides use the same structural grammar:

1. A reserved title band at the top with no competing media or metrics.
2. A dominant evidence area in the middle.
3. A compact conclusion or method cue aligned to the bottom edge.
4. Consistent type hierarchy, spacing rhythm, image treatment, and baseline alignment.
5. Ordinary content remains unboxed. Card backgrounds, enclosing borders, and decorative shadows are prohibited outside registered cross-page components.

Hierarchy is created with spacing, thin dividers, typography, controlled accent color, and image scale. Small metadata remains secondary; body text must remain presentation-readable rather than becoming caption-sized.

## Slide Designs

### 10: Principles

Present A, R, and S as one horizontal framework rather than three independent cards. Each principle receives a stable column, large letter marker, short title, and concise definition. A shared rule connects the three columns to show that they form one system. The intervention-sign example becomes a substantial evidence strip instead of a small footer thumbnail.

### 11: Baseline Audit

Lead with the audit scale and distribution: 70 signs, 182 coded design elements, and the A/R/S counts already supported by the source content. Replace the long boxed paragraph with a short finding statement and an unboxed quantitative composition. The annotation-tool image becomes visible evidence rather than a decorative thumbnail.

### 12: State Analysis

Make 15% the primary finding. Place total zones, signs, and features in one aligned metric row. Show A/R/S counts as a compact comparative distribution. Present greenhouse deficiencies as a clean matrix or ruled list, not colored pills or mini-cards. Preserve all existing numbers and deficiency mappings.

### 13: Stimulus Comparison

Make the control and intervention images the largest elements. Use a strict two-column comparison with a shared baseline and minimal copy. Describe only the controlled contrast: conventional dense layout versus the A/R/S-guided intervention. Avoid treating either side as a floating card.

### 14: Eye-Tracking System

Organize the method as a geometric flow: capture, nine-point calibration, homography mapping, and drift/light compensation. The calibration interface is enlarged and integrated with the flow. Replace the two boxed prose blocks with short method statements connected by directional geometry.

## Content Rules

- Preserve existing metrics and conclusions, including 70 signs, 182 coded elements, the recorded A/R/S counts, and the 15% A1 result.
- Do not strengthen causal language or introduce new research claims.
- Reduce repetition and convert explanatory paragraphs into scan-friendly statements without changing meaning.
- Use stable i18n keys for revised visible text; do not duplicate Japanese annotations in slide markup.
- Do not add new external dependencies or remote assets.

## Implementation Boundaries

Create one dedicated layout stylesheet for this sequence or a clearly bounded section in the existing layout stylesheet. Slide markup owns semantic regions and data; CSS owns geometry and responsive behavior. Avoid adding further large inline style blocks. Shared runtime, carousel geometry, cross-page components, and generated `dist/index.html` are outside scope.

## Responsive Behavior

Desktop maintains the stage-view composition and neighboring-slide visibility. Narrow viewports may stack evidence regions, but title order, metric priority, and semantic sequence must remain intact. Text must not overlap, crop, or become smaller than the project presentation scale.

## Verification

- Content and i18n validation pass for the Phase A dictionaries.
- Shared and browser tests pass.
- Production build and deterministic build check pass.
- Desktop and narrow screenshots are inspected for all five slides in `zh` and `en-ja`.
- Visual inspection confirms no ordinary content acquired card-like surfaces.
- Existing carousel, full-screen pages, and cross-page components remain unchanged.

## Rollback Ledger

The change is isolated to the five slide content files, their Phase A i18n keys, a bounded stylesheet, direct tests, and manifest asset declarations only if required. Reverting those paths restores the prior layouts without touching runtime navigation or other slides.
