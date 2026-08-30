import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's15-eye-tracking-system');

test('page twelve restores step selection with a different image collection per step', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    const slide = page.locator('[data-slide-id="s15-eye-tracking-system"]');
    const steps = slide.locator('[data-flow-step]');
    const panels = slide.locator('[data-flow-panel]');

    assert.equal(await steps.count(), 4);
    assert.equal(await panels.count(), 4);
    assert.ok(await panels.nth(0).locator('[data-flow-gallery-item]').count() >= 2);

    await steps.nth(2).click();
    assert.equal(await steps.nth(2).getAttribute('aria-selected'), 'true');
    assert.equal(await panels.nth(2).isVisible(), true);
    assert.equal(await panels.nth(0).isVisible(), false);

    const firstImage = await panels.nth(2).locator('[data-flow-gallery-item].is-active img').getAttribute('src');
    await panels.nth(2).locator('[data-flow-next]').click();
    const secondImage = await panels.nth(2).locator('[data-flow-gallery-item].is-active img').getAttribute('src');
    assert.notEqual(secondImage, firstImage);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
