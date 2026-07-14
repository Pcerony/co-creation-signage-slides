const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const url = process.env.DECK_URL || 'http://127.0.0.1:4174/ppt/index.html';
const capturesDir = path.join(__dirname, '..', 'output', 'playwright');
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'narrow', width: 900, height: 900 }
];
const targetSlides = [
  { index: 1, page: '02 / 19', title: '现实困境一：专家导向的知识超载' },
  { index: 2, page: '03 / 19', title: '现实困境二：主观定性的评估局限' }
];

function assertEvidenceState(state, viewport, target) {
  assert.strictEqual(state.slideClass, 'slide evidence-slide is-current', `${viewport.name} page ${target.index + 1} should be the evidence slide`);
  assert.strictEqual(state.headingCount, 1, `${viewport.name} page ${target.index + 1} should have one h2`);
  assert.strictEqual(state.nestedHeadingCount, 0, `${viewport.name} page ${target.index + 1} should not have nested h3 headings`);
  assert.strictEqual(state.heading, target.title, `${viewport.name} page ${target.index + 1} heading should remain intact`);
  assert.strictEqual(state.page, target.page, `${viewport.name} page ${target.index + 1} should update the footer page`);
  assert.ok(state.layoutVisible, `${viewport.name} page ${target.index + 1} should expose the evidence layout`);
  assert.ok(state.copyVisible, `${viewport.name} page ${target.index + 1} should expose the copy column`);
  assert.ok(state.mediaVisible, `${viewport.name} page ${target.index + 1} should expose the image frame`);
  assert.ok(state.imageLoaded, `${viewport.name} page ${target.index + 1} image should load`);
  assert.ok(Math.abs(state.slideRatio - 4 / 3) < 0.01, `${viewport.name} page ${target.index + 1} should remain 4:3`);
  assert.ok(state.slideScrollWidth <= state.slideClientWidth + 1, `${viewport.name} page ${target.index + 1} should not overflow horizontally`);

  if (viewport.name === 'desktop') {
    assert.ok(state.mediaRect.left > state.copyRect.right, `desktop page ${target.index + 1} image should sit to the right of the copy`);
    assert.ok(state.mediaRect.width > state.slideRect.width * 0.34, `desktop page ${target.index + 1} image should be dominant`);
  } else {
    assert.ok(state.mediaRect.top >= state.copyRect.bottom - 1, `narrow page ${target.index + 1} image should stack below the copy`);
    assert.ok(state.mediaRect.width > state.slideRect.width * 0.75, `narrow page ${target.index + 1} image should use the content width`);
  }
}

(async () => {
  fs.mkdirSync(capturesDir, { recursive: true });
  const browser = await chromium.launch();
  const consoleIssues = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning') {
          consoleIssues.push(`${viewport.name} console ${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', error => {
        consoleIssues.push(`${viewport.name} pageerror: ${error.message}`);
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1400);

      for (const target of targetSlides) {
        await page.evaluate(index => window.go(index), target.index);
        await page.waitForTimeout(900);

        const state = await page.evaluate(() => {
          const slide = document.querySelector('.slide.is-current');
          const layout = slide?.querySelector('.evidence-layout');
          const copy = slide?.querySelector('.evidence-copy');
          const media = slide?.querySelector('.evidence-media');
          const image = media?.querySelector('img');
          const slideRect = slide?.getBoundingClientRect();
          const copyRect = copy?.getBoundingClientRect();
          const mediaRect = media?.getBoundingClientRect();
          return {
            slideClass: slide?.className || '',
            heading: slide?.querySelector('h2')?.textContent.trim() || '',
            headingCount: slide?.querySelectorAll('h2').length || 0,
            nestedHeadingCount: slide?.querySelectorAll('h3').length || 0,
            page: document.getElementById('indicator-page')?.textContent.trim() || '',
            layoutVisible: Boolean(layout && layout.getBoundingClientRect().width > 0 && layout.getBoundingClientRect().height > 0),
            copyVisible: Boolean(copy && copyRect.width > 0 && copyRect.height > 0),
            mediaVisible: Boolean(media && mediaRect.width > 0 && mediaRect.height > 0),
            imageLoaded: Boolean(image && image.complete && image.naturalWidth > 0),
            slideRatio: slideRect ? slideRect.width / slideRect.height : 0,
            slideRect: slideRect ? { left: slideRect.left, right: slideRect.right, width: slideRect.width, height: slideRect.height } : { left: 0, right: 0, width: 0, height: 0 },
            copyRect: copyRect ? { left: copyRect.left, right: copyRect.right, top: copyRect.top, bottom: copyRect.bottom, width: copyRect.width, height: copyRect.height } : { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
            mediaRect: mediaRect ? { left: mediaRect.left, right: mediaRect.right, top: mediaRect.top, bottom: mediaRect.bottom, width: mediaRect.width, height: mediaRect.height } : { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
            slideScrollWidth: slide?.scrollWidth || 0,
            slideClientWidth: slide?.clientWidth || 0
          };
        });

        assertEvidenceState(state, viewport, target);
        await page.screenshot({
          path: path.join(capturesDir, `slide-${String(target.index + 1).padStart(2, '0')}-evidence-${viewport.name}.png`),
          fullPage: false
        });
      }

      await page.close();
    }

    assert.deepStrictEqual(consoleIssues, [], `browser console should be clean: ${consoleIssues.join('; ')}`);
    console.log('PASS slide 2-3 browser contract');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`FAIL slide 2-3 browser contract: ${error.message}`);
  process.exitCode = 1;
});
