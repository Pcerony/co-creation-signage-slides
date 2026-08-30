import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('page seven pairs a large left evidence field with a vertical principles rail', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(6));
    await page.waitForTimeout(850);
    const geometry = await page.locator('[data-slide-id="s11-principles-ar"]').evaluate(slide => {
      const rail = slide.querySelector('.principles__rail').getBoundingClientRect();
      const evidence = slide.querySelector('.principles__evidence').getBoundingClientRect();
      const image = slide.querySelector('.principles__evidence img').getBoundingClientRect();
      const header = slide.querySelector('.method-sequence__header').getBoundingClientRect();
      return {
        evidenceTop: evidence.top,
        evidenceRight: evidence.right,
        railLeft: rail.left,
        headerBottom: header.bottom,
        imageHeight: image.height
      };
    });
    assert.ok(Math.abs(geometry.evidenceTop - geometry.headerBottom) <= 2);
    assert.ok(geometry.railLeft > geometry.evidenceRight, 'principles rail sits to the right of the evidence field');
    assert.ok(geometry.imageHeight >= 400, `evidence image height is ${geometry.imageHeight}px`);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
