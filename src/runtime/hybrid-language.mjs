export const BALANCED_EMPHASIS_SELECTOR = [
  'h1',
  'h2',
  'h3',
  '.lead',
  '.t-cat',
  '.tag',
  '.keyword',
  '.main-st',
  '.t-body-emp',
  '.quote',
  'blockquote',
  '.kpi-cell .lbl',
  '.row-lbl',
  '.row-val',
  '.bar-tower .lbl',
  '.ledger-row',
  '.phase',
  '.ttl',
  '.col-ttl'
].join(',');

export function resolveCompositeLanguage(language, compositeLanguages = {}) {
  return compositeLanguages[language] || null;
}

export function languageTag(language, compositeLanguages = {}) {
  return resolveCompositeLanguage(language, compositeLanguages)?.primary || language;
}

export function shouldAnnotateElement(element) {
  if (!element) return false;
  if (element.closest('[data-hybrid-ja="never"]')) return false;
  if (element.closest('[data-hybrid-ja="always"]')) return true;
  return Boolean(element.closest(BALANCED_EMPHASIS_SELECTOR));
}
