import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);

test('derived source inventory resolves to organized material files', async () => {
  const inventory = JSON.parse(await readFile(
    new URL('materials/derived/source-extract/manifest.json', root),
    'utf8'
  ));
  assert.ok(inventory.length > 20);
  for (const entry of inventory) {
    const file = await stat(new URL(entry.path, root));
    assert.ok(file.isFile(), `${entry.path} is a file`);
    assert.equal(file.size, entry.size, `${entry.path} preserves recorded size`);
  }
});

test('contact sheet references only organized research-note media', async () => {
  const rows = (await readFile(
    new URL('materials/derived/source-extract/image_contact_sheet.tsv', root),
    'utf8'
  )).trim().split('\n');
  assert.equal(rows.length, 25);
  for (const row of rows) {
    const [, relativePath] = row.split('\t');
    assert.match(relativePath, /^materials\/research-notes\/co-creation-tool\//);
    assert.ok((await stat(new URL(relativePath, root))).isFile());
  }
});
