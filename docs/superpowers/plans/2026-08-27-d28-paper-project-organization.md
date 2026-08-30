# D28 Paper Project Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, non-destructive D28 paper workspace whose active manuscript is the tool-development-and-validation direction.

**Architecture:** Copy paper-relevant source material from the slide project into a sibling `D28论文项目` directory. Keep the active manuscript, alternatives, evidence, assets, D28 context, history, and supplied materials in separate directories. Use project-local rules, a YAML control manifest, a conflict register, an agent protocol, and a generated checksum manifest to keep later parallel work bounded and auditable.

**Tech Stack:** macOS shell utilities (`rsync`, `find`, `shasum`), Markdown, YAML, TSV, Git documentation under `docs/superpowers/`.

---

### Task 1: Record the approved project boundary

**Files:**
- Create: `docs/superpowers/specs/2026-08-27-d28-paper-project-organization-design.md`
- Create: `docs/superpowers/plans/2026-08-27-d28-paper-project-organization.md`

- [x] **Step 1: Capture the approved direction and non-destructive copy policy**

The design records `D28论文项目` as a sibling workspace, marks tool development
plus validation as the active direction, and excludes destructive moves and
identifiable legacy material.

- [x] **Step 2: Define the acceptance criteria**

The design requires a complete copy map, checksum verification, explicit
conflict register, and disjoint agent write scopes.

### Task 2: Create the standalone paper workspace

**Files:**
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/01_主稿_工具开发与验证/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/02_备选稿/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/03_证据与数据/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/04_图表与素材/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/05_D28上下文/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/06_历史归档/`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/07_补充研究材料/`

- [x] **Step 1: Create only the new sibling directories**

Run:

```bash
mkdir -p "/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目"/{00_项目控制/reviews,01_主稿_工具开发与验证,02_备选稿,03_证据与数据,04_图表与素材,05_D28上下文,06_历史归档,07_补充研究材料}
```

Expected: all nine new directories exist; the original D28 project is unchanged.

- [x] **Step 2: Copy the active manuscript and alternatives**

Copy the tool-theme Markdown and DOCX into the active directory. Copy the
polished design-effect version and pure-tool-architecture version into
`02_备选稿/`. Preserve the original current draft, raw draft, master-report
translation, and published Research I as reference copies.

- [x] **Step 3: Copy evidence, assets, history, supplied materials, and D28 context**

Copy the complete paper-data, paper-assets, talk/summary, slide-structured-data,
historical-archive, and `materials/` trees. Copy the relevant D28 `ppt/`,
`src/`, `docs/`, and root governance/source contracts into `05_D28上下文/`.
Exclude dependencies, generated output, browser state, scratch state,
`ab2/`, and `全局资料/`.

### Task 3: Add project-local control files

**Files:**
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/AGENTS.md`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/README.md`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/README.md`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/论文项目清单.yml`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/证据口径与冲突登记.md`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/Agent协同协议.md`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/资料索引.md`

- [x] **Step 1: Make the project rule hierarchy explicit**

`AGENTS.md` makes the active tool-validation manuscript authoritative for this
workspace, requires evidence-led wording, prohibits silent conflict resolution,
and defines each agent's write scope.

- [x] **Step 2: Record the three manuscript directions**

The control manifest labels design-effect as alternative one, tool-development
plus validation as the active direction, and pure tool architecture as
alternative three.

- [x] **Step 3: Record unresolved conflicts without changing research meaning**

The conflict register lists paper number, plant stimulus, experiment year,
sample denominator, metric definitions, environment, unsupported engineering
claims, confounding, and 2-page formatting as review gates.

### Task 4: Verify the copy and collaboration boundary

**Files:**
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/copy-manifest.tsv`
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/copy-verification.txt`

- [x] **Step 1: Generate the copied-file manifest**

Record destination, original relative path, file size, and SHA-256 for every
copied file, excluding the control files that are created after the copy.

- [x] **Step 2: Compare source and destination file counts and checksums**

Run a fresh verification that reports missing files, extra copied files, and
checksum mismatches. Expected: zero missing and zero mismatches.

- [x] **Step 3: Confirm the source project was not modified by organization**

Run `git status --short` in the original project and compare it with the
pre-organization status record. Existing dirty and untracked files remain
untouched.

### Task 5: Run independent review lanes

**Files:**
- Create: `/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/D28论文项目/00_项目控制/reviews/`

- [x] **Step 1: Run a completeness review**

Check that every paper-relevant source tree has a destination and that excluded
trees are named with a reason.

- [x] **Step 2: Run an evidence-boundary review**

Check that the active direction is tool development plus validation and that the
conflict register preserves unresolved source disagreements instead of choosing
one silently.

- [x] **Step 3: Run a reproducibility and privacy review**

Check the checksum manifest, anonymous participant policy, and absence of
dependencies, generated output, and identifiable legacy data.

### Task 6: Final handoff

- [x] **Step 1: Run `git diff --check` for the in-repository design records**

Expected: no whitespace errors.

- [x] **Step 2: Report the new sibling workspace and all unresolved gates**

The handoff names the active manuscript, the copied source trees, the excluded
trees, the verification result, and the fact that no existing source files were
edited.
