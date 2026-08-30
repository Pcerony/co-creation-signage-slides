import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { auditCss, STYLE_FILES } from '../../scripts/lib/css-audit.mjs';

test('modular styles satisfy the migration policy', async () => {
  const entries = await Promise.all(STYLE_FILES.map(async (file) => [
    file,
    await readFile(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8')
  ]));
  assert.deepEqual(auditCss(Object.fromEntries(entries)), []);
});

test('CSS audit rejects risky typography and executable markup', () => {
  const issues = auditCss({
    'tokens.css': ':root{--paper:#fff}',
    'base.css': '.bad{font-size:2vw;-webkit-line-clamp:2}<style>p{}</style>',
    'stage.css': '',
    'layouts.css': '',
    'components.css': '',
    'languages.css': ''
  });
  assert.ok(issues.some((issue) => issue.includes('viewport-relative font-size')));
  assert.ok(issues.some((issue) => issue.includes('line-clamp')));
  assert.ok(issues.some((issue) => issue.includes('HTML style tag')));
});
