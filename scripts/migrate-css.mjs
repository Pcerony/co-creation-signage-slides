import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'ppt/index.html');
const outputDirectory = path.join(root, 'src/styles');
const write = process.argv.includes('--write');
const runtimeComponents = `
.esc-grid-wrap{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;
  max-width:1100px;margin:5vh auto 0;
}
.overview-slide-button{
  min-height:64px;padding:12px 14px;border:1px solid var(--border-subtle);
  background:var(--paper);color:var(--text-primary);font:500 14px/1.3 var(--sans),var(--sans-zh);
  text-align:left;cursor:pointer;
}
.overview-slide-button:hover,.overview-slide-button:focus-visible{
  border-color:var(--accent);outline:2px solid rgba(var(--accent-rgb),.18);outline-offset:1px;
}
@media (max-width:700px){.esc-grid-wrap{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2vh}.overview-slide-button{min-height:48px;font-size:11px}}
`.trim();
const hybridLanguageStyles = `
.hybrid-ja-text{
  display:block;margin-top:.22em;font-family:var(--sans-zh);font-size:.62em;
  font-weight:400;line-height:1.25;letter-spacing:0;text-transform:none;opacity:.72;
}
.t-cat .hybrid-ja-text,.tag .hybrid-ja-text,.row-lbl .hybrid-ja-text,
.row-val .hybrid-ja-text,.bar-tower .lbl .hybrid-ja-text{
  margin-top:.12em;font-size:.58em;
}
body.lang-en-ja .hybrid-ja-text{
  font-style:normal;letter-spacing:0;text-transform:none;
}
`.trim();
const stageChromeStyles = `
/* Runtime stage chrome: page meta above, chapter progress below. */
:root{--stage-balanced-gap:24px;}
#presentation-stage{transition:background .52s cubic-bezier(0.16,1,0.3,1);}
#deck{
  transition:top .8s cubic-bezier(0.65,0,0.35,1),
    transform .8s cubic-bezier(0.65,0,0.35,1),opacity .22s var(--ease-prod);
}
.slide-shell{overflow:visible;}
.slide-shell.is-fullscreen-shell{
  width:var(--fullscreen-preview-render-width,var(--slide-render-width));
  flex-basis:var(--fullscreen-preview-render-width,var(--slide-render-width));
}
.slide{
  position:absolute;left:50%;top:50%;
  --stage-slide-scale:var(--slide-scale);
  transform:translate(-50%,-50%) scale(var(--stage-slide-scale));transform-origin:center center;
  transition:transform .8s cubic-bezier(0.65,0,0.35,1),
    clip-path .8s cubic-bezier(0.65,0,0.35,1),
    box-shadow .42s var(--ease-prod),opacity .42s var(--ease-prod);
}
.slide.is-fullscreen-capable{
  width:1600px;height:900px;flex-basis:1600px;
  --stage-slide-scale:var(--fullscreen-preview-scale,var(--slide-scale));
  transform:translate(-50%,-50%) scale(var(--stage-slide-scale));
}
#presentation-indicator{
  top:var(--stage-balanced-gap);display:flex;align-items:center;justify-content:center;gap:16px;
  transform:translateX(-50%) translateY(0);
  transition:transform .8s cubic-bezier(0.65,0,0.35,1);
}
#presentation-footer{
  bottom:var(--stage-balanced-gap);display:flex;align-items:flex-start;justify-content:center;
  transform:translateX(-50%) translateY(0);
  transition:transform .8s cubic-bezier(0.65,0,0.35,1);
}
#presentation-footer .indicator-timeline-container{
  align-items:flex-start;padding-bottom:0;
}
#presentation-footer #indicator-timeline-chapters{
  align-items:flex-start;
}
body.fullscreen-stage #presentation-stage{background:var(--fullscreen-stage-background,var(--paper));}
body.fullscreen-stage #presentation-indicator,
body.fullscreen-stage #presentation-footer{
  pointer-events:none;
}
body.fullscreen-stage #presentation-indicator{
  transform:translateX(-50%) translateY(calc(-100% - var(--stage-balanced-gap) - 8px));
}
body.fullscreen-stage #presentation-footer{
  transform:translateX(-50%) translateY(calc(100% + var(--stage-balanced-gap) + 8px));
}
body.fullscreen-stage .slide.is-current,
body.fullscreen-stage .slide.is-current .canvas-card{
  border-radius:0;box-shadow:none;
}
body.fullscreen-stage .slide.is-current{
  transform:translate(-50%,-50%) scale(var(--fullscreen-slide-scale,var(--slide-scale)));
}
body.fullscreen-stage.entering-fullscreen-stage .slide.is-prev{
  transform:translate(-50%,-50%) translateX(calc(-1 * var(--fullscreen-current-overhang,0px))) scale(var(--stage-slide-scale));
}
body.fullscreen-stage.entering-fullscreen-stage .slide.is-next{
  transform:translate(-50%,-50%) translateX(var(--fullscreen-current-overhang,0px)) scale(var(--stage-slide-scale));
}
.slide-shell.is-current-shell{z-index:3;}
body.fullscreen-stage .slide:not(.is-current){clip-path:inset(0 100% 0 0);}
body.fullscreen-stage.stage-mode-transitioning .slide.is-prev,
body.fullscreen-stage.stage-mode-transitioning .slide.is-next{clip-path:inset(0);}
body.fullscreen-stage:not(.stage-mode-transitioning) .slide:not(.is-current){
  transition:transform .8s cubic-bezier(0.65,0,0.35,1),
    box-shadow .42s var(--ease-prod),opacity .42s var(--ease-prod);
}
body.stage-mode-transitioning #deck{
  pointer-events:none;
}
body.stage-mode-transitioning .slide.is-current{
  opacity:1!important;
  transition:transform .8s cubic-bezier(0.65,0,0.35,1),
    clip-path .8s cubic-bezier(0.65,0,0.35,1),box-shadow .42s var(--ease-prod);
}
@media (prefers-reduced-motion:reduce){
  #presentation-stage,#presentation-indicator,#presentation-footer{transition:none;}
}
`.trim();

