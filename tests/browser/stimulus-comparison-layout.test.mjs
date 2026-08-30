import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's14-stimulus-comparison');

test('page ten keeps both stimulus images in their normal upper comparison region', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    await page.waitForTimeout(850);

    const slide = page.locator('.slide.is-current[data-slide-id="s14-stimulus-comparison"]');
    const geometry = await slide.evaluate((node) => {
      const slideBox = node.getBoundingClientRect();
      const headerBox = node.querySelector('.method-sequence__header').getBoundingClientRect();
      const introBox = node.querySelector('.s14-software-intro').getBoundingClientRect();
      const images = [...node.querySelectorAll('.stimulus-image-wrapper')].map((item) => {
        const box = item.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      });
      return { slideHeight: slideBox.height, headerBottom: headerBox.bottom, introTop: introBox.top, images };
    });

    assert.equal(geometry.images.length, 2);
    for (const image of geometry.images) {
      assert.ok(image.top - geometry.headerBottom < geometry.slideHeight * 0.18, 'stimulus image starts near the comparison labels');
      assert.ok(image.bottom <= geometry.introTop, 'stimulus image ends before the software introduction');
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
