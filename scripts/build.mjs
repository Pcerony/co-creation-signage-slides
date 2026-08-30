import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { build as esbuild, transform } from 'esbuild';

import { renderSlide } from './lib/render-slide.mjs';
import { embedHtmlAssets } from './lib/embed-assets.mjs';
import { validateProjectFiles } from './validate-content.mjs';
import { sourceLanguageIds } from './lib/i18n.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'dist/index.html');
const STYLE_ORDER = ['tokens.css', 'base.css', 'languages.css', 'stage.css', 'components.css', 'layouts.css'];

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function bundleRuntime(data) {
  const result = await esbuild({
    entryPoints: [path.join(root, 'src/runtime/main.mjs')],
    bundle: true,
    format: 'iife',
    minify: true,
    platform: 'browser',
    write: false
  });
  const serialized = JSON.stringify(data).replaceAll('<', '\\u003c');
  return `window.__deckData=${serialized};${result.outputFiles[0].text}`;
}

export async function buildDeck({
  sourceDateEpoch = process.env.SOURCE_DATE_EPOCH || '1784073600',
  write = false,
  check = false
} = {}) {
  const validation = await validateProjectFiles();
  if (validation.issues.length) throw new Error(`content validation failed:\n${validation.issues.join('\n')}`);
  const manifest = validation.manifest;
  const [entry, dictionaries, styleSources, contents] = await Promise.all([
    readFile(path.join(root, 'src/entry.html'), 'utf8'),
    Promise.all(sourceLanguageIds(manifest).map(async (language) => [
      language,
      JSON.parse(await readFile(path.join(root, `src/i18n/${language}.json`), 'utf8'))
    ])).then(Object.fromEntries),
    Promise.all(STYLE_ORDER.map((file) => readFile(path.join(root, `src/styles/${file}`), 'utf8'))),
    Promise.all(manifest.slides.map((slide) => readFile(path.join(root, slide.content), 'utf8').then(JSON.parse)))
  ]);
  const slideMarkup = manifest.slides.map((slide, index) => {
    const rendered = renderSlide({ slide, content: contents[index] });
    return index <= 1 ? rendered : rendered.replace(/\bsrc="(asset:[^"]+)"/g, 'data-src="$1"');
  }).join('\n');
  const slides = await embedHtmlAssets(
    slideMarkup,
    { root, assets: manifest.assets }
  );
  const css = (await transform(styleSources.join('\n'), { loader: 'css', minify: true })).code;
  const runtime = await bundleRuntime({ manifest, dictionaries });
  const html = entry
    .replace('{{BUILD_EPOCH}}', String(sourceDateEpoch))
    .replace('{{STYLES}}', css)
    .replace('{{SLIDES}}', slides)
    .replace('{{RUNTIME}}', runtime);

  assert.equal((html.match(/data-slide-id=/g) || []).length, manifest.slides.length);
  assert.doesNotMatch(html, /<(?:link|script)[^>]+(?:href|src)="https?:/i);

  if (check) {
    if (!await exists(outputPath)) throw new Error('dist/index.html is missing; run npm run build');
    assert.equal(await readFile(outputPath, 'utf8'), html, 'dist/index.html drifted; run npm run build');
  }
  if (write) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    const temporaryPath = path.join(path.dirname(outputPath), `.tmp-${process.pid}-index.html`);
    try {
      await writeFile(temporaryPath, html);
      await rename(temporaryPath, outputPath);
    } finally {
      await rm(temporaryPath, { force: true });
    }
  }
  return { html, outputPath };
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirect) {
  const check = process.argv.includes('--check');
  await buildDeck({ check, write: !check });
  console.log(check ? 'Build artifact is current' : `Built ${path.relative(root, outputPath)}`);
}
