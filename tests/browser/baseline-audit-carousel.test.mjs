import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIndex = manifest.slides.findIndex(slide => slide.id === 's13-baseline-audit');

test('page eight cycles its four audit images by clicking the image viewport', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(index => window.__deckDebug.goTo(index), slideIndex);
    const slide = page.locator('.slide.is-current[data-slide-id="s13-baseline-audit"]');
    const cycle = slide.locator('[data-image-cycle]');
    const items = cycle.locator('[data-image-cycle-item]');
    const counter = cycle.locator('[data-image-cycle-counter]');

    assert.equal(await cycle.count(), 1);
    assert.equal(await items.count(), 4);
    assert.equal(await items.filter({ visible: true }).count(), 1);
    assert.equal(await counter.textContent(), '1 / 4');

    const firstImageResolution = await items.first().locator('img').evaluate(image => ({
      width: image.naturalWidth,
      height: image.naturalHeight
    }));
    assert.ok(firstImageResolution.width >= 1000, 'first audit image keeps enough source resolution for the slide');
    assert.ok(firstImageResolution.height >= 800, 'first audit image is not a low-resolution thumbnail');

    const firstSource = await items.filter({ visible: true }).locator('img').getAttribute('src');
    await cycle.click();
    const secondSource = await items.filter({ visible: true }).locator('img').getAttribute('src');
    assert.notEqual(secondSource, firstSource);
    assert.equal(await counter.textContent(), '2 / 4');

    await cycle.press('Enter');
    assert.equal(await counter.textContent(), '3 / 4');
    await cycle.press('Space');
    assert.equal(await counter.textContent(), '4 / 4');
    await cycle.click();
    assert.equal(await counter.textContent(), '1 / 4');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
