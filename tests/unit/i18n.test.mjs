import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  auditDictionaries,
  findDuplicateJsonKeys,
  sourceLanguageIds,
  translate
} from '../../scripts/lib/i18n.mjs';

test('translation helper replaces named parameters', () => {
  assert.equal(
    translate({ 'metric.delta': 'Increase: {value}{unit}' }, 'metric.delta', { value: '6.7', unit: 'pp' }),
    'Increase: 6.7pp'
  );
  assert.throws(() => translate({}, 'missing.key'), /missing translation key missing.key/);
});

test('dictionary audit requires identical non-empty stable key sets', () => {
  const dictionaries = {
    zh: { 'slides.s01.title': '标题' },
    en: { 'slides.s01.title': 'Title' },
    ja: { 'slides.s01.title': 'タイトル' },
    'es-MX': { 'slides.s01.title': 'Título' }
  };
  assert.deepEqual(auditDictionaries(dictionaries), []);

  dictionaries.en.extra = 'Extra';
  assert.ok(auditDictionaries(dictionaries).some(issue => issue.includes('key set differs')));
  dictionaries.en['slides.s01.title'] = '';
  assert.ok(auditDictionaries(dictionaries).some(issue => issue.includes('empty value')));
});

test('dictionary audit rejects Chinese leakage in English and Spanish', () => {
  const dictionaries = {
    zh: { 'slides.s01.title': '标题' },
    en: { 'slides.s01.title': 'English 中文' },
    ja: { 'slides.s01.title': 'タイトル' },
    'es-MX': { 'slides.s01.title': 'Español 中文' }
  };
  const issues = auditDictionaries(dictionaries);
  assert.ok(issues.some(issue => issue.includes('en: CJK leakage')));
  assert.ok(issues.some(issue => issue.includes('es-MX: CJK leakage')));
});

test('flat JSON duplicate-key detector reports repeated keys', () => {
  assert.deepEqual(findDuplicateJsonKeys('{\n  "a": "one",\n  "a": "two"\n}'), ['a']);
});

test('project dictionaries share one clean key set', async () => {
  const entries = await Promise.all(['zh', 'en', 'ja', 'es-MX'].map(async language => {
    const source = await readFile(new URL(`../../src/i18n/${language}.json`, import.meta.url), 'utf8');
    assert.deepEqual(findDuplicateJsonKeys(source), [], `${language} has duplicate JSON keys`);
    return [language, JSON.parse(source)];
  }));
  const issues = auditDictionaries(Object.fromEntries(entries));
  assert.deepEqual(issues, []);
});

test('composite modes reuse source dictionaries without creating a fifth dictionary', () => {
  const manifest = {
    languages: ['en-ja', 'zh', 'en', 'ja', 'es-MX'],
    compositeLanguages: {
      'en-ja': { primary: 'en', secondary: 'ja', policy: 'balanced-emphasis' }
    }
  };
  assert.deepEqual(sourceLanguageIds(manifest), ['zh', 'en', 'ja', 'es-MX']);
});
