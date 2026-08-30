import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'deck-manifest.json');
const legacyPath = path.join(root, 'ppt/index.html');
const outputDirectory = path.join(root, 'src/content/slides');
const write = process.argv.includes('--write');

function readAttribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? '';
}

function sanitizeMarkup(markup, assets) {
  return markup
    .replace(/\s+onclick="applyLanguage\('([^']+)'\)"/g, ' data-language="$1"')
    .replace(/\bsrc="([^"]+)"/g, (match, source) => {
      if (/^(?:data:|asset:|https?:)/i.test(source)) return match;
      const absolutePath = path.resolve(root, 'ppt', decodeURIComponent(source));
      const projectPath = path.relative(root, absolutePath);
      const asset = assets.find((candidate) => (candidate.legacyPath || candidate.path) === projectPath);
      assert.ok(asset, `legacy asset is not registered: ${projectPath}`);
      return `src="asset:${asset.id}"`;
    })
    .trim();
}

function extractLegacySlides(html, assets) {
  const slidePattern = /<section\s+class="[^"]*\bslide\b[^"]*"/g;
  const starts = [...html.matchAll(slidePattern)].map((match) => match.index);
  assert.equal(starts.length, 21, `expected 21 legacy slides, found ${starts.length}`);
  const navigationStart = html.indexOf('<div id="nav">', starts.at(-1));
  assert.notEqual(navigationStart, -1, 'legacy navigation boundary not found');

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? navigationStart;
    const section = html.slice(start, end).trim();
    const openingEnd = section.indexOf('>');
    const closingStart = section.lastIndexOf('</section>');
    assert.notEqual(closingStart, -1, `slide ${index + 1} closing tag not found`);
    return {
      openingTag: section.slice(0, openingEnd + 1),
      markup: sanitizeMarkup(section.slice(openingEnd + 1, closingStart), assets)
    };
  });
}

function createContent(slide, legacy) {
  const legacyClass = readAttribute(legacy.openingTag, 'class');
  return {
    id: slide.id,
    chapterId: slide.chapterId,
    layout: slide.layout,
    chapter: readAttribute(legacy.openingTag, 'data-chapter'),
    chapterTitle: readAttribute(legacy.openingTag, 'data-chapter-title'),
    shortTitle: readAttribute(legacy.openingTag, 'data-short-title'),
    animation: readAttribute(legacy.openingTag, 'data-animate'),
    legacyLayout: readAttribute(legacy.openingTag, 'data-layout'),
    legacyClass,
    assets: slide.assets,
    claims: slide.claims,
    markup: legacy.markup
  };
}

const [manifestText, legacyHtml] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(legacyPath, 'utf8')
]);
const manifest = JSON.parse(manifestText);
const legacySlides = extractLegacySlides(legacyHtml, manifest.assets);
const contents = manifest.slides.map((slide, index) => createContent(slide, legacySlides[index]));
const nextManifest = structuredClone(manifest);
nextManifest.slides.forEach((slide) => {
  slide.content = `src/content/slides/${slide.id}.json`;
});

if (write) {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(contents.map((content) => writeFile(
    path.join(outputDirectory, `${content.id}.json`),
    `${JSON.stringify(content, null, 2)}\n`
  )));
  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
  console.log(`Migrated ${contents.length} slides into ${path.relative(root, outputDirectory)}`);
} else {
  assert.deepEqual(manifest, nextManifest, 'deck manifest slide paths drifted; run with --write');
  await Promise.all(contents.map(async (content) => {
    const target = path.join(outputDirectory, `${content.id}.json`);
    assert.equal(await readFile(target, 'utf8'), `${JSON.stringify(content, null, 2)}\n`, `${content.id} drifted`);
  }));
  console.log(`Slide migration check passed for ${contents.length} slides`);
}
