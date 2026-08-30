import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's17-initial-coverage');

test('merged results slide keeps the compact bilingual audience-relevance ledger', async () => {
  await withDeckPage(async ({ page, errors }) => {
    assert.ok(slideIndex >= 0, 'merged results slide exists in the manifest');
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    await page.waitForFunction(index => window.__deckDebug.getState().currentSlideIndex === index, slideIndex);

    const slide = page.locator('[data-slide-id="s17-initial-coverage"]');
    assert.equal(await slide.locator('.combined-results__coverage').count(), 1);
    assert.equal(await slide.locator('.combined-results__relevance .s18-ledger__row').count(), 3);

    const metricGeometry = await slide.locator('.s18-metric--comparison').first().evaluate(node =>
      [...node.children].map(child => child.getBoundingClientRect().top)
    );
    assert.ok(metricGeometry[0] < metricGeometry[1] && metricGeometry[1] < metricGeometry[2], 'comparison values stack vertically');

    const labelGeometry = await slide.locator('.s18-label').first().evaluate(node => {
      const japanese = node.querySelector('.hybrid-ja-text').getBoundingClientRect();
      const parent = node.getBoundingClientRect();
      return { japaneseLeft: japanese.left, parentLeft: parent.left };
    });
    assert.ok(labelGeometry.japaneseLeft > labelGeometry.parentLeft + 40, 'Japanese label sits beside the English label');

    assert.equal(await slide.locator('.s18-detail .hybrid-ja-text').count(), 0, 'detail copy suppresses Japanese annotations');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
