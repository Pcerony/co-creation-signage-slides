import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('portable artifact is offline and defers nonadjacent image decoding', async () => {
  const artifact = await readFile(new URL('../../dist/index.html', import.meta.url));
  const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
  const heatmapIndex = manifest.slides.findIndex(slide => slide.id === 's16-heatmap-overview');
  assert.ok(artifact.byteLength < 30 * 1024 * 1024);
  await withDeckPage(async ({ page, errors }) => {
    const adjacentImageCount = await page.locator('.slide.is-current img, .slide.is-next img').count();
    assert.equal(await page.locator('img[src^="data:"]').count(), adjacentImageCount);
    assert.ok(await page.locator('img[data-src^="data:"]').count() > 10);
    await page.evaluate((index) => window.__deckDebug.goTo(index), heatmapIndex);
    await page.waitForFunction(() => document.querySelector('[data-slide-id="s16-heatmap-overview"] img')?.hasAttribute('src'));
    const loaded = await page.locator('[data-slide-id="s16-heatmap-overview"] img[src]').count();
    assert.ok(loaded > 10);
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { offline: true });
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`current slide stays framed at ${viewport.width}x${viewport.height}`, async () => {
    await withDeckPage(async ({ page, errors }) => {
      await page.waitForFunction(({ width, height }) => {
        const rect = document.querySelector('.slide.is-current').getBoundingClientRect();
        return Math.abs(rect.width - width) < 1 || Math.abs(rect.height - height) < 1;
      }, viewport);
      const cover = await page.locator('.slide.is-current').boundingBox();
      assert.ok(cover && cover.width > 0 && cover.height > 0);
      assert.ok(cover.x < viewport.width && cover.x + cover.width > 0);
      assert.ok(cover.y < viewport.height && cover.y + cover.height > 0);
      assert.ok(Math.abs(cover.width - viewport.width) < 1 || Math.abs(cover.height - viewport.height) < 1);

      await page.evaluate(() => window.__deckDebug.goTo(1));
      await page.waitForFunction(() => window.__deckDebug.getState().currentSlideIndex === 1);
      await page.waitForTimeout(850);
      const box = await page.locator('.slide.is-current').boundingBox();
      const meta = await page.locator('#presentation-indicator').boundingBox();
      const progress = await page.locator('#presentation-footer').boundingBox();
      assert.ok(box && meta && progress);
      const gaps = [
        meta.y,
        box.y - (meta.y + meta.height),
        progress.y - (box.y + box.height),
        viewport.height - (progress.y + progress.height)
      ];
      assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1.5, `balanced gaps: ${gaps.join(', ')}`);
      assert.equal(errors.length, 0, errors.join('\n'));
    }, { viewport });
  });
}
