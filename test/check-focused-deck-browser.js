const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.DECK_URL || 'http://127.0.0.1:4174/ppt/index.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const consoleIssues = [];

  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const initial = await page.evaluate(() => {
    const slide = document.querySelector('.slide.is-current');
    const rect = slide.getBoundingClientRect();
    const ids = [
      'indicator-chapter',
      'indicator-title',
      'indicator-section-page',
      'indicator-page',
      'indicator-progress'
    ];
    return {
      slides: document.querySelectorAll('.slide').length,
      rect: { width: rect.width, height: rect.height },
      indicator: ids.map(id => ({
        id,
        visible: Boolean(document.getElementById(id)?.getBoundingClientRect().width)
      })),
      states: {
        prev: document.querySelectorAll('.slide.is-prev').length,
        current: document.querySelectorAll('.slide.is-current').length,
        next: document.querySelectorAll('.slide.is-next').length
      },
      imagesLoaded: [...document.querySelectorAll('.slide img')]
        .every(image => image.complete && image.naturalWidth > 0)
    };
  });

  assert.strictEqual(initial.slides, 19, 'deck should expose 19 slides');
  assert.ok(Math.abs(initial.rect.width / initial.rect.height - 4 / 3) < 0.01, 'current slide should be 4:3');
  assert.ok(initial.indicator.every(field => field.visible), 'indicator fields should be visible');
  assert.deepStrictEqual(initial.states, { prev: 0, current: 1, next: 1 });
  assert.ok(initial.imagesLoaded, 'all slide images should load');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(850);
  const navigated = await page.evaluate(() => ({
    index: window.__currentSlideIndex,
    states: {
      prev: document.querySelectorAll('.slide.is-prev').length,
      current: document.querySelectorAll('.slide.is-current').length,
      next: document.querySelectorAll('.slide.is-next').length
    }
  }));
  assert.strictEqual(navigated.index, 1, 'ArrowRight should advance one slide');
  assert.deepStrictEqual(navigated.states, { prev: 1, current: 1, next: 1 });

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'English' }).click();
  const localized = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.getElementById('indicator-title').textContent.trim(),
    overviewDisplay: getComputedStyle(document.getElementById('overview')).display
  }));
  assert.strictEqual(localized.lang, 'en');
  assert.ok(localized.title && !/[\u3400-\u9fff]/.test(localized.title), 'English indicator title should not remain CJK text');
  assert.notStrictEqual(localized.overviewDisplay, 'none', 'overview should remain open during language switch');

  await page.keyboard.press('Escape');
  assert.strictEqual(await page.locator('#overview').evaluate(node => getComputedStyle(node).display), 'none');
  assert.deepStrictEqual(consoleIssues, [], `browser console should be clean: ${consoleIssues.join('; ')}`);

  await browser.close();
  console.log('PASS focused deck browser contract');
})().catch(error => {
  console.error(`FAIL focused deck browser contract: ${error.message}`);
  process.exitCode = 1;
});
