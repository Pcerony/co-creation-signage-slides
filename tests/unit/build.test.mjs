import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

import { buildDeck } from '../../scripts/build.mjs';

const fixedEpoch = '1784073600';

test('build creates one deterministic offline HTML artifact', async () => {
  const first = await buildDeck({ sourceDateEpoch: fixedEpoch, write: true });
  const second = await buildDeck({ sourceDateEpoch: fixedEpoch, write: false });
  const html = await readFile(new URL('../../dist/index.html', import.meta.url), 'utf8');

  assert.equal(first.html, second.html);
  assert.equal(html, first.html);
  const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
  assert.equal((html.match(/data-slide-id=/g) || []).length, manifest.slides.length);
  assert.equal((html.match(/<style\b/g) || []).length, 1);
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<(?:link|script)[^>]+(?:href|src)="https?:/i);
  assert.ok(Buffer.byteLength(html) < 50 * 1024 * 1024, 'portable artifact stays below 50 MiB');
  assert.match(html, /data-build-epoch="1784073600"/);
  assert.equal((await readdir(new URL('../../dist/', import.meta.url))).filter((name) => name.startsWith('.tmp-')).length, 0);
});

test('check mode reports generated artifact drift', async () => {
  await assert.doesNotReject(() => buildDeck({ sourceDateEpoch: fixedEpoch, check: true }));
});
