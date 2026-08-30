# Folder Map

Use this map before reading or moving project files.

| Path | Purpose | Edit policy |
|---|---|---|
| `src/` | Active slide, style, runtime, i18n, and optimized asset sources | Edit by L/M/H contract |
| `tests/` | Current automated QA | Edit with the owned behavior |
| `scripts/` | Build, validation, migration, and optimization tools | Level M or H |
| `materials/manuscripts/` | Supplied manuscript sources | Preserve checksums and update `sources.yml` |
| `materials/research-notes/` | Research notes and their media | Internal; do not publish directly |
| `materials/references/` | Supporting supplied documents | Internal reference only |
| `materials/derived/` | Reproducible or recorded source extracts | Regenerate from its declared source |
| `docs/maintenance/` | Current operating rules | Keep concise and authoritative |
| `docs/presentation/` | Speaker notes and presentation support | Not runtime source |
| `docs/reviews/` | Historical design/content reviews | Read-only context |
| `docs/superpowers/` | Approved architecture history | Do not rewrite historical decisions |
| `legacy/` | Rollback files, unsafe writers, inactive assets | Never execute or publish directly |
| `dist/` | Generated release artifact | Never hand-edit |
| `output/` | Ignored local QA output | Safe to regenerate |

## Root Exceptions

- `deck-manifest.json`, `claims.yml`, and `sources.yml` are root-level contracts.
- `README.md`, `AGENTS.md`, and `DATA_GOVERNANCE.md` are mandatory entry points.
- `index.html` is the public redirect and `package*.json` defines the toolchain.
- `ppt/` remains because its modified legacy deck is a rollback/migration input.
- `ab2/` remains because moving identifiable legacy filenames requires separate
  human privacy approval and remote-history coordination.
- Tool-owned dot-directories remain at root.

## Maintenance entry points

- `AGENTS.md`: mandatory change-level and safety contract.
- `docs/maintenance/cross-page-components.md`: cross-page component ownership,
  modification workflow, validation, and troubleshooting.
- `docs/maintenance/release-checklist.md`: release-only verification record.

## Sibling paper workspace

`../D28论文项目/` is a non-destructive copy for the separate paper effort. It
has its own `AGENTS.md`, active manuscript boundary, evidence register, and
copy checksums. The current slide project remains the source location; do not
move, rename, or rewrite slide files to make the paper workspace consistent.
When paper and slide wording disagree, follow the paper workspace conflict
register for paper work and this repository's source-of-truth order for slide
work.

## Protected Existing Work

Do not move, delete, stage, or normalize dirty or untracked files merely to make
the root appear clean. Inspect `git status --short` before any organization task
and leave user-owned `scratch/`, `test/`, and research files alone unless the
task explicitly names them.
