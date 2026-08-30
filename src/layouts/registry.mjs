const LAYOUTS = [
  'cover',
  'standard',
  'evidence',
  'process',
  'principles',
  'audit',
  'comparison',
  'system',
  'heatmap',
  'data',
  'closing',
  'references'
];

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderMarkup(markup) {
  if (typeof markup === 'string') return markup.trim();
  if (Array.isArray(markup) && markup.every(fragment => typeof fragment === 'string')) {
    return markup.join('\n').trim();
  }
  throw new TypeError('slide markup must be a string or an array of strings');
}

function renderLegacyLayout({ slide, content }) {
  const legacyClasses = String(content.legacyClass || '')
    .split(/\s+/)
    .filter((className) => className && className !== 'slide');
  const className = ['slide', ...legacyClasses].join(' ');
  const attributes = [
    ['class', className],
    ['data-slide-id', slide.id],
    ['data-chapter', content.chapter || slide.chapterId],
    ['data-chapter-id', slide.chapterId],
    ['data-layout', content.legacyLayout || slide.layout],
    ['data-layout-id', slide.layout],
    ['data-short-title', content.shortTitle],
    ['data-animate', content.animation]
  ]
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(' ');

  return `<section ${attributes}>\n${renderMarkup(content.markup)}\n</section>`;
}

export const layoutRegistry = new Map(
  LAYOUTS.map((layout) => [layout, { render: renderLegacyLayout }])
);
