import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's13b-state-analysis');

test('page nine keeps its evidence image and conclusion inside the slide', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    await page.waitForTimeout(850);

    const slide = page.locator('[data-slide-id="s13b-state-analysis"]');
    const geometry = await slide.evaluate((node) => {
      const slideBox = node.getBoundingClientRect();
      const imageBox = node.querySelector('.diagnosis__body > figure').getBoundingClientRect();
      const conclusionBox = node.querySelector('[data-i18n="slides.s13b.conclusion"]').getBoundingClientRect();
      return {
        slideBottom: slideBox.bottom,
        imageTop: imageBox.top,
        imageBottom: imageBox.bottom,
        conclusionTop: conclusionBox.top,
        conclusionBottom: conclusionBox.bottom
      };
    });

    assert.ok(Math.abs(geometry.imageTop - geometry.conclusionTop) < 8, 'evidence image aligns with the conclusion text');
    assert.ok(geometry.imageBottom <= geometry.slideBottom - 18, 'evidence image stays inside the lower slide edge');
    assert.ok(geometry.conclusionBottom <= geometry.slideBottom - 18, 'conclusion stays inside the lower slide edge');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
