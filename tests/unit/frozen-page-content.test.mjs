import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));
}

function markup(content) {
  return Array.isArray(content.markup) ? content.markup.join('\n') : content.markup;
}

test('confirmed page two content retains the 60 percent assertion', async () => {
  const page = await readJson('src/content/slides/s02-background.json');
  const html = markup(page);

  assert.ok(page.claims.includes('claim-visitor-learning-motivation'));
  assert.match(html, /data-i18n="legacy\.text\.0014"/);
  assert.match(html, /data-i18n="legacy\.text\.0210"/);
  assert.match(html, /超过 60%/);
  assert.match(html, /data-cross-page-instance="background-attention"/);
});

test('confirmed page three content retains the 20 percent assertion', async () => {
  const page = await readJson('src/content/slides/s04-knowledge-overload.json');
  const html = markup(page);

  assert.ok(page.claims.includes('claim-long-form-deep-reading-rate'));
  assert.match(html, /DEEP READING RATE/);
  assert.match(html, />20%<\/strong>/);
  assert.match(html, /data-i18n="legacy\.text\.0117"/);
  assert.match(html, /data-i18n="legacy\.text\.0183"/);
  assert.match(html, /植物园的运营中往往会引入共创设计。/);
  assert.doesNotMatch(html, /共创设计介入/);
  assert.match(html, /data-cross-page-instance="background-attention"/);
  assert.match(html, /data-cross-page-instance="workshop-research-gap"/);
});
