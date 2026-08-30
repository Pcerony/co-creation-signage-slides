import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const slides = new Map([
  ['s11-principles-ar', ['method-sequence', 'method-principles']],
  ['s13-baseline-audit', ['method-sequence', 'method-audit']],
  ['s13b-state-analysis', ['method-sequence', 'method-diagnosis']],
  ['s14-stimulus-comparison', ['method-sequence', 'method-comparison']],
  ['s15-eye-tracking-system', ['method-sequence', 'method-system']],
]);

async function loadSlide(id) {
  const source = await readFile(new URL(`../../src/content/slides/${id}.json`, import.meta.url), 'utf8');
  return JSON.parse(source);
}

test('slides 10-14 use the shared unboxed method-sequence contract', async () => {
  for (const [id, classes] of slides) {
    const slide = await loadSlide(id);
    for (const className of classes) {
      assert.match(slide.markup, new RegExp(`\\b${className}\\b`), `${id} must use ${className}`);
    }
    assert.match(slide.markup, /data-i18n=/, `${id} must source revised copy from i18n`);
    assert.doesNotMatch(slide.markup, /background\s*:\s*#fff/i, `${id} must not add ordinary white cards`);
    assert.doesNotMatch(slide.markup, /box-shadow\s*:/i, `${id} must not add ordinary decorative shadows`);
  }
});

test('audit and diagnosis share the reconciled evidence totals', async () => {
  const audit = await loadSlide('s13-baseline-audit');
  const diagnosis = await loadSlide('s13b-state-analysis');

  for (const value of ['70', '182']) {
    assert.match(audit.markup, new RegExp(`>${value}<`), `audit must expose ${value}`);
    assert.match(diagnosis.markup, new RegExp(`>${value}<`), `diagnosis must expose ${value}`);
  }
  for (const value of ['41', '47', '94']) {
    assert.match(diagnosis.markup, new RegExp(`>${value}<`), `diagnosis must expose ${value}`);
  }
  assert.match(diagnosis.markup, />15%</, 'diagnosis must preserve the A1 share');
  assert.doesNotMatch(diagnosis.markup, />180</, 'diagnosis must not retain the superseded total');
});

test('baseline audit owns the participants and four-image cycle', async () => {
  const audit = await loadSlide('s13-baseline-audit');
  const diagnosis = await loadSlide('s13b-state-analysis');

  assert.match(audit.markup, /class="method-participants"/);
  for (const assetId of ['annotator-editor', 'annotator-map', 'annotator-coding', 'annotator-dashboard']) {
    assert.match(audit.markup, new RegExp(`asset:${assetId}`));
  }
  assert.match(audit.markup, /class="audit-evidence-pair"/);
  assert.match(audit.markup, /data-image-cycle/);
  assert.equal((audit.markup.match(/data-image-cycle-item/g) || []).length, 4);
  assert.doesNotMatch(diagnosis.markup, /class="method-participants"/);
});

test('baseline audit presents the analysis workflow as three compact cards', async () => {
  const audit = await loadSlide('s13-baseline-audit');

  assert.match(audit.markup, /class="audit-flow"/);
  assert.equal((audit.markup.match(/class="audit-flow__card"/g) || []).length, 3);
  assert.equal((audit.markup.match(/class="audit-flow__arrow"/g) || []).length, 2);
  for (const key of ['slides.s13.flow.import', 'slides.s13.flow.coding', 'slides.s13.flow.analysis']) {
    assert.match(audit.markup, new RegExp(`data-i18n="${key}"`));
  }
});

test('the shared stylesheet owns the method sequence geometry', async () => {
  const css = await readFile(new URL('../../src/styles/layouts.css', import.meta.url), 'utf8');
  for (const selector of ['.method-sequence', '.method-sequence__header', '.method-evidence']) {
    assert.match(css, new RegExp(selector.replace('.', '\\.')), `layouts.css must own ${selector}`);
  }
  assert.match(css, /@media\s*\(max-width:/, 'layouts.css must include bounded narrow behavior');
});
