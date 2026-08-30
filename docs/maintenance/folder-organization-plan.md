# Folder Organization Plan

**Change level:** H

## Goal

Keep the repository root limited to entry points, manifests, governance, and
toolchain files. Group research inputs under `materials/`, project reviews under
`docs/reviews/`, presentation support under `docs/presentation/`, and inactive
assets under `legacy/`.

## Safety Boundary

- Move only tracked files whose working-tree state is clean.
- Do not move or stage user-modified files under `ppt/` or `test/`.
- Do not move user-owned untracked files under `scratch/`, `test/`, or
  `全局资料/`.
- Do not rename or move `ab2/`; its identifiable legacy filenames require the
  separate privacy remediation defined in `DATA_GOVERNANCE.md`.
- Keep `.agents/`, `.claude/`, and other tool-owned configuration in place.

## Target Structure

```text
docs/
  maintenance/       operational contracts
  presentation/      speaker-facing support
  reviews/           historical content/design reviews
  superpowers/       approved design and implementation history
materials/
  derived/            generated source extracts
  manuscripts/        primary manuscript files
  references/         supplied reference documents
  research-notes/     source notes and their media
legacy/
  unreferenced-assets/
  unsafe-write-scripts/
```

## Interface Changes

- Update `sources.yml` paths without changing source IDs or checksums.
- Update source-extract inventories to the new material paths.
- Keep build, runtime, slide IDs, asset IDs, and release artifact unchanged.

## Rollback

All reorganizations use Git renames. Revert this single commit to restore the
previous paths. Do not include pre-existing dirty or untracked files in the
commit.
