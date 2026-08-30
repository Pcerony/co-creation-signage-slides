const STABLE_KEY = /^(?:common|chapters|slides|legacy)\.[A-Za-z0-9.-]+$/;
const CJK = /[\u3400-\u9fff]/;

export function sourceLanguageIds(manifest) {
  const compositeIds = new Set(Object.keys(manifest.compositeLanguages || {}));
  return (manifest.languages || []).filter(language => !compositeIds.has(language));
}

export function translate(dictionary, key, params = {}) {
  if (!Object.hasOwn(dictionary, key)) throw new Error(`missing translation key ${key}`);
  return String(dictionary[key]).replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (match, name) => {
    if (!Object.hasOwn(params, name)) return match;
    return String(params[name]);
  });
}

export function findDuplicateJsonKeys(source) {
  const counts = new Map();
  for (const match of source.matchAll(/^\s*"((?:\\.|[^"\\])+)"\s*:/gm)) {
    const key = JSON.parse(`"${match[1]}"`);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts].filter(([, count]) => count > 1).map(([key]) => key);
}

export function auditDictionaries(dictionaries, { forbiddenJapanesePhrases = [] } = {}) {
  const issues = [];
  const languages = ['zh', 'en', 'ja', 'es-MX'];
  const referenceKeys = Object.keys(dictionaries.zh || {}).sort();

  for (const language of languages) {
    const dictionary = dictionaries[language];
    if (!dictionary) {
      issues.push(`${language}: missing dictionary`);
      continue;
    }
    const keys = Object.keys(dictionary).sort();
    if (JSON.stringify(keys) !== JSON.stringify(referenceKeys)) {
      issues.push(`${language}: key set differs from zh`);
    }
    for (const [key, value] of Object.entries(dictionary)) {
      if (!STABLE_KEY.test(key)) issues.push(`${language}: unstable key ${key}`);
      if (!String(value).trim()) issues.push(`${language}: empty value for ${key}`);
      if ((language === 'en' || language === 'es-MX') && CJK.test(String(value))) {
        issues.push(`${language}: CJK leakage in ${key}`);
      }
      if (language === 'ja') {
        for (const phrase of forbiddenJapanesePhrases) {
          if (String(value).includes(phrase)) issues.push(`ja: forbidden phrase ${phrase} in ${key}`);
        }
      }
    }
  }

  return issues;
}
