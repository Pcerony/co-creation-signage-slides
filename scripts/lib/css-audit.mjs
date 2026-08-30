export const STYLE_FILES = [
  'tokens.css',
  'base.css',
  'stage.css',
  'layouts.css',
  'components.css',
  'languages.css'
];

export function auditCss(styles) {
  const issues = [];
  for (const file of STYLE_FILES) {
    if (!(file in styles)) issues.push(`missing style module ${file}`);
  }

  for (const [file, css] of Object.entries(styles)) {
    if (/<\/?style\b/i.test(css)) issues.push(`${file}: HTML style tag is forbidden`);
    if (/line-clamp\s*:/i.test(css)) issues.push(`${file}: line-clamp is forbidden`);
    const fontSizes = [...css.matchAll(/font-size\s*:\s*([^;}]+)/gi)];
    for (const match of fontSizes) {
      if (/\d(?:\.\d+)?v[wh]\b/i.test(match[1])) {
        issues.push(`${file}: viewport-relative font-size is forbidden (${match[1].trim()})`);
      }
    }
  }
  return issues;
}
