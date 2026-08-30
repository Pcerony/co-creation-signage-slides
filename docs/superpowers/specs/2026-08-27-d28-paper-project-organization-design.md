# D28 Paper Project Organization Design

**Date:** 2026-08-27
**Change level:** H
**Status:** Approved by user direction in the current task

## Goal

Create a standalone, non-destructive paper workspace beside the D28 slide
project. The workspace must make the tool-development-and-validation paper the
only active manuscript while preserving the design-effect and pure-tool-
architecture versions as controlled alternatives.

## Scope

The new sibling directory is:

```text
/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/
```

The current D28 slide project remains the source location. Existing files are
copied, not moved, renamed, deleted, or normalized. The copy is organized into
these boundaries:

```text
00_项目控制/                 project rules, manifest, evidence conflicts, agent protocol
01_主稿_工具开发与验证/       canonical working manuscript
02_备选稿/                   design-effect and pure-architecture alternatives
03_证据与数据/               claims, sources, experiment data, field records
04_图表与素材/               stimuli, heatmaps, field images, system images, slide images
05_D28上下文/                slide project context and relevant source snapshots
06_历史归档/                 unpublished earlier II/III drafts and historical references
07_补充研究材料/             supplied manuscripts, notes, derived extracts, references
```

## Source-of-truth order

1. `00_项目控制/论文项目清单.yml` defines the active direction, copy map, and
   source status.
2. `01_主稿_工具开发与验证/` contains the only manuscript allowed to be treated
   as the submission candidate.
3. `03_证据与数据/` defines the approved denominator, metric definitions,
   claims, and provenance.
4. `04_图表与素材/` contains the copied visual evidence used by the manuscript.
5. `05_D28上下文/` provides slide-project context but does not override paper
   evidence.
6. `02_备选稿/`, `06_历史归档/`, and `07_补充研究材料/` are reference-only
   unless a control record promotes a file.

## Collaboration boundary

Agents may inspect all copied material, but only the lead manuscript agent may
edit the active manuscript. Evidence, methods, language, and QA agents write
reports under `00_项目控制/reviews/` with unique filenames. No agent may
silently resolve the known conflicts about paper number, plant stimulus,
experiment year, sample denominator, or metric meaning.

## Privacy and reproducibility

Only anonymous participant IDs are copied. Identifiable legacy material under
`ab2/` and user-owned `全局资料/` is excluded. Every copied file is recorded in
`00_项目控制/copy-manifest.tsv` with its original relative path, destination,
size, and SHA-256 checksum. Generated dependencies, build output, browser
captures, and temporary agent state are excluded.

## Acceptance criteria

- The sibling project contains all paper-relevant manuscript, evidence, asset,
  presentation, historical, and supplied-material files without altering the
  source project.
- The tool-development-and-validation version is clearly marked as the active
  manuscript.
- The three-direction decision and unresolved evidence conflicts are visible
  before any future manuscript rewrite.
- A fresh copy-manifest verification reports no missing or checksum-mismatched
  copied files.
- Future agents have disjoint write boundaries and a required handoff format.
