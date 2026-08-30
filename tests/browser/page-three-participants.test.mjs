import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

test('page three places participants between the workshop title and body without a divider', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(2));
    await page.waitForTimeout(850);

    const layout = await page.evaluate(() => {
      const slide = document.querySelector('.slide.is-current');
      const title = slide.querySelector('.s04-cocreation-title').getBoundingClientRect();
      const participants = slide.querySelector('.s04-participant-tag').getBoundingClientRect();
      const body = slide.querySelector('.s04-transition').getBoundingClientRect();
      const sectionStyle = getComputedStyle(slide.querySelector('.s04-cocreation'));
      const citation = slide.querySelector('.metric-citation');
      return {
        participantTop: participants.top,
        participantBottom: participants.bottom,
        titleBottom: title.bottom,
        bodyTop: body.top,
        dividerWidth: sectionStyle.borderTopWidth,
        participantsInsideHead: Boolean(slide.querySelector('.s04-cocreation-head > .s04-participant-tag')),
        citationText: citation?.textContent.trim(),
        citationSize: citation ? Number.parseFloat(getComputedStyle(citation).fontSize) : 0
      };
    });

    assert.equal(layout.participantsInsideHead, true);
    assert.ok(layout.participantTop >= layout.titleBottom, 'participants follow the workshop title');
    assert.ok(layout.participantBottom <= layout.bodyTop, 'participants precede the workshop body');
    assert.equal(layout.dividerWidth, '0px');
    assert.equal(layout.citationText, 'Source: Beverly Serrell (2015). Exhibit Labels: An Interpretive Approach');
    assert.ok(layout.citationSize > 0 && layout.citationSize <= 13);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
