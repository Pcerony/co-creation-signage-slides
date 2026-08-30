import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's17-initial-coverage');

test('initial coverage towers retain their outlined bodies and top icons', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    await page.waitForFunction(index => window.__deckDebug.getState().currentSlideIndex === index, slideIndex);

    const slide = page.locator('.slide.is-current[data-slide-id="s17-initial-coverage"]');
    const kicker = slide.locator('.combined-results-kicker');
    assert.equal(await kicker.count(), 1);
    assert.match(await kicker.textContent(), /Quick Analysis/i);
    const kickerPosition = await kicker.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const slideBox = node.closest('.slide').getBoundingClientRect();
      return { left: box.left - slideBox.left, top: box.top - slideBox.top };
    });
    assert.ok(kickerPosition.left < 100 && kickerPosition.top < 100, 'small title sits at the upper left');
    assert.equal(await slide.locator('.bar-tower').count(), 4);
    assert.equal(await slide.locator('.bar-tower .cap svg').count(), 4);

    const styles = await slide.locator('.bar-tower').evaluateAll(towers => towers.map((tower) => {
      const cap = getComputedStyle(tower.querySelector('.cap'));
      const body = getComputedStyle(tower.querySelector('.body-block'));
      return {
        capBorderWidth: cap.borderTopWidth,
        capBorderStyle: cap.borderTopStyle,
        bodyBorderWidth: body.borderTopWidth,
        bodyBorderStyle: body.borderTopStyle
      };
    }));
    styles.forEach((style) => {
      assert.equal(style.capBorderWidth, '1px');
      assert.equal(style.capBorderStyle, 'solid');
      assert.ok(Number.parseFloat(style.bodyBorderWidth) >= 1, 'tower body keeps a visible outline');
      assert.equal(style.bodyBorderStyle, 'solid');
    });
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
