import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

import { startStaticServer } from '../../scripts/serve.mjs';

export async function withDeckPage(callback, {
  viewport = { width: 1440, height: 1000 },
  offline = false,
  reducedMotion = 'no-preference'
} = {}) {
  const server = await startStaticServer({ root: fileURLToPath(new URL('../../', import.meta.url)) });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  if (offline) {
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin === server.origin) route.continue();
      else route.abort();
    });
  }
  try {
    await page.goto(`${server.origin}/dist/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__deckDebug?.getState);
    await callback({ page, errors, origin: server.origin });
  } finally {
    await context.close();
    await browser.close();
    await server.close();
  }
}
