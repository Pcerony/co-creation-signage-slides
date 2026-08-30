# Release Checklist

## Build Record

- Release commit: `<git rev-parse HEAD>`
- Artifact: `dist/index.html`
- Artifact SHA-256: `<shasum -a 256 dist/index.html>`
- Build epoch: `1784073600`
- Node version: `20.x`

## Required Gate

```bash
npm ci
npx playwright install chromium
npm run build
npm run qa
git diff --check
git diff --exit-code -- dist/index.html
```

## Privacy and source review

- Confirm public artifact paths expose only anonymous stable asset IDs.
- Confirm no restricted raw material is tracked or embedded.
- Review every claim whose `reviewStatus` begins with `blocked-`.
- Do not approve release wording that is stronger than its claim entry.
- Record the human reviewer and review date here: `<name / YYYY-MM-DD>`.

## Manual Acceptance

- Open the root entry and verify it reaches `dist/index.html`.
- Navigate all 21 slides by keyboard and overview.
- Switch Chinese, English, Japanese, and Mexican Spanish.
- Confirm the browser console and failed-image count are empty.
- Keep `ppt/index.html` only as the read-only rollback baseline.
