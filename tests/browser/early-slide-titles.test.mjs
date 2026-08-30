import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('early slides use the revised date and title hierarchy', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const primaryTitle = async (index, slideId) => {
      await page.evaluate(index => window.__deckDebug.goTo(index), index);
      await page.waitForTimeout(850);
      return page.locator(`[data-slide-id="${slideId}"] .stage-title-region h2`).evaluate(node => node.childNodes[0].textContent.trim());
    };

    await page.evaluate(() => window.__deckDebug.goTo(0));
    await page.waitForTimeout(850);
    assert.match(await page.locator('[data-slide-id="s01-cover"] .cover-author').textContent(), /2026\.07\.17/);

    assert.equal(await primaryTitle(1, 's02-background'), 'Botanical Gardens and Plant Learning');
    assert.equal(await primaryTitle(2, 's04-knowledge-overload'), 'Improving Low Text-Reading Rates through Co-Creation Design');

    await page.evaluate(() => window.__deckDebug.goTo(3));
    await page.waitForTimeout(850);
    const pageFour = await page.locator('[data-slide-id="s05-evaluation-limit"]').evaluate(slide => {
      const canvas = slide.querySelector('.canvas-card').getBoundingClientRect();
      const grid = slide.querySelector('.s05-gap-grid').getBoundingClientRect();
      return {
        titleCount: slide.querySelectorAll('.stage-title-region').length,
        retainsTitleLayout: slide.classList.contains('stage-title-slide'),
        gridTopInset: grid.top - canvas.top
      };
    });
    assert.equal(pageFour.titleCount, 0);
    assert.equal(pageFour.retainsTitleLayout, false);
    assert.ok(pageFour.gridTopInset < 100, `content starts near the top (${pageFour.gridTopInset}px)`);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
