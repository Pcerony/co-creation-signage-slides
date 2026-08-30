import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const targetSlideIds = [
  's02-background',
  's04-knowledge-overload'
];

test('slides with stage titles reserve a title region and move previous titles right', async () => {
  await withDeckPage(async ({ page, errors }) => {
    const titleMotion = await page.locator('[data-slide-id="s02-background"] h2').evaluate(
      (title) => getComputedStyle(title).transitionDuration
    );
    assert.match(titleMotion, /0\.76s/, 'title alignment uses the shared geometric transition');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (let index = 1; index <= targetSlideIds.length; index += 1) {
      await page.evaluate((target) => window.__deckDebug.goTo(target), index);
      await page.waitForFunction((target) => window.__deckDebug.getState().currentSlideIndex === target, index);
      await page.waitForTimeout(50);

      const currentId = targetSlideIds[index - 1];
      const currentTitle = page.locator(`[data-slide-id="${currentId}"] h2`).first();
      const currentRegion = currentTitle.locator('..');
      const currentGeometry = await currentRegion.evaluate((region) => {
        const title = region.querySelector(':scope > h2');
        const regionBox = region.getBoundingClientRect();
        const titleBox = title.getBoundingClientRect();
        return {
          childCount: region.childElementCount,
          regionHeight: region.offsetHeight,
          leftGap: titleBox.left - regionBox.left
        };
      });
      assert.equal(currentGeometry.childCount, 1, `${currentId} title region contains only its title`);
      assert.equal(currentGeometry.regionHeight, 168, `${currentId} reserves the shared title region`);
      assert.ok(Math.abs(currentGeometry.leftGap) < 1, `${currentId} current title stays left aligned`);

      if (index < targetSlideIds.length) {
        const nextId = targetSlideIds[index];
        const nextAlignment = await page.locator(`[data-slide-id="${nextId}"] h2`).first().evaluate((title) => {
          const regionBox = title.parentElement.getBoundingClientRect();
          const titleBox = title.getBoundingClientRect();
          return titleBox.left - regionBox.left;
        });
        assert.ok(Math.abs(nextAlignment) < 1, `${nextId} next title stays left aligned`);
      }

      if (index > 1) {
        const previousId = targetSlideIds[index - 2];
        const previousAlignment = await page.locator(`[data-slide-id="${previousId}"] h2`).first().evaluate((title) => {
          const regionBox = title.parentElement.getBoundingClientRect();
          const titleBox = title.getBoundingClientRect();
          return regionBox.right - titleBox.right;
        });
        assert.ok(Math.abs(previousAlignment) < 1, `${previousId} previous title moves to the right edge`);
      }
    }

    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('stage titles stay inside the reserved region at narrow viewports', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (let index = 1; index <= targetSlideIds.length; index += 1) {
      const slideId = targetSlideIds[index - 1];
      await page.evaluate((target) => window.__deckDebug.goTo(target), index);
      await page.waitForTimeout(50);
      const overflow = await page.locator(`[data-slide-id="${slideId}"] h2`).first().evaluate((title) => {
        const titleBox = title.getBoundingClientRect();
        const regionBox = title.parentElement.getBoundingClientRect();
        return titleBox.bottom - regionBox.bottom;
      });
      assert.ok(overflow <= 1, `${slideId} title does not enter the body region`);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { viewport: { width: 390, height: 844 } });
});

test('page three content clears the workshop band in both priority languages', async () => {
  await withDeckPage(async ({ page, errors }) => {
    for (const language of ['en-ja', 'zh']) {
      await page.evaluate((target) => document.querySelector(`[data-language="${target}"]`).click(), language);
      await page.waitForFunction((target) => window.__deckDebug.getState().language === target, language);
      await page.evaluate(() => window.__deckDebug.goTo(2));
      await page.waitForTimeout(850);
      const geometry = await page.locator('.slide.is-current').evaluate((slide) => {
        const workshop = slide.querySelector(
          '[data-cross-page-component="workshop-flow"][data-cross-page-instance="workshop-research-gap"]'
        ).getBoundingClientRect();
        const columns = [...slide.querySelectorAll('.s04-problem-grid > *')]
          .map(node => node.getBoundingClientRect().bottom);
        return { workshopTop: workshop.top, contentBottom: Math.max(...columns) };
      });
      assert.ok(
        geometry.contentBottom <= geometry.workshopTop - 6,
        `${language} content clears the workshop band`
      );
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { viewport: { width: 1440, height: 1000 } });
});

test('page four pairs readable gap overlays with two local illustrations', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(3));
    await page.waitForTimeout(850);
    const layout = await page.locator('.slide.is-current').evaluate((slide) => {
      const cards = [...slide.querySelectorAll('.s05-gap-card')];
      const figures = [...slide.querySelectorAll('.s05-gap-visual')];
      return {
        cardCount: cards.length,
        figureCount: figures.length,
        imagesLoaded: figures.every((figure) => {
          const image = figure.querySelector('img');
          return image?.complete && image.naturalWidth > 0;
        }),
        bodySizes: cards.map((card) => parseFloat(getComputedStyle(card.querySelector('p')).fontSize)),
        headingSizes: cards.map((card) => parseFloat(getComputedStyle(card.querySelector('h3')).fontSize)),
        unboxed: cards.every((card) => {
          const style = getComputedStyle(card);
          return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderTopWidth === '0px';
        })
      };
    });
    assert.equal(layout.cardCount, 2);
    assert.equal(layout.figureCount, 2);
    assert.equal(layout.imagesLoaded, true);
    assert.ok(layout.bodySizes.every((size) => size >= 22));
    assert.ok(layout.headingSizes.every((size) => size >= 28));
    assert.equal(layout.unboxed, true);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
