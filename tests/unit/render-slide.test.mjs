import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { renderSlide } from '../../scripts/lib/render-slide.mjs';
import { layoutRegistry } from '../../src/layouts/registry.mjs';

test('every manifest slide renders one stable script-free section', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
  assert.ok(manifest.slides.length >= 16);

  for (const slide of manifest.slides) {
    assert.ok(layoutRegistry.has(slide.layout), `${slide.id} uses a registered layout`);
    assert.match(slide.content, /^src\/content\/slides\/[a-z0-9-]+\.json$/);
    const content = JSON.parse(await readFile(new URL(`../../${slide.content}`, import.meta.url), 'utf8'));
    const html = renderSlide({ slide, content });

    assert.match(html, /^<section\b/, `${slide.id} renders a top-level section`);
    assert.equal((html.match(/data-slide-id=/g) || []).length, 1, `${slide.id} has one stable ID`);
    assert.match(html, new RegExp(`data-slide-id="${slide.id}"`));
    assert.match(html, new RegExp(`data-layout-id="${slide.layout}"`));
    assert.doesNotMatch(html, /<script\b/i);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  }
});

test('phase four keeps its slide titles prefixed without changing chapter ownership', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
  const slides = new Map(manifest.slides.map(slide => [slide.id, slide]));
  const zh = JSON.parse(await readFile(new URL('../../src/i18n/zh.json', import.meta.url), 'utf8'));
  const heatmap = JSON.parse(await readFile(new URL('../../src/content/slides/s16-heatmap-overview.json', import.meta.url), 'utf8'));
  const coverage = JSON.parse(await readFile(new URL('../../src/content/slides/s17-initial-coverage.json', import.meta.url), 'utf8'));

  assert.equal(manifest.chapters.some(chapter => chapter.id === 'results'), false);
  assert.equal(slides.get('s14-stimulus-comparison')?.chapterId, 'methods');
  assert.equal(slides.get('s15-eye-tracking-system')?.chapterId, 'methods');
  assert.equal(slides.get('s16-heatmap-overview')?.chapterId, 'methods');
  assert.equal(slides.get('s17-initial-coverage')?.chapterId, 'methods');
  assert.equal(slides.has('s18-audience-relevance'), false);
  assert.match(heatmap.markup, />结果热力图一览<\/h2>/);
  assert.ok(typeof zh['slides.s17.title'] === 'string');
  assert.match(coverage.markup, /combined-results__coverage/);
  assert.match(coverage.markup, /combined-results__relevance/);
  assert.deepEqual(slides.get('s17-initial-coverage')?.claims, ['claim-initial-coverage', 'claim-audience-relevance']);
});

test('layout renderer rejects mismatched content IDs', () => {
  assert.throws(() => renderSlide({
    slide: { id: 's01-cover', chapterId: 'background', layout: 'cover' },
    content: { id: 's02-background', markup: '<div></div>' }
  }), /content id s02-background does not match slide s01-cover/);
});

test('layout renderer joins maintainable markup fragments', () => {
  const html = renderSlide({
    slide: { id: 's02-background', chapterId: 'background', layout: 'evidence' },
    content: {
      id: 's02-background',
      markup: ['<div class="canvas-card">', '  <h2>Title</h2>', '</div>']
    }
  });
  assert.match(html, /<div class="canvas-card">\n  <h2>Title<\/h2>\n<\/div>/);
});

test('cover exposes the default composite language mode', async () => {
  const entry = await readFile(new URL('../../src/entry.html', import.meta.url), 'utf8');
  const cover = JSON.parse(await readFile(new URL('../../src/content/slides/s01-cover.json', import.meta.url), 'utf8'));

  assert.match(entry, /<html lang="en"/);
  assert.match(entry, /\bclass="[^"]*lang-en-ja\b/);
  assert.match(cover.markup, /data-language="en-ja">EN\+JA<\/button>/);
});
