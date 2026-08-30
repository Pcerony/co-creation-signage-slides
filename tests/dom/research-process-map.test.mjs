import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('first tool feedback arrow aligns to the row boundary and carries an EN JA validation label', async () => {
  const slide = JSON.parse(await readFile(
    new URL('../../src/content/slides/s08-research-process.json', import.meta.url),
    'utf8'
  ));
  const css = await readFile(new URL('../../src/styles/layouts.css', import.meta.url), 'utf8');

  assert.match(slide.markup, /rm-tool-arrow--qual[^>]*>\s*<span class="rm-tool-arrow__label">/);
  assert.match(slide.markup, />Validation<\/span>\s*<span lang="ja">検証<\/span>/);
  assert.match(css, /\.rm-tool-arrow--qual\s*\{[^}]*bottom:\s*25%/s);
  assert.match(css, /\.rm-tool-arrow__label\s*\{/);
});
