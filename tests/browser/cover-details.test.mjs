import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('cover keeps author details at top left and uses icon-led research tags', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(0));
    await page.waitForTimeout(850);

    const slide = page.locator('[data-slide-id="s01-cover"]');
    assert.equal(await slide.locator('.cover-summary').count(), 0, 'small summary is removed');
    assert.deepEqual(await slide.locator('.cover-tag').allTextContents(), ['DESIGN PRINCIPLE', 'GAZE', 'SIGNAGE']);
    assert.equal(await slide.locator('.cover-tag svg').count(), 3, 'every tag has an icon');
    assert.match(await slide.locator('.cover-author').textContent(), /PINGCHENG WANG/);
    assert.match(await slide.locator('.cover-author').textContent(), /SUPERVISOR: YANFANG ZHANG/);
    assert.match(await slide.locator('.cover-author').textContent(), /CO-SUPERVISOR: INAMURA TOKUSHU/);
    assert.match(await slide.locator('.cover-author').textContent(), /KYUSHU UNIVERSITY/);
    assert.equal(await slide.locator('img[alt="QR Code"]').isVisible(), false, 'cover QR code stays temporarily hidden');

    const authorPosition = await slide.locator('.cover-author').evaluate(node => {
      const rect = node.getBoundingClientRect();
      const slideRect = node.closest('.slide').getBoundingClientRect();
      return { left: rect.left - slideRect.left, top: rect.top - slideRect.top };
    });
    assert.ok(authorPosition.left < 100 && authorPosition.top < 100, 'author block sits at top left');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
