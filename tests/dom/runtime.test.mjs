import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeckController } from '../../src/runtime/deck-controller.mjs';
import { adjacentSlideIndexes } from '../../src/runtime/asset-loader.mjs';
import { isFullscreenSlideId, stageGeometry } from '../../src/runtime/carousel.mjs';
import { resolveInitialSlide } from '../../src/runtime/navigation.mjs';
import { chapterProgressModel } from '../../src/runtime/chapter-progress.mjs';
import {
  BALANCED_EMPHASIS_SELECTOR,
  languageTag,
  resolveCompositeLanguage,
  shouldAnnotateElement
} from '../../src/runtime/hybrid-language.mjs';
import { translationKeyForNode } from '../../src/runtime/i18n.mjs';

test('controller owns bounded slide and UI state', () => {
  const controller = createDeckController({ slideCount: 3, languages: ['zh', 'en'] });
  const states = [];
  const unsubscribe = controller.subscribe((state) => states.push(state));

  controller.dispatch({ type: 'GO_TO', index: 99 });
  controller.dispatch({ type: 'SET_LANGUAGE', language: 'en' });
  controller.dispatch({ type: 'TOGGLE_OVERVIEW' });

  assert.deepEqual(controller.getState(), {
    currentSlideIndex: 2,
    language: 'en',
    overviewOpen: true,
    lowPowerMode: false
  });
  assert.equal(states.length, 4);
  unsubscribe();
  controller.destroy();
  assert.throws(() => controller.dispatch({ type: 'NEXT' }), /destroyed/);
});

test('controller rejects unknown languages and clamps navigation', () => {
  const controller = createDeckController({ slideCount: 2, languages: ['zh'] });
  assert.throws(() => controller.dispatch({ type: 'SET_LANGUAGE', language: 'xx' }), /unsupported language/);
  controller.dispatch({ type: 'PREVIOUS' });
  assert.equal(controller.getState().currentSlideIndex, 0);
});

test('controller gates navigation while a stage transition is active', () => {
  const controller = createDeckController({
    slideCount: 5,
    languages: ['en'],
    initialSlideIndex: 1
  });

  controller.setNavigationLocked(true);
  controller.dispatch({ type: 'NEXT' });
  controller.dispatch({ type: 'PREVIOUS' });
  controller.dispatch({ type: 'GO_TO', index: 4 });
  assert.equal(controller.getState().currentSlideIndex, 1);

  controller.dispatch({ type: 'GO_TO', index: 4, force: true });
  assert.equal(controller.getState().currentSlideIndex, 4);

  controller.setNavigationLocked(false);
  controller.dispatch({ type: 'PREVIOUS' });
  assert.equal(controller.getState().currentSlideIndex, 3);
});

test('URL and lazy-media helpers are deterministic', () => {
  assert.equal(resolveInitialSlide('?slide=3', 5), 2);
  assert.equal(resolveInitialSlide('?slide=bad', 5), 0);
  assert.deepEqual(adjacentSlideIndexes(2, 5), [1, 2, 3]);
  assert.deepEqual(adjacentSlideIndexes(0, 1), [0]);
});

test('composite language resolves to English with Japanese emphasis', () => {
  const composites = {
    'en-ja': { primary: 'en', secondary: 'ja', policy: 'balanced-emphasis' }
  };
  assert.deepEqual(resolveCompositeLanguage('en-ja', composites), composites['en-ja']);
  assert.equal(resolveCompositeLanguage('en', composites), null);
  assert.equal(languageTag('en-ja', composites), 'en');
  assert.equal(languageTag('ja', composites), 'ja');
  assert.match(BALANCED_EMPHASIS_SELECTOR, /h1/);
  assert.match(BALANCED_EMPHASIS_SELECTOR, /\.lead/);
  assert.match(BALANCED_EMPHASIS_SELECTOR, /\.row-val/);
});

test('hybrid emphasis supports explicit always and never overrides', () => {
  const element = (responses) => ({
    closest: (selector) => responses.get(selector) || null
  });
  assert.equal(shouldAnnotateElement(element(new Map([
    ['[data-hybrid-ja="always"]', {}]
  ]))), true);
  assert.equal(shouldAnnotateElement(element(new Map([
    ['[data-hybrid-ja="never"]', {}],
    [BALANCED_EMPHASIS_SELECTOR, {}]
  ]))), false);
  assert.equal(shouldAnnotateElement(element(new Map([
    [BALANCED_EMPHASIS_SELECTOR, {}]
  ]))), true);
});

test('explicit translation keys override legacy source-text matching', () => {
  const sourceToKey = new Map([['旧文本', 'legacy.text.0001']]);
  const explicit = {
    nodeValue: '任意后备文本',
    parentElement: { dataset: { i18n: 'common.interpretiveSignage' } }
  };
  const legacy = {
    nodeValue: ' 旧文本 ',
    parentElement: { dataset: {} }
  };
  assert.equal(translationKeyForNode(explicit, sourceToKey), 'common.interpretiveSignage');
  assert.equal(translationKeyForNode(legacy, sourceToKey), 'legacy.text.0001');
});

