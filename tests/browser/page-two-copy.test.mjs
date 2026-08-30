import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('page two balances its supporting copy at 22px without repeating the KPI', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(850);

    const copy = await page.evaluate(() => {
      const slide = document.querySelector('.slide.is-current');
      const focus = slide.querySelector('.s02-focus-copy');
      const citation = slide.querySelector('.metric-citation');
      const signage = slide.querySelector('.s02-signage-copy p');
      return {
        focusText: focus.textContent.trim(),
        focusSize: getComputedStyle(focus).fontSize,
        citationText: citation?.textContent.trim(),
        citationSize: citation ? Number.parseFloat(getComputedStyle(citation).fontSize) : 0,
        signageSize: getComputedStyle(signage).fontSize
      };
    });

    assert.equal(copy.focusText, 'of visitors cite learning and exploring as their core motivation for visiting, rather than just looking.');
    assert.equal(copy.focusSize, '22px');
    assert.equal(copy.citationText, 'Source: Falk & Dierking (2000)');
    assert.ok(copy.citationSize > 0 && copy.citationSize <= 13);
    assert.equal(copy.signageSize, '22px');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
