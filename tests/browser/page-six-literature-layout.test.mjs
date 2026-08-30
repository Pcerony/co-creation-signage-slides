import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('page six merges literature review and co-creation methods', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(5));
    await page.waitForTimeout(850);

    const slide = page.locator('[data-slide-id="s09-literature-review"]');
    const geometry = await slide.evaluate(node => {
      const literature = node.querySelector('.merged-lit').getBoundingClientRect();
      const field = node.querySelector('.merged-field').getBoundingClientRect();
      const visual = node.querySelector('.merged-lit__flow').getBoundingClientRect();
      const theory = node.querySelector('.merged-lit__theory').getBoundingClientRect();
      return {
        literatureBottom: literature.bottom,
        fieldTop: field.top,
        visualBottom: visual.bottom,
        visualTop: visual.top,
        theoryTop: theory.top,
        theoryBottom: theory.bottom
      };
    });
    assert.ok(geometry.literatureBottom <= geometry.fieldTop, 'literature evidence sits above field methods');
    assert.ok(Math.abs(geometry.visualTop - geometry.theoryTop) <= 1, 'illustration and theory share a row');
    assert.ok(Math.abs(geometry.visualBottom - geometry.theoryBottom) <= 1, 'top-row panels align');

    const theoryItems = slide.locator('.merged-lit__theory li');
    assert.equal(await theoryItems.count(), 3);
    assert.equal(await slide.locator('.merged-methods article').count(), 3);
    assert.equal(await slide.locator('.merged-method-placeholder').count(), 3);
    assert.equal(await slide.locator('.method-participants').count(), 1);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
