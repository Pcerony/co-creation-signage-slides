const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'ppt', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

if (!/const\s+LANGUAGES\s*=/.test(html)) {
  fail('missing LANGUAGES configuration');
} else {
  pass('deck declares LANGUAGES configuration');
}

['zh', 'en', 'ja', 'es-MX'].forEach(lang => {
  const pattern = new RegExp(`['"]${lang}['"]\\s*:\\s*\\{`);
  if (!pattern.test(html)) {
    fail(`missing language pack for ${lang}`);
  } else {
    pass(`language pack exists for ${lang}`);
  }
});

if (!/function\s+applyLanguage\(/.test(html)) {
  fail('missing applyLanguage() runtime switcher');
} else {
  pass('deck has applyLanguage() runtime switcher');
}

if (/LANGUAGES\[['"]ja['"]\]\.strings\s*=\s*LANGUAGES\[['"]en['"]\]\.strings/.test(html)) {
  fail('Japanese language pack aliases English instead of providing Japanese strings');
} else {
  pass('Japanese language pack is independent from English');
}

if (/LANGUAGES\[['"]es-MX['"]\]\.strings\s*=\s*LANGUAGES\[['"]en['"]\]\.strings/.test(html)) {
  fail('Mexican Spanish language pack aliases English instead of providing Spanish strings');
} else {
  pass('Mexican Spanish language pack is independent from English');
}

if (!/dataset\.langSwitch/.test(html) || !/dataset\.langButton/.test(html)) {
  fail('ESC overview does not build language switch controls');
} else {
  pass('ESC overview builds language switch controls');
}

const overviewBlock = html.match(/function\s+buildOverview\(\)\{[\s\S]*?function\s+toggleOverview\(\)/);
if (!overviewBlock || !/dataset\.langSwitch/.test(overviewBlock[0]) || !/dataset\.langButton/.test(overviewBlock[0])) {
  fail('language switch is not owned by buildOverview()');
} else {
  pass('language switch is owned by the ESC overview');
}

const slideMarkup = html.match(/<div id="deck">[\s\S]*?<div id="nav"><\/div>/)?.[0] || '';
if (/data-lang-switch|data-lang-button|data\.langSwitch|data\.langButton/.test(slideMarkup)) {
  fail('language switch appears outside the ESC overview flow');
} else {
  pass('language switch is not rendered as a normal slide control');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
