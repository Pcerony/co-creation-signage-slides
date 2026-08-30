# Small-Model Task Packet

Use this template without adding repository-wide exploration.

## Task ID

Use a stable short identifier such as `L-s17-copy-01`.

## Change level

Choose exactly one: `L`, `M`, or `H` according to root `AGENTS.md`.

## Language phase

Choose exactly one:

- `A — page draft` (default): acceptance is limited to `en-ja` and `zh`; edit only the target `zh`, `en`, and `ja` source entries, and do not touch `es-MX`.
- `B — confirmed-page synchronization`: allowed only after the user explicitly confirms the page is complete; verify standalone `en` and `ja`, then synchronize `es-MX`.

Record the user's confirmation when choosing Phase B. Never promote a task from Phase A automatically.

## Goal

State one observable outcome in one sentence.

## Allowed files

List exact relative paths. Files not listed are read-only.

For Phase A translation work, list only the target slide plus matching `zh`, `en`, and `ja` source files. Add `es-MX` only in Phase B.

## Files to read first

List the smallest ordered context set. Level L should not exceed five files.

## Forbidden actions

- Do not edit `dist/index.html`.
- Do not run legacy write scripts.
- Do not stage unrelated changes.
- Do not broaden the task into cleanup or redesign.

## Acceptance checks

List exact assertions, including stable slide, translation, claim, and asset IDs.

## Commands

Provide commands copied from the matching L/M/H gate in `AGENTS.md`.

## Expected outputs

State pass counts, generated-file state, and permitted diff paths.

## Stop and escalate when

List conflicts, test failures, privacy uncertainty, or ownership collisions that require human input.

## Handoff

```text
Task ID:
Change level:
Language phase:
Page-complete confirmation (Phase B only):
Base commit:
Final commit:
Files changed:
Commands and results:
Generated artifact status:
Unresolved risks:
```
