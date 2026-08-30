import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditDictionaries, findDuplicateJsonKeys, sourceLanguageIds } from './lib/i18n.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'deck-manifest.json'), 'utf8'));
const languages = sourceLanguageIds(manifest);
const dictionaries = {};
const issues = [];

for (const language of languages) {
  const relativePath = `src/i18n/${language}.json`;
  const source = await readFile(path.join(root, relativePath), 'utf8');
  for (const key of findDuplicateJsonKeys(source)) issues.push(`${relativePath}: duplicate key ${key}`);
  dictionaries[language] = JSON.parse(source);
}

const meta = JSON.parse(await readFile(path.join(root, 'src/i18n/meta.json'), 'utf8'));
issues.push(...auditDictionaries(dictionaries, {
  forbiddenJapanesePhrases: meta.forbiddenJapanesePhrases || []
}));

if (issues.length) {
  for (const issue of issues) process.stderr.write(`ERROR ${issue}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS ${Object.keys(dictionaries.zh).length} stable keys across ${languages.length} languages\n`);
}
