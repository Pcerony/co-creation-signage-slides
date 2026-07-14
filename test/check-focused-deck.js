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
check('top indicator includes progress', /id="indicator-progress"/.test(html));
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
