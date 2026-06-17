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

const slideTypes = [...html.matchAll(/<section[^>]*class="[^"]*\bslide\b[^"]*"[^>]*data-animate="([^"]+)"/g)]
  .map(match => match[1]);
const recipes = [...html.matchAll(/'([^']+)':\s*r[A-Za-z0-9_]+/g)]
  .map(match => match[1]);

const missingRecipes = [...new Set(slideTypes.filter(type => !recipes.includes(type)))];
if (missingRecipes.length) {
  fail(`missing animation recipes for: ${missingRecipes.join(', ')}`);
} else {
  pass(`all ${new Set(slideTypes).size} slide animation types have recipes`);
}

if (/setTimeout\(\s*\(\)\s*=>\s*window\.__playSlide\(idx\)\s*,\s*450\s*\)/.test(html)) {
  fail('go() still delays slide animation by 450ms after the deck transform');
} else {
  pass('go() does not delay slide animation after navigation');
}

if (!/data-motion-item/.test(html)) {
  fail('deck has no shared motion item preparation marker');
} else {
  pass('deck has shared motion item preparation markers');
}

if (!/__prepareSlideMotion/.test(html)) {
  fail('deck has no pre-navigation motion preparation hook');
} else {
  pass('deck has a pre-navigation motion preparation hook');
}

const genericScalePatterns = [
  /setPrepared[\s\S]*?translate\([^`]+scale\(/,
  /fromTransform[\s\S]*?translate\([^`]+scale\(/
];
if (genericScalePatterns.some(pattern => pattern.test(html))) {
  fail('generic motion preparation still uses scale(), causing page-level zoom artifacts');
} else {
  pass('generic motion preparation uses no scale transforms');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