function matchingBrace(text, openingIndex) {
  let depth = 0;
  for (let index = openingIndex; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}' && --depth === 0) return index;
  }
  throw new Error('unclosed CSS block');
}

function segment(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `CSS marker not found: ${start}`);
  assert.notEqual(endIndex, -1, `CSS marker not found: ${end}`);
  return text.slice(startIndex, endIndex).trim();
}

function extractStyleBlocks(html) {
  return [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1].trim());
}

const html = await readFile(sourcePath, 'utf8');
const styleBlocks = extractStyleBlocks(html);
assert.equal(styleBlocks.length, 2, `expected 2 legacy style blocks, found ${styleBlocks.length}`);
const [primary, visibilityOverrides] = styleBlocks;
const rootStart = primary.indexOf(':root');
const rootOpen = primary.indexOf('{', rootStart);
const rootEnd = matchingBrace(primary, rootOpen) + 1;
const languageMarker = '/* Language-specific layout adjustments for i18n */';
const stageMarker = '/* ============ WebGL 网格背景';
const componentMarker = '/* ============ 装饰: 极细分隔线';
const layoutMarker = '/* ============================================================';

const files = {
  'tokens.css': primary.slice(rootStart, rootEnd).trim(),
  'base.css': primary.slice(rootEnd, primary.indexOf(languageMarker)).trim(),
  'languages.css': `${segment(primary, languageMarker, stageMarker)}\n\n${visibilityOverrides}\n\n${hybridLanguageStyles}`,
  'stage.css': segment(primary, stageMarker, componentMarker),
  'components.css': `${segment(primary, componentMarker, layoutMarker)}\n\n${runtimeComponents}`,
  'layouts.css': `${primary.slice(primary.indexOf(layoutMarker)).trim()}\n\n${stageChromeStyles}`
};

if (write) {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(Object.entries(files).map(([file, css]) => writeFile(
    path.join(outputDirectory, file),
    `${css}\n`
  )));
  console.log(`Migrated ${primary.length + visibilityOverrides.length} CSS characters into ${Object.keys(files).length} modules`);
} else {
  await Promise.all(Object.entries(files).map(async ([file, css]) => {
    assert.equal(await readFile(path.join(outputDirectory, file), 'utf8'), `${css}\n`, `${file} drifted`);
  }));
  console.log(`CSS migration check passed for ${Object.keys(files).length} modules`);
}
