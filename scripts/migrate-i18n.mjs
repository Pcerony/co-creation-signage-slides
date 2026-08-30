import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'ppt/index.html');
const outDir = path.join(root, 'src/i18n');

function readLegacyLanguages(html) {
  const start = html.indexOf('const LANGUAGES =');
  const end = html.indexOf(';const LANG_ORDER', start);
  if (start < 0 || end < 0) throw new Error('Cannot locate legacy LANGUAGES object');
  return new Function(`${html.slice(start, end)}; return LANGUAGES;`)();
}

function canonicalChinese(value) {
  return value
    .replace(/注注视点/g, '注视点')
    .replace(/\s+of\s+/g, '的')
    .replace(/\s+the\s+/g, '的')
    .replace(/non-contact 视线估计 system/g, 'non-contact 视线估计系统')
    .replace(/\s+的\s+/g, '的')
    .replace(/的\s*(?=[A-Za-z0-9+])/g, '的 ')
    .trim();
}

function cleanJapanese(value) {
  return value
    .replaceAll('现实', '現実')
    .replaceAll('现状', '現状')
    .replaceAll('原则', '原則')
    .replaceAll('价值', '価値')
    .replaceAll('视线', '視線')
    .replaceAll('信息传达', '情報伝達');
}

function buildDictionaries(legacy) {
  const languages = ['en', 'ja', 'es-MX'];
  const records = new Map();

  for (const language of languages) {
    for (const [source, translated] of Object.entries(legacy[language].strings)) {
      const canonical = canonicalChinese(source);
      const record = records.get(canonical) || { source: canonical, translations: {} };
      const existing = record.translations[language];
      if (!existing || source === canonical) record.translations[language] = translated;
      records.set(canonical, record);
    }
  }

  const orphanSources = [];
  for (const [source, record] of records) {
    if (languages.some(language => !record.translations[language])) {
      orphanSources.push(source);
      records.delete(source);
    }
  }

  const sorted = [...records.values()].sort((a, b) => a.source.localeCompare(b.source, 'zh-CN'));
  const dictionaries = {
    zh: {
      'common.documentTitle': legacy.zh.title,
      'common.languageLabel': legacy.zh.label,
      'chapters.background': '研究背景',
      'chapters.researchDesign': '研究设计',
      'chapters.methods': '方法与工具',
      'chapters.results': '结果概览',
      'chapters.conclusions': '讨论与结论',
      'chapters.references': '参考文献'
    },
    en: {
      'common.documentTitle': legacy.en.title,
      'common.languageLabel': legacy.en.label,
      'chapters.background': 'Background',
      'chapters.researchDesign': 'Research Design',
      'chapters.methods': 'Methods & Tools',
      'chapters.results': 'Results',
      'chapters.conclusions': 'Discussion & Conclusions',
      'chapters.references': 'References'
    },
    ja: {
      'common.documentTitle': legacy.ja.title,
      'common.languageLabel': legacy.ja.label,
      'chapters.background': '研究背景',
      'chapters.researchDesign': '研究設計',
      'chapters.methods': '方法とツール',
      'chapters.results': '結果概要',
      'chapters.conclusions': '考察と結論',
      'chapters.references': '参考文献'
    },
    'es-MX': {
      'common.documentTitle': legacy['es-MX'].title,
      'common.languageLabel': legacy['es-MX'].label,
      'chapters.background': 'Antecedentes',
      'chapters.researchDesign': 'Diseño de investigación',
      'chapters.methods': 'Métodos y herramientas',
      'chapters.results': 'Resultados',
      'chapters.conclusions': 'Discusión y conclusiones',
      'chapters.references': 'Referencias'
    }
  };
  const entries = {};

  sorted.forEach((record, index) => {
    const key = `legacy.text.${String(index + 1).padStart(4, '0')}`;
    dictionaries.zh[key] = record.source;
    dictionaries.en[key] = record.translations.en;
    dictionaries.ja[key] = cleanJapanese(record.translations.ja);
    dictionaries['es-MX'][key] = record.translations['es-MX'];
    entries[key] = { legacySource: record.source };
  });

  return {
    dictionaries,
    meta: {
      schemaVersion: 1,
      migrationSource: 'ppt/index.html',
      entries,
      droppedLegacyOrphans: orphanSources,
      forbiddenJapanesePhrases: ['现实', '现状', '原则', '价值', '视线', '信息传达']
    }
  };
}

const html = await readFile(htmlPath, 'utf8');
const result = buildDictionaries(readLegacyLanguages(html));
const outputs = new Map([
  ...Object.entries(result.dictionaries).map(([language, dictionary]) => [
    path.join(outDir, `${language}.json`),
    `${JSON.stringify(dictionary, null, 2)}\n`
  ]),
  [path.join(outDir, 'meta.json'), `${JSON.stringify(result.meta, null, 2)}\n`]
]);

if (process.argv.includes('--write')) {
  await mkdir(outDir, { recursive: true });
  await Promise.all([...outputs].map(([file, source]) => writeFile(file, source)));
  process.stdout.write(`WROTE ${outputs.size} i18n files with ${Object.keys(result.meta.entries).length} migrated entries\n`);
} else {
  let drift = 0;
  for (const [file, expected] of outputs) {
    const actual = await readFile(file, 'utf8').catch(() => '');
    if (actual !== expected) {
      process.stderr.write(`DRIFT ${path.relative(root, file)}\n`);
      drift += 1;
    }
  }
  if (drift) process.exitCode = 1;
  else process.stdout.write(`PASS ${outputs.size} i18n files are current\n`);
}
