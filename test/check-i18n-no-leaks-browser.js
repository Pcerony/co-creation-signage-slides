const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.DECK_URL || 'http://127.0.0.1:4174/ppt/index.html';

function collectCjkText(page) {
  return page.evaluate(() => {
    const values = [];
    const walker = document.createTreeWalker(document.getElementById('deck'), NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const owner = node.parentElement;
      if (!owner || owner.closest('.lang-top-btn, .lang-top-label, .lang-switch')) continue;
      const text = node.nodeValue.trim();
      if (/[\u3400-\u9fff]/.test(text)) values.push(text);
    }
    return values;
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  for (const lang of ['en', 'ja', 'es-MX']) {
    await page.evaluate(langCode => applyLanguage(langCode), lang);
    const audit = await page.evaluate(() => window.__i18nAudit || null);
    assert.ok(audit, `i18n audit should be exposed after switching to ${lang}`);
    assert.strictEqual(audit.lang, lang);
    assert.deepStrictEqual(audit.missing, [], `missing translations in ${lang}: ${JSON.stringify(audit.missing)}`);

    if (lang !== 'ja') {
      const leaked = await collectCjkText(page);
      assert.deepStrictEqual(leaked, [], `Chinese text leaked into ${lang}: ${JSON.stringify(leaked)}`);
    }
  }

  await browser.close();
  console.log('PASS multilingual no-leak browser contract');
})().catch(error => {
  console.error(`FAIL multilingual no-leak browser contract: ${error.message}`);
  process.exitCode = 1;
});
