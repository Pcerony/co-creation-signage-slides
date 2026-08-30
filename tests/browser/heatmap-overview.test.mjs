import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const heatmapIndex = manifest.slides.findIndex(slide => slide.id === 's16-heatmap-overview');

test('heatmap wheel hover selects the matching control and intervention images', async () => {
  await withDeckPage(async ({ page, errors }) => {
    assert.ok(heatmapIndex >= 0, 'heatmap slide exists in the manifest');
    await page.evaluate(index => window.__deckDebug.goTo(index), heatmapIndex);
    await page.waitForFunction(index => window.__deckDebug.getState().currentSlideIndex === index, heatmapIndex);

    const slide = page.locator('[data-slide-id="s16-heatmap-overview"]');
    await slide.locator('[data-heatmap-pick="4"]').hover();
    await page.waitForTimeout(180);

    assert.equal(await slide.locator('[data-heatmap-current]').textContent(), 'P05');
    assert.equal(await slide.locator('[data-heatmap-pick="4"]').getAttribute('class'), 'heatmap-picker active');
    assert.equal(await slide.locator('[data-heatmap-card="control"].active').getAttribute('data-heatmap-index'), '4');
    assert.equal(await slide.locator('[data-heatmap-card="intervention"].active').getAttribute('data-heatmap-index'), '4');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('heatmap overview keeps the attention-density gradient legend below the image stacks', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), heatmapIndex);
    await page.waitForFunction(index => window.__deckDebug.getState().currentSlideIndex === index, heatmapIndex);

    const slide = page.locator('[data-slide-id="s16-heatmap-overview"]');
    const legend = slide.locator('[data-heatmap-legend]');
    const gradient = legend.locator('.heatmap-legend-bar');
    const geometry = await page.evaluate(() => {
      const stage = document.querySelector('[data-slide-id="s16-heatmap-overview"] .heatmap-stage').getBoundingClientRect();
      const legend = document.querySelector('[data-heatmap-legend]').getBoundingClientRect();
      return { stageBottom: stage.bottom, legendTop: legend.top };
    });

    assert.equal(await legend.getAttribute('aria-label'), 'Heatmap attention density legend');
    assert.match(await gradient.evaluate(node => getComputedStyle(node).backgroundImage), /linear-gradient/);
    assert.ok(geometry.legendTop >= geometry.stageBottom, 'legend sits below the heatmap stacks');
    assert.match(await legend.textContent(), /Low attention/);
    assert.match(await legend.textContent(), /Fixation point density/);
    assert.match(await legend.textContent(), /High attention/);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