test('chapter progress groups stable slide indexes by manifest chapter', () => {
  const chapters = [
    { id: 'context', titleKey: 'chapters.context' },
    { id: 'methods', titleKey: 'chapters.methods' }
  ];
  const slides = [
    { chapterId: 'context' },
    { chapterId: 'context' },
    { chapterId: 'methods' }
  ];
  assert.deepEqual(chapterProgressModel(chapters, slides), [
    { id: 'context', titleKey: 'chapters.context', slideIndexes: [0, 1] },
    { id: 'methods', titleKey: 'chapters.methods', slideIndexes: [2] }
  ]);
});

test('fullscreen geometry fits a native 16:9 canvas without cropping', () => {
  const geometry = stageGeometry({
    width: 1440,
    height: 1000,
    currentSlideIndex: 0,
    topChromeHeight: 17,
    bottomChromeHeight: 21
  });
  assert.equal(geometry.cover, true);
  assert.equal(geometry.currentRenderWidth, 1440);
  assert.equal(geometry.currentRenderHeight, 810);
  assert.equal(geometry.currentRenderWidth / geometry.currentRenderHeight, 16 / 9);
  assert.ok(Math.abs(geometry.fullscreenPreviewScale * 900 - geometry.renderHeight) < 0.001);
  assert.ok(Math.abs(geometry.fullscreenPreviewScale * 1600 - geometry.renderWidth * (4 / 3)) < 0.001);
  assert.ok(Math.abs(geometry.deckTop + geometry.renderHeight / 2 - 500) < 0.001);
});

test('presentation geometry divides vertical whitespace into four equal gaps', () => {
  const geometry = stageGeometry({
    width: 1440,
    height: 1000,
    currentSlideIndex: 1,
    topChromeHeight: 17,
    bottomChromeHeight: 21
  });
  const gaps = [
    geometry.balancedGap,
    geometry.deckTop - geometry.balancedGap - 17,
    1000 - geometry.balancedGap - 21 - geometry.deckTop - geometry.renderHeight,
    geometry.balancedGap
  ];
  assert.equal(geometry.cover, false);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) < 0.001);
});

test('fullscreen slides are selected by stable ID', () => {
  assert.equal(isFullscreenSlideId('s01-cover'), true);
  assert.equal(isFullscreenSlideId('s08-research-process'), true);
  assert.equal(isFullscreenSlideId('s16-heatmap-overview'), true);
  assert.equal(isFullscreenSlideId('s02-background'), false);
});

test('fullscreen and presentation modes share one stable track pitch', () => {
  const input = {
    width: 1440,
    height: 1000,
    currentSlideIndex: 15,
    topChromeHeight: 17,
    bottomChromeHeight: 21
  };
  const fullscreen = stageGeometry({ ...input, fullscreen: true });
  const presentation = stageGeometry({ ...input, fullscreen: false });

  assert.equal(fullscreen.renderWidth, presentation.renderWidth);
  assert.equal(fullscreen.renderHeight, presentation.renderHeight);
  assert.equal(fullscreen.slideGap, presentation.slideGap);
  assert.equal(fullscreen.slotPitch, presentation.slotPitch);
  assert.equal(fullscreen.deckX, presentation.deckX);
  assert.ok(fullscreen.currentRenderWidth > presentation.currentRenderWidth);
});

test('stage track reserves the configured gap around fullscreen preview widths', () => {
  const input = {
    width: 1440,
    height: 1000,
    topChromeHeight: 17,
    bottomChromeHeight: 21,
    fullscreenSlideIndexes: [0, 7, 15]
  };
  const beforeFullscreen = stageGeometry({ ...input, currentSlideIndex: 6, fullscreen: false });
  const fullscreen = stageGeometry({ ...input, currentSlideIndex: 7, fullscreen: true });

  assert.ok(Math.abs(beforeFullscreen.fullscreenPreviewRenderWidth - beforeFullscreen.renderWidth * (4 / 3)) < 0.001);
  assert.equal(beforeFullscreen.currentSlotWidth, beforeFullscreen.renderWidth);
  assert.equal(fullscreen.currentSlotWidth, fullscreen.fullscreenPreviewRenderWidth);
  assert.ok(Math.abs(
    beforeFullscreen.deckX - fullscreen.deckX
      - (beforeFullscreen.currentSlotWidth / 2 + beforeFullscreen.slideGap + fullscreen.currentSlotWidth / 2)
  ) < 0.001);
});

test('fullscreen geometry exposes the current canvas overhang for neighbor motion', () => {
  const geometry = stageGeometry({
    width: 1920,
    height: 1080,
    currentSlideIndex: 0,
    fullscreen: true,
    topChromeHeight: 17,
    bottomChromeHeight: 21,
    fullscreenSlideIndexes: [0, 7, 15]
  });

  assert.ok(geometry.fullscreenCurrentOverhang > 0);
  assert.ok(Math.abs(
    geometry.fullscreenCurrentOverhang - (geometry.currentRenderWidth - geometry.currentSlotWidth) / 2
  ) < 0.001);
});
