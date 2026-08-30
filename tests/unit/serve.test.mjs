import assert from 'node:assert/strict';
import { test } from 'node:test';

import { startStaticServer } from '../../scripts/serve.mjs';

test('static server serves project files and blocks traversal', async () => {
  const app = await startStaticServer({ root: process.cwd() });

  try {
    const page = await fetch(`${app.origin}/ppt/index.html`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type') || '', /^text\/html/);

    const traversal = await fetch(`${app.origin}/..%2F..%2Fetc%2Fpasswd`);
    assert.equal(traversal.status, 403);
  } finally {
    await app.close();
  }
});

test('static server uses an ephemeral localhost port by default', async () => {
  const app = await startStaticServer({ root: process.cwd() });

  try {
    const url = new URL(app.origin);
    assert.equal(url.hostname, '127.0.0.1');
    assert.notEqual(url.port, '0');
  } finally {
    await app.close();
  }
});
