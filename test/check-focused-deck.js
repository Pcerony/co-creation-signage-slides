const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'ppt', 'index.html'),
  'utf8'
);

function check(name, condition) {
  if (!condition) {
    console.error(`FAIL ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${name}`);
}

check('deck exposes a presentation stage', /id="presentation-stage"/.test(html));
check(
  'slides use a fixed 4:3 logical canvas',
  /--slide-width:\s*1200px[\s\S]*--slide-height:\s*900px/.test(html)
);
check('top indicator includes chapter', /id="indicator-chapter"/.test(html));
check('top indicator includes title', /id="indicator-title"/.test(html));
check('top indicator includes page number', /id="indicator-page"/.test(html));
check(
  'legacy navigation keeps the chapter timeline in the upper region',
  /id="presentation-indicator"[\s\S]*id="indicator-timeline-chapters"/.test(html)
);
check(
  'legacy navigation keeps subtitle and page in the lower footer',
  /id="presentation-footer"[\s\S]*id="indicator-title"[\s\S]*id="indicator-page"/.test(html)
);
check(
  'legacy navigation replaces the two-row header',
  /id="presentation-footer"/.test(html) && !/indicator-detail-row/.test(html)
);
check(
  'slides provide chapter metadata',
  /data-chapter="\d+"\s+data-chapter-title="[^"]+"/.test(html)
);
check(
  'navigation assigns previous state',
  /classList\.toggle\(['"]is-prev['"]/.test(html)
);
check(
  'navigation assigns current state',
  /classList\.toggle\(['"]is-current['"]/.test(html)
);
check(
  'navigation assigns next state',
  /classList\.toggle\(['"]is-next['"]/.test(html)
);
check(
  'navigation updates indicator',
  /updatePresentationIndicator\(\)/.test(html)
);
check('carousel geometry is responsive', /updateCarouselGeometry/.test(html));
check(
  'navigation no longer translates by viewport pages',
  !/deck\.style\.transform\s*=\s*`translateX\(\$\{-idx\*100\}vw\)`/.test(html)
);
check(
  'adjacent previews support click navigation',
  /slide\.classList\.contains\(['"]is-prev['"]\)[\s\S]*go\(idx\s*-\s*1\)/.test(html) &&
    /slide\.classList\.contains\(['"]is-next['"]\)[\s\S]*go\(idx\s*\+\s*1\)/.test(html)
);

const indicatorMarkup = html.match(
  /<header\s+id="presentation-indicator"[\s\S]*?<\/header>/
)?.[0] || '';
const footerMarkup = html.match(
  /<footer\s+id="presentation-footer"[\s\S]*?<\/footer>/
)?.[0] || '';

check(
  'legacy visible navigation owns title and page in the footer',
  /id="indicator-title"[\s\S]*id="indicator-page"/.test(footerMarkup) &&
    /class="chapter-sub-zh"/.test(footerMarkup) &&
    /class="indicator-page-wrapper"/.test(footerMarkup)
);
check(
  'deprecated wide progress bar is hidden and not rendered in the header',
  !/indicator-track/.test(indicatorMarkup) &&
    /<div\s+style="display:none;">[\s\S]*indicator-progress/.test(footerMarkup)
);
check(
  'legacy indicator title follows the active slide heading',
  /const heading=slide\.querySelector\('h1,h2'\)/.test(html)
);
check('deck does not truncate text with line-clamp', !/line-clamp/i.test(html));
check(
  'font sizes use absolute logical pixels',
  !/font-size\s*:[^;}]*(?:vw|vh|em|rem|%)/i.test(html)
);
check(
  'legacy viewport-sized deck shell is removed',
  !/#deck\s*\{[^}]*width\s*:\s*10000vw/i.test(html) &&
    !/\.slide\s*\{[^}]*width\s*:\s*100vw/i.test(html)
);
check('deck declares evidence-slide styling', /\.evidence-layout\s*\{/.test(html));
check('deck declares card reduction mode', /card-reduction-mode/.test(html));
