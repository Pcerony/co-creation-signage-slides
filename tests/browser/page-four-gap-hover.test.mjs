import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('page four reveals each research objective by click', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(3));
    await page.waitForTimeout(850);

    const slide = page.locator('[data-slide-id="s05-evaluation-limit"]');
    const visuals = slide.locator('.s05-gap-visual');
    assert.equal(await visuals.count(), 2);
    assert.equal(await slide.locator('[data-i18n="slides.s05.gap1.meta"], [data-i18n="slides.s05.gap2.meta"]').count(), 0);
    assert.deepEqual(await slide.locator('.s05-gap-badge').allTextContents(), ['RESEARCH GAP 1', 'RESEARCH GAP 2']);
    assert.equal(await slide.locator('.s05-gap-copy h3').count(), 2);
    assert.equal(await slide.locator('.cross-page-mount[data-cross-page-instance="workshop-research-gap"]').count(), 1);

    const firstOverlay = visuals.nth(0).locator('.s05-gap-overlay');
    assert.equal(await firstOverlay.evaluate(node => getComputedStyle(node).opacity), '0');
    await visuals.nth(0).hover();
    await page.waitForTimeout(220);
    assert.equal(await firstOverlay.evaluate(node => getComputedStyle(node).opacity), '0');
    await visuals.nth(0).click();
    await page.waitForTimeout(220);
    assert.ok(await firstOverlay.evaluate(node => parseFloat(getComputedStyle(node).opacity) > .99));
  const descriptions = page.locator('.s05-gap-description');
  assert.equal(await descriptions.count(), 2);
  assert.match(await descriptions.nth(0).textContent(), /Past designs relied heavily/);
  assert.match(await descriptions.nth(1).textContent(), /Lacking precise diagnostic methods/);

  assert.match(await firstOverlay.textContent(), /Establish Attention-Oriented/);
    assert.match(await visuals.nth(0).locator('img').evaluate(node => getComputedStyle(node).filter), /blur/);

    await visuals.nth(1).focus();
    assert.equal(await firstOverlay.evaluate(node => getComputedStyle(node).opacity), '1');
    await visuals.nth(1).press('Enter');
    await page.waitForTimeout(220);
    const secondOverlay = visuals.nth(1).locator('.s05-gap-overlay');
    assert.ok(await secondOverlay.evaluate(node => parseFloat(getComputedStyle(node).opacity) > .99));
  assert.match(await secondOverlay.textContent(), /qualitative tool/i);
  assert.match(await secondOverlay.textContent(), /quantitative tool/i);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('page four gap reveal respects reduced motion', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(3));
    await page.waitForTimeout(850);
    const visual = page.locator('[data-slide-id="s05-evaluation-limit"] .s05-gap-visual').first();
    const overlay = visual.locator('.s05-gap-overlay');
    await visual.click();
    assert.equal(await overlay.evaluate(node => getComputedStyle(node).transitionDuration), '0s');
    assert.equal(await overlay.evaluate(node => getComputedStyle(node).opacity), '1');
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { reducedMotion: 'reduce' });
});
