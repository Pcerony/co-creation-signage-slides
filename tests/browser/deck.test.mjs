import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { isFullscreenSlideId } from '../../src/runtime/carousel.mjs';
import { withDeckPage } from './helpers.mjs';

const manifest = JSON.parse(await readFile(new URL('../../deck-manifest.json', import.meta.url), 'utf8'));
const slideIds = manifest.slides.map(slide => slide.id);
const slideCount = slideIds.length;
const indexOfSlide = slideId => slideIds.indexOf(slideId);
const fullscreenSlideIds = slideIds.filter(isFullscreenSlideId);

test('generated deck navigates all stable slides without runtime errors', async () => {
  await withDeckPage(async ({ page, errors }) => {
    assert.equal(await page.locator('[data-slide-id]').count(), slideCount);
    for (let index = 0; index < slideCount; index += 1) {
      await page.evaluate((target) => window.__deckDebug.goTo(target), index);
      await page.waitForFunction((target) => window.__deckDebug.getState().currentSlideIndex === target, index);
      assert.equal(await page.locator('.slide.is-current').getAttribute('data-slide-id'), slideIds[index]);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#overview.active .overview-slide-button').count(), slideCount);
    await page.keyboard.press('Escape');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('overview renders inert slide previews with fixed English and Japanese titles', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.keyboard.press('Escape');
    const overview = page.locator('#overview.active');
    const buttons = overview.locator('.overview-slide-button');
    const previews = overview.locator('.overview-slide-preview');

    assert.equal(await buttons.count(), slideCount);
    assert.equal(await previews.count(), slideCount);
    assert.equal(await previews.locator(':scope > .slide').count(), slideCount);
    assert.equal(await previews.locator('[id]').count(), 0);
    const focusablePreviewControls = await previews.locator('a, button, input, select, textarea, [tabindex]').evaluateAll(
      nodes => nodes.filter(node => node.tabIndex >= 0 && !node.disabled).length
    );
    assert.equal(focusablePreviewControls, 0);

    const first = buttons.first();
    assert.equal(await first.locator('.overview-slide-title-en').textContent(), '01 Research Title');
    assert.equal(await first.locator('.overview-slide-title-ja').textContent(), '研究タイトル');

    const grid = overview.locator('.esc-grid-wrap');
    assert.equal(await grid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 4);
    await page.setViewportSize({ width: 640, height: 900 });
    assert.equal(await grid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 2);

    const targetIndex = Math.min(3, slideCount - 1);
    await buttons.nth(targetIndex).click();
    await page.waitForFunction(index => window.__deckDebug.getState().currentSlideIndex === index, targetIndex);
    assert.equal(await page.locator('#overview').getAttribute('aria-hidden'), 'true');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('language controls update visible content and state', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const title = page.locator('[data-slide-id="s01-cover"] h1');
    assert.equal((await page.evaluate(() => window.__deckDebug.getState())).language, 'en-ja');
    assert.equal(await page.locator('.cover-lang-switch [data-language]').count(), 5);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await title.innerText(), /^A Study on Co-creation Tools/);
    assert.ok(await title.locator('.hybrid-ja-text[lang="ja"]').count());

    for (const language of ['zh', 'en', 'ja', 'es-MX']) {
      await page.locator(`.cover-lang-switch [data-language="${language}"]`).click();
      await page.waitForFunction((expected) => window.__deckDebug.getState().language === expected, language);
      assert.equal(await page.locator('.hybrid-ja-text').count(), 0);
      if (language === 'zh') assert.equal(await page.locator('.chapter-label.is-active').textContent(), '研究背景');
    }

    await page.locator('.cover-lang-switch [data-language="en-ja"]').click();
    await page.waitForFunction(() => window.__deckDebug.getState().language === 'en-ja');
    assert.equal(await page.locator('.cover-lang-switch [data-language="en-ja"]').getAttribute('class'), 'lang-top-btn active');
    assert.equal(await page.locator('.chapter-label.is-active').textContent(), 'Background');
    assert.ok(await title.locator('.hybrid-ja-text[lang="ja"]').count());
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('balanced English Japanese mode annotates every slide', async () => {
  await withDeckPage(async ({ page, errors }) => {
    for (let index = 0; index < slideCount; index += 1) {
      await page.evaluate((target) => window.__deckDebug.goTo(target), index);
      await page.waitForFunction((target) => window.__deckDebug.getState().currentSlideIndex === target, index);
      assert.ok(
        await page.locator('.slide.is-current .hybrid-ja-text[lang="ja"]').count(),
        `slide ${index + 1} has a Japanese emphasis annotation`
      );
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('page meta sits above the slide and chapter progress sits below it', async () => {
  await withDeckPage(async ({ page, errors }) => {
    assert.equal(await page.locator('#presentation-indicator #indicator-title').count(), 1);
    assert.equal(await page.locator('#presentation-indicator #indicator-page').count(), 1);
    assert.equal(await page.locator('#presentation-footer #indicator-timeline-chapters').count(), 1);
    assert.equal(await page.locator('.timeline-chapter-group').count(), 4);
    assert.equal(await page.locator('.chapter-dot').count(), slideCount);

    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForFunction(() => !document.body.classList.contains('cover-stage'));
    await page.waitForTimeout(850);

    const slide = await page.locator('.slide.is-current').boundingBox();
    const meta = await page.locator('#presentation-indicator').boundingBox();
    const progress = await page.locator('#presentation-footer').boundingBox();
    assert.ok(slide && meta && progress);
    assert.ok(meta.y + meta.height < slide.y, 'page meta stays above the slide');
    assert.ok(progress.y > slide.y + slide.height, 'chapter progress stays below the slide');

    const targetIndex = indexOfSlide('s05-evaluation-limit');
    const target = page.locator(`.chapter-dot[data-slide-index="${targetIndex}"]`);
    await target.click();
    await page.waitForFunction((index) => window.__deckDebug.getState().currentSlideIndex === index, targetIndex);
    assert.equal(await target.getAttribute('class'), 'chapter-dot is-active');
    assert.equal(await page.locator('.chapter-label.is-active').textContent(), 'Questions & Objectives');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('cover is fullscreen and slide two restores balanced stage chrome', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.waitForFunction(() => document.body.classList.contains('cover-stage'));
    await page.waitForFunction(() => {
      const top = document.querySelector('#presentation-indicator').getBoundingClientRect();
      const bottom = document.querySelector('#presentation-footer').getBoundingClientRect();
      return top.bottom <= 0 && bottom.top >= innerHeight;
    });
    const viewport = page.viewportSize();
    await page.waitForFunction(({ width, height }) => {
      const rect = document.querySelector('.slide.is-current').getBoundingClientRect();
      return Math.abs(rect.width - width) < 1 || Math.abs(rect.height - height) < 1;
    }, viewport);
    const cover = await page.locator('.slide.is-current').boundingBox();
    assert.ok(viewport && cover);
    assert.ok(
      Math.abs(cover.width - viewport.width) < 1 || Math.abs(cover.height - viewport.height) < 1,
      'cover fills one viewport axis'
    );
    assert.equal(await page.locator('#presentation-indicator').evaluate((node) => getComputedStyle(node).opacity), '1');
    assert.equal(await page.locator('#presentation-footer').evaluate((node) => getComputedStyle(node).opacity), '1');

    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForFunction(() => !document.body.classList.contains('cover-stage'));
    await page.waitForTimeout(850);

    const slide = await page.locator('.slide.is-current').boundingBox();
    const meta = await page.locator('#presentation-indicator').boundingBox();
    const progress = await page.locator('#presentation-footer').boundingBox();
    assert.ok(slide && meta && progress);
    const gaps = [
      meta.y,
      slide.y - (meta.y + meta.height),
      progress.y - (slide.y + slide.height),
      viewport.height - (progress.y + progress.height)
    ];
    assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1.5, `balanced gaps: ${gaps.join(', ')}`);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('cover ASCII background renders and changes frames', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.waitForFunction(() => document.body.classList.contains('cover-stage'));
    const canvas = page.locator('[data-slide-id="s01-cover"] canvas.ascii-bg');
    await page.waitForFunction(() => {
      const target = document.querySelector('[data-slide-id="s01-cover"] canvas.ascii-bg');
      if (!target || target.width <= 300) return false;
      const pixels = target.getContext('2d').getImageData(0, 0, target.width, target.height).data;
      return pixels.some((value, index) => index % 4 === 3 && value > 0);
    }, undefined, { timeout: 2000 });
    const firstFrame = await canvas.evaluate((node) => node.toDataURL());
    await page.waitForTimeout(250);
    const secondFrame = await canvas.evaluate((node) => node.toDataURL());
    assert.notEqual(secondFrame, firstFrame);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('registered fullscreen slides share geometric mode changes', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const viewport = page.viewportSize();
    assert.ok(viewport);
    assert.equal(await page.locator('.slide.is-fullscreen-capable').count(), fullscreenSlideIds.length);
    for (const slideId of fullscreenSlideIds) {
      const index = indexOfSlide(slideId);
      await page.evaluate((target) => window.__deckDebug.goTo(target), index);
      await page.waitForFunction((target) => (
        window.__deckDebug.getState().currentSlideIndex === target
        && document.body.classList.contains('fullscreen-stage')
      ), index);
      await page.waitForFunction(() => {
        const top = document.querySelector('#presentation-indicator').getBoundingClientRect();
        const bottom = document.querySelector('#presentation-footer').getBoundingClientRect();
        return top.bottom <= 0 && bottom.top >= innerHeight;
      });
      await page.waitForTimeout(800);
      const box = await page.locator('.slide.is-current').boundingBox();
      assert.ok(box);
      assert.ok(Math.abs(box.width - viewport.width) < 1 || Math.abs(box.height - viewport.height) < 1);
      assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.001, `slide ${index + 1} is 16:9`);
      const logicalSize = await page.locator('.slide.is-current').evaluate((node) => ({
        width: node.offsetWidth,
        height: node.offsetHeight
      }));
      assert.deepEqual(logicalSize, { width: 1600, height: 900 });
    }

    const lastFullscreenIndex = indexOfSlide(fullscreenSlideIds.at(-1));
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((index) => window.__deckDebug.getState().currentSlideIndex === index, lastFullscreenIndex + 1);
    await page.waitForFunction(() => !document.body.classList.contains('fullscreen-stage'));
    assert.equal(await page.locator('body').evaluate((node) => node.classList.contains('stage-mode-transitioning')), true);
    assert.equal(await page.locator('#deck').evaluate((node) => getComputedStyle(node).animationName), 'none');
    assert.equal(await page.locator('#deck').evaluate((node) => getComputedStyle(node).transitionDuration), '0.8s, 0.8s, 0.22s');
    assert.equal(await page.locator('.slide-shell.is-mode-transition-source').count(), 0);
    assert.equal(await page.locator('.slide-shell.is-mode-transition-target').count(), 0);
    assert.equal(await page.locator('.slide-shell.is-current-shell').count(), 1);
    await page.waitForFunction(() => !document.body.classList.contains('stage-mode-transitioning'));
    const standardBox = await page.locator('.slide.is-current').boundingBox();
    assert.ok(standardBox);
    assert.ok(Math.abs(standardBox.width / standardBox.height - 4 / 3) < 0.001, 'ordinary slide remains 4:3');
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('fullscreen previews retain the stage height of ordinary slides', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const scenarios = fullscreenSlideIds.map((previewId) => {
      const previewIndex = indexOfSlide(previewId);
      return previewIndex === 0
        ? { stageIndex: 1, previewId, side: 'previous' }
        : { stageIndex: previewIndex - 1, previewId, side: 'next' };
    });
    for (const { stageIndex, previewId, side } of scenarios) {
      await page.evaluate((target) => window.__deckDebug.goTo(target), stageIndex);
      await page.waitForFunction((target) => window.__deckDebug.getState().currentSlideIndex === target, stageIndex);
      await page.waitForTimeout(850);

      const boxes = await page.evaluate(({ id, side }) => {
        const current = document.querySelector('.slide.is-current').getBoundingClientRect();
        const fullscreenPreview = document.querySelector(`[data-slide-id="${id}"]`).getBoundingClientRect();
        return {
          current: { width: current.width, height: current.height },
          fullscreenPreview: { width: fullscreenPreview.width, height: fullscreenPreview.height },
          gap: side === 'previous'
            ? current.left - fullscreenPreview.right
            : fullscreenPreview.left - current.right,
          stageGap: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slide-gap'))
        };
      }, { id: previewId, side });

      assert.ok(
        Math.abs(boxes.fullscreenPreview.height - boxes.current.height) < 1,
        `${previewId} preview height matches the stage slide`
      );
      assert.ok(Math.abs(boxes.fullscreenPreview.width / boxes.fullscreenPreview.height - 16 / 9) < 0.001);
      assert.ok(Math.abs(boxes.gap - boxes.stageGap) < 1, `${previewId} retains the stage gap`);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('entering fullscreen moves adjacent stage pages past the expanding canvas', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const scenarios = fullscreenSlideIds.map((targetId) => {
      const targetIndex = indexOfSlide(targetId);
      if (targetIndex === 0) {
        return {
          stageIndex: 1,
          targetIndex,
          key: 'ArrowLeft',
          targetId,
          neighbors: [{ id: slideIds[1], side: 'next' }]
        };
      }
      return {
        stageIndex: targetIndex - 1,
        targetIndex,
        key: 'ArrowRight',
        targetId,
        neighbors: [
          { id: slideIds[targetIndex - 1], side: 'previous' },
          { id: slideIds[targetIndex + 1], side: 'next' }
        ].filter(neighbor => neighbor.id)
      };
    });
    for (const { stageIndex, targetIndex, key, targetId, neighbors } of scenarios) {
      await page.evaluate((target) => window.__deckDebug.goTo(target), stageIndex);
      await page.waitForFunction((target) => window.__deckDebug.getState().currentSlideIndex === target, stageIndex);
      await page.waitForTimeout(850);

      await page.keyboard.press(key);
      await page.waitForFunction((target) => (
        window.__deckDebug.getState().currentSlideIndex === target
        && document.body.classList.contains('fullscreen-stage')
        && document.body.classList.contains('stage-mode-transitioning')
        && document.body.classList.contains('entering-fullscreen-stage')
      ), targetIndex);
      await page.waitForTimeout(350);

      const frame = await page.evaluate(({ targetId, neighbors }) => {
        const current = document.querySelector(`[data-slide-id="${targetId}"]`).getBoundingClientRect();
        return {
          gaps: neighbors.map(({ id, side }) => {
            const neighbor = document.querySelector(`[data-slide-id="${id}"]`).getBoundingClientRect();
            return {
              id,
              value: side === 'previous' ? current.left - neighbor.right : neighbor.left - current.right
            };
          }),
          stageGap: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slide-gap'))
        };
      }, { targetId, neighbors });

      for (const gap of frame.gaps) {
        assert.ok(gap.value >= frame.stageGap - 2, `${targetId}/${gap.id} fullscreen-entry gap: ${gap.value}`);
      }
      await page.waitForFunction(() => !document.body.classList.contains('stage-mode-transitioning'));
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { viewport: { width: 1920, height: 1080 } });
});

test('heatmap fullscreen boundaries do not skip slides under repeated input', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const fullscreenIndex = indexOfSlide('s16-heatmap-overview');
    const previousIndex = fullscreenIndex - 1;
    const nextIndex = fullscreenIndex + 1;
    await page.evaluate((index) => window.__deckDebug.goTo(index), previousIndex);
    await page.waitForFunction((index) => window.__deckDebug.getState().currentSlideIndex === index, previousIndex);
    await page.waitForTimeout(800);

    const entryContinuity = await page.evaluate((ids) => {
      const shells = ids.map((id) => document.querySelector(`[data-slide-id="${id}"]`).parentElement);
      const pick = (node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      };
      const before = shells.map(pick);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const after = shells.map(pick);
      return {
        stateIndex: window.__deckDebug.getState().currentSlideIndex,
        before,
        after,
        fullscreenPreviewWidth: document.querySelector('[data-slide-id="s16-heatmap-overview"]').getBoundingClientRect().width
      };
    }, [slideIds[previousIndex], slideIds[fullscreenIndex], slideIds[nextIndex]]);
    assert.equal(entryContinuity.stateIndex, fullscreenIndex);
    for (const [index, before] of entryContinuity.before.entries()) {
      for (const property of ['x', 'y', 'width', 'height']) {
        assert.ok(
          Math.abs(before[property] - entryContinuity.after[index][property]) < 1,
          `shell ${index} ${property} remains continuous at the first frame`
        );
      }
    }
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    assert.equal((await page.evaluate(() => window.__deckDebug.getState())).currentSlideIndex, fullscreenIndex);
    await page.waitForTimeout(300);
    const midpoint = await page.evaluate(() => {
      const deck = document.querySelector('#deck');
      const current = document.querySelector('[data-slide-id="s16-heatmap-overview"]');
      const outgoing = document.querySelector('[data-slide-id="s15-eye-tracking-system"]');
      const currentRect = current.getBoundingClientRect();
      return {
        deckOpacity: getComputedStyle(deck).opacity,
        deckTransform: getComputedStyle(deck).transform,
        currentOpacity: getComputedStyle(current).opacity,
        currentWidth: currentRect.width,
        outgoingClipPath: getComputedStyle(outgoing).clipPath,
        outgoingRight: outgoing.getBoundingClientRect().right,
        viewportWidth: innerWidth
      };
    });
    assert.equal(midpoint.deckOpacity, '1');
    assert.equal(midpoint.currentOpacity, '1');
    assert.notEqual(midpoint.deckTransform, 'none');
    assert.ok(['none', 'inset(0px)'].includes(midpoint.outgoingClipPath));
    assert.ok(midpoint.outgoingRight > 0);
    assert.ok(midpoint.currentWidth < entryContinuity.fullscreenPreviewWidth - 5);
    assert.ok(midpoint.currentWidth > midpoint.viewportWidth);
    await page.waitForFunction(() => !document.body.classList.contains('stage-mode-transitioning'));
    assert.equal(await page.locator('.slide-shell.is-mode-transition-source').count(), 0);
    assert.equal(await page.locator('.slide-shell.is-mode-transition-target').count(), 0);

    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((index) => window.__deckDebug.getState().currentSlideIndex === index, nextIndex);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    assert.equal((await page.evaluate(() => window.__deckDebug.getState())).currentSlideIndex, nextIndex);
    await page.waitForTimeout(300);
    const returnMidpoint = await page.evaluate((targetId) => {
      const oldFullscreen = document.querySelector('[data-slide-id="s16-heatmap-overview"]');
      const current = document.querySelector(`[data-slide-id="${targetId}"]`);
      return {
        deckOpacity: getComputedStyle(document.querySelector('#deck')).opacity,
        currentOpacity: getComputedStyle(current).opacity,
        oldFullscreenWidth: oldFullscreen.getBoundingClientRect().width,
        stableSlotWidth: current.parentElement.getBoundingClientRect().width
      };
    }, slideIds[nextIndex]);
    assert.equal(returnMidpoint.deckOpacity, '1');
    assert.equal(returnMidpoint.currentOpacity, '1');
    assert.ok(returnMidpoint.oldFullscreenWidth > returnMidpoint.stableSlotWidth + 5);
    await page.waitForFunction(() => !document.body.classList.contains('stage-mode-transitioning'));

    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((index) => window.__deckDebug.getState().currentSlideIndex === index, nextIndex + 1);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
