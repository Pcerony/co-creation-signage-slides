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
      'indicator-page'
    ];
    const rowRect = selector => {
      const row = document.querySelector(selector)?.getBoundingClientRect();
      return row ? { top: row.top, bottom: row.bottom, height: row.height } : null;
    };
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
      indicatorRows: {
        chapter: rowRect('.indicator-chapter-row'),
        detail: rowRect('.indicator-detail-row'),
        timeline: rowRect('.indicator-timeline-container'),
        hasDeprecatedProgress: Boolean(document.querySelector('.indicator-track, #indicator-progress'))
      },
      imagesLoaded: [...document.querySelectorAll('.slide img')]
        .every(image => image.complete && image.naturalWidth > 0)
    };
  });

  assert.strictEqual(initial.slides, 19, 'deck should expose 19 slides');
  assert.ok(Math.abs(initial.rect.width / initial.rect.height - 4 / 3) < 0.01, 'current slide should be 4:3');
  assert.ok(initial.indicator.every(field => field.visible), 'indicator fields should be visible');
  assert.ok(initial.indicatorRows.chapter?.height > 0, 'chapter row should be visible');
  assert.ok(initial.indicatorRows.detail?.height > 0, 'subtitle and page row should be visible');
  assert.ok(initial.indicatorRows.timeline?.height > 0, 'chapter timeline should be visible');
  assert.ok(initial.indicatorRows.detail.top >= initial.indicatorRows.chapter.bottom - 1, 'detail row should sit below chapter row');
  assert.ok(!initial.indicatorRows.hasDeprecatedProgress, 'deprecated wide progress bar should be absent');
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
  await page.waitForTimeout(450);
  const overview = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#overview .esc-grid-wrap > div')];
    const rows = new Set(cards.map(card => Math.round(card.getBoundingClientRect().top)));
    return {
      count: cards.length,
      usable: cards.every(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }),
      rows: rows.size
    };
  });
  assert.deepStrictEqual(overview, { count: 19, usable: true, rows: 5 }, 'overview should render all 19 thumbnails across five usable rows');

  await page.getByRole('button', { name: 'English' }).click();
  const localized = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.getElementById('indicator-title').textContent.trim(),
    overviewDisplay: getComputedStyle(document.getElementById('overview')).display
  }));
  assert.strictEqual(localized.lang, 'en');
  assert.ok(localized.title && !/[\u3400-\u9fff]/.test(localized.title), 'English indicator title should not remain CJK text');
  assert.notStrictEqual(localized.overviewDisplay, 'none', 'overview should remain mounted during language switch');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  const overviewClosed = await page.locator('#overview').evaluate(node => node.classList.contains('active'));
  assert.strictEqual(overviewClosed, false);
  assert.deepStrictEqual(consoleIssues, [], `browser console should be clean: ${consoleIssues.join('; ')}`);

  await browser.close();
  console.log('PASS focused deck browser contract');
})().catch(error => {
  console.error(`FAIL focused deck browser contract: ${error.message}`);
  process.exitCode = 1;
});
