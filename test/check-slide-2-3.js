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

const targets = [
  { title: '困境：知识超载', image: '01-field-observation.jpg' },
  { title: '困境：评估局限', image: '02-experiment-scene.jpg' }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slideMarkup(title) {
  return html.match(
    new RegExp(`<section[^>]*data-short-title="${escapeRegExp(title)}"[\\s\\S]*?<\\/section>`)
  )?.[0] || '';
}

targets.forEach(({ title, image }) => {
  const section = slideMarkup(title);
  const label = `slide ${title}`;
  check(`${label} exists`, section.length > 0);
  check(`${label} uses evidence layout`, /class="[^"]*evidence-slide/.test(section) && /class="evidence-layout"/.test(section));
  check(`${label} has one visible heading`, (section.match(/<h2\b/g) || []).length === 1 && !/<h3\b/.test(section));
  check(`${label} uses a large evidence media frame`, /class="[^"]*evidence-media/.test(section) && section.includes(image));
  check(`${label} has no nested neutral card`, !/background:#fff;border:1px solid var\(--border-subtle\)/.test(section));
  check(`${label} does not use viewport thumbnail sizing`, !/width:28vw|height:14vh/.test(section));
});

check(
  'deck enables card reduction mode',
  /<body[^>]*card-reduction-mode/.test(html)
);
check(
  'deck defines open neutral card treatment',
  /\.card-reduction-mode\s+\.slide\s+div\[style\*="background:#fff"\]/.test(html) &&
    /background:transparent!important/.test(html)
);
