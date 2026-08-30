import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withDeckPage } from './helpers.mjs';

const scenarios = [
  { name: 'attention forward', sourceIndex: 1, targetIndex: 2, instanceId: 'background-attention' },
  { name: 'attention reverse', sourceIndex: 2, targetIndex: 1, instanceId: 'background-attention' },
  { name: 'workshop forward', sourceIndex: 2, targetIndex: 3, instanceId: 'workshop-research-gap' },
  { name: 'workshop reverse', sourceIndex: 3, targetIndex: 2, instanceId: 'workshop-research-gap' }
];

test('only the current endpoint owns a visible cross-page component while idle', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(100);
    const ownership = await page.evaluate(() => {
      const source = document.querySelector('[data-slide-id="s02-background"] [data-cross-page-instance="background-attention"]');
      const target = document.querySelector('[data-slide-id="s04-knowledge-overload"] [data-cross-page-instance="background-attention"]');
      const targetRect = target.getBoundingClientRect();
      return {
        sourceVisibility: getComputedStyle(source).visibility,
        sourceAriaHidden: source.getAttribute('aria-hidden'),
        targetVisibility: getComputedStyle(target).visibility,
        targetAriaHidden: target.getAttribute('aria-hidden'),
        targetKeepsLayout: targetRect.width > 0 && targetRect.height > 0
      };
    });
    assert.equal(ownership.sourceVisibility, 'visible');
    assert.equal(ownership.sourceAriaHidden, null);
    assert.equal(ownership.targetVisibility, 'hidden');
    assert.equal(ownership.targetAriaHidden, 'true');
    assert.equal(ownership.targetKeepsLayout, true);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('page two expanded attention card keeps content clear of every card edge', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(850);
    const geometry = await page.evaluate(() => {
      const card = document.querySelector('.slide.is-current .attention-path.is-expanded');
      const rows = [...card.querySelectorAll('.attention-path__row')];
      const firstRow = rows[0];
      const lastRow = rows.at(-1);
      const signage = card.querySelector('.attention-path__signage');
      const cardRect = card.getBoundingClientRect();
      const rowRect = firstRow.getBoundingClientRect();
      const lastRowRect = lastRow.getBoundingClientRect();
      const signageRect = signage.getBoundingClientRect();
      return {
        inset: {
          left: rowRect.left - cardRect.left,
          top: rowRect.top - cardRect.top,
          contentBottom: cardRect.bottom - lastRowRect.bottom,
          right: cardRect.right - signageRect.right,
          bottom: cardRect.bottom - signageRect.bottom
        },
        hasRowOverflow: rows.some((row) => row.scrollHeight > row.clientHeight),
        hasVisibleSignageIcon: Boolean(signage.querySelector('.cross-page-icon')?.getClientRects().length)
      };
    });
    for (const [edge, amount] of Object.entries(geometry.inset)) {
      assert.ok(amount >= 10, `${edge} inset is ${amount}px`);
    }
    assert.equal(geometry.hasRowOverflow, false);
    assert.equal(geometry.hasVisibleSignageIcon, true);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('page three barrier attention card keeps its compact content inset', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(2));
    await page.waitForTimeout(850);
    const inset = await page.evaluate(() => {
      const card = document.querySelector('.slide.is-current .attention-path.is-barrier');
      const row = card.querySelector('.attention-path__row.is-attention');
      const signage = card.querySelector('.attention-path__signage');
      const cardRect = card.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const signageRect = signage.getBoundingClientRect();
      return {
        left: rowRect.left - cardRect.left,
        top: Math.min(rowRect.top, signageRect.top) - cardRect.top,
        right: cardRect.right - signageRect.right,
        bottom: cardRect.bottom - Math.max(rowRect.bottom, signageRect.bottom),
        signageOverflow: Math.max(
          signage.scrollWidth - signage.clientWidth,
          signage.scrollHeight - signage.clientHeight
        )
      };
    });
    for (const [edge, amount] of Object.entries(inset).filter(([edge]) => edge !== 'signageOverflow')) {
      assert.ok(amount >= 8, `${edge} inset is ${amount}px`);
    }
    assert.ok(inset.signageOverflow <= 0, `signage overflow is ${inset.signageOverflow}px`);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('attention morph fully collapses secondary rows before the midpoint', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(850);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-cross-page-overlay="background-attention"][data-cross-page-ready="true"]'));
    const clips = await page.evaluate(() => {
      const overlay = document.querySelector('[data-cross-page-overlay="background-attention"]');
      overlay.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause();
        animation.currentTime = 380;
      });
      return ['encoding-row', 'integration-row', 'consolidation-row'].map((part) => (
        getComputedStyle(overlay.querySelector(`[data-morph-part="${part}"]`)).clipPath
      ));
    });
    assert.ok(clips.every((clip) => {
      const amount = Number.parseFloat(clip.match(/inset\(([\d.]+)%/)?.[1] || '0');
      return amount >= 50;
    }), clips.join(', '));
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('the moving entity is one complete opaque source card from its first frame', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(2));
    await page.waitForTimeout(850);
    const sourceRect = await page.locator('.slide.is-current [data-cross-page-component][data-cross-page-instance="workshop-research-gap"]').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-cross-page-overlay][data-cross-page-ready="true"]'));
    const firstFrame = await page.evaluate(() => {
      const overlay = document.querySelector('[data-cross-page-overlay]');
      const card = overlay.querySelector(':scope > .cross-page-component');
      overlay.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      });
      const rect = overlay.getBoundingClientRect();
      return {
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        hasSplitSurface: Boolean(overlay.querySelector('.cross-page-overlay__surface')),
        backgroundColor: getComputedStyle(card).backgroundColor,
        borderStyle: getComputedStyle(card).borderStyle,
        hasOpacityKeyframe: overlay.getAnimations({ subtree: true }).some((animation) => (
          animation.effect.getKeyframes().some((keyframe) => Object.hasOwn(keyframe, 'opacity'))
        ))
      };
    });
    closeRect(firstFrame.rect, sourceRect);
    assert.equal(firstFrame.hasSplitSurface, false);
    assert.notEqual(firstFrame.backgroundColor, 'rgba(0, 0, 0, 0)');
    assert.notEqual(firstFrame.borderStyle, 'none');
    assert.equal(firstFrame.hasOpacityKeyframe, false);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

function closeRect(actual, expected, tolerance = 2) {
  for (const key of ['left', 'top', 'width', 'height']) {
    assert.ok(Math.abs(actual[key] - expected[key]) <= tolerance, `${key}: ${actual[key]} vs ${expected[key]}`);
  }
}

async function runMorph(page, scenario) {
  await page.evaluate((target) => window.__deckDebug.goTo(target), scenario.sourceIndex);
  await page.waitForTimeout(850);
  const sourceRect = await page.locator(
    `.slide.is-current [data-cross-page-component][data-cross-page-instance="${scenario.instanceId}"]`
  ).evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height };
  });
  const idleTarget = await page.evaluate(({ targetIndex, instanceId }) => {
    const node = document.querySelectorAll('.slide')[targetIndex]
      .querySelector(`[data-cross-page-component][data-cross-page-instance="${instanceId}"]`);
    const rect = node.getBoundingClientRect();
    return {
      visibility: getComputedStyle(node).visibility,
      ariaHidden: node.getAttribute('aria-hidden'),
      keepsLayout: rect.width > 0 && rect.height > 0
    };
  }, scenario);
  assert.equal(idleTarget.visibility, 'hidden');
  assert.equal(idleTarget.ariaHidden, 'true');
  assert.equal(idleTarget.keepsLayout, true);

  await page.keyboard.press(scenario.targetIndex > scenario.sourceIndex ? 'ArrowRight' : 'ArrowLeft');
  await page.waitForFunction(() => document.querySelectorAll('[data-cross-page-overlay][data-cross-page-ready="true"]').length === 1);
  const startState = await page.evaluate(() => {
    const overlay = document.querySelector('[data-cross-page-overlay]');
    const animations = overlay.getAnimations({ subtree: true });
    const deckAnimations = document.querySelector('#deck').getAnimations();
    animations.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    deckAnimations.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    const surface = overlay.getBoundingClientRect();
    const style = getComputedStyle(overlay);
    return {
      surface: { left: surface.left, top: surface.top, width: surface.width, height: surface.height },
      target: {
        left: parseFloat(style.left),
        top: parseFloat(style.top),
        width: parseFloat(style.width),
        height: parseFloat(style.height)
      },
      hiddenCount: document.querySelectorAll('[data-cross-page-hidden]').length,
      animationCount: animations.length,
      hasOpacityKeyframe: animations.some((animation) => (
        animation.effect.getKeyframes().some((keyframe) => Object.hasOwn(keyframe, 'opacity'))
      ))
    };
  });
  closeRect(startState.surface, sourceRect);
  assert.equal(startState.hiddenCount, 2);
  assert.ok(startState.animationCount > 1);
  assert.equal(startState.hasOpacityKeyframe, false);

  const midpoint = await page.evaluate(() => {
    const overlay = document.querySelector('[data-cross-page-overlay]');
    overlay.getAnimations({ subtree: true }).forEach((animation) => { animation.currentTime = 380; });
    document.querySelector('#deck').getAnimations().forEach((animation) => { animation.currentTime = 380; });
    const surface = overlay.getBoundingClientRect();
    const hiddenSource = document.querySelector('[data-cross-page-hidden]');
    const source = hiddenSource.getBoundingClientRect();
    return {
      surfaceLeft: surface.left,
      sourceLeft: source.left,
      opacity: getComputedStyle(overlay).opacity,
      currentIndex: window.__deckDebug.getState().currentSlideIndex
    };
  });
  assert.equal(midpoint.opacity, '1');
  assert.equal(midpoint.currentIndex, scenario.targetIndex);
  assert.ok(Math.abs(midpoint.surfaceLeft - midpoint.sourceLeft) > 8, 'overlay detaches from moving source page');

  await page.evaluate(() => {
    const overlay = document.querySelector('[data-cross-page-overlay]');
    document.querySelector('#deck').getAnimations().forEach((animation) => animation.finish());
    overlay.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
  });
  await page.waitForFunction(() => !document.querySelector('[data-cross-page-overlay]'));
  const endState = await page.evaluate(({ instanceId, sourceIndex }) => {
    const mount = document.querySelector(`.slide.is-current [data-cross-page-component][data-cross-page-instance="${instanceId}"]`);
    const source = document.querySelectorAll('.slide')[sourceIndex]
      .querySelector(`[data-cross-page-component][data-cross-page-instance="${instanceId}"]`);
    const box = mount.getBoundingClientRect();
    return {
      target: { left: box.left, top: box.top, width: box.width, height: box.height },
      hiddenCount: document.querySelectorAll('[data-cross-page-hidden]').length,
      visibility: getComputedStyle(mount).visibility,
      sourceVisibility: getComputedStyle(source).visibility
    };
  }, { instanceId: scenario.instanceId, sourceIndex: scenario.sourceIndex });
  closeRect(endState.target, startState.target);
  assert.equal(endState.hiddenCount, 0);
  assert.equal(endState.visibility, 'visible');
  assert.equal(endState.sourceVisibility, 'hidden');
}

for (const scenario of scenarios) {
  test(`${scenario.name} uses one opaque geometric overlay`, async () => {
    await withDeckPage(async ({ page, errors }) => {
      await runMorph(page, scenario);
      assert.equal(errors.length, 0, errors.join('\n'));
    });
  });
}

test('cross-page navigation lock rejects repeated input', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(850);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => window.__deckDebug.getState().currentSlideIndex), 2);
    assert.equal(await page.locator('[data-cross-page-overlay]').count(), 1);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('reduced motion bypasses the cross-page overlay', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(1));
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => window.__deckDebug.getState().currentSlideIndex), 2);
    assert.equal(await page.locator('[data-cross-page-overlay]').count(), 0);
    assert.equal(await page.locator('[data-cross-page-hidden]').count(), 0);
    assert.equal(await page.locator('.slide.is-current [data-cross-page-component][data-cross-page-instance="background-attention"]').evaluate((node) => getComputedStyle(node).visibility), 'visible');
    assert.equal(await page.evaluate(() => {
      const node = document.querySelectorAll('.slide')[1]
        .querySelector('[data-cross-page-component][data-cross-page-instance="background-attention"]');
      return getComputedStyle(node).visibility;
    }), 'hidden');
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { reducedMotion: 'reduce' });
});

test('priority languages keep shared components inside their mounts on narrow screens', async () => {
  await withDeckPage(async ({ page, errors }) => {
    for (const language of ['en-ja', 'zh']) {
      await page.evaluate((target) => document.querySelector(`[data-language="${target}"]`).click(), language);
      for (const slideIndex of [1, 2, 3]) {
        await page.evaluate((target) => window.__deckDebug.goTo(target), slideIndex);
        await page.waitForTimeout(50);
        const overflow = await page.locator('.slide.is-current [data-cross-page-component]').evaluateAll((mounts) => (
          mounts.flatMap((mount) => {
            const boundary = mount.getBoundingClientRect();
            return [...mount.querySelectorAll('[data-morph-part]')]
              .filter((part) => !getComputedStyle(part).clipPath.includes('50%'))
              .map((part) => {
                const box = part.getBoundingClientRect();
                return Math.max(boundary.left - box.left, box.right - boundary.right, 0);
              });
          })
        ));
        assert.ok(overflow.every((amount) => amount <= 1), `${language}/page ${slideIndex + 1} fits`);
      }
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  }, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
});

test('page-local participants stay outside the morph and gap one sits between research and idea', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(2));
    await page.waitForTimeout(850);
    const source = await page.evaluate(() => {
      const context = document.querySelector('.slide.is-current .s04-participant-tag');
      const mount = document.querySelector('.slide.is-current [data-cross-page-instance="workshop-research-gap"]');
      return {
        contextVisible: Boolean(context && context.getBoundingClientRect().height > 0),
        contextInsideMount: Boolean(context && mount?.contains(context)),
        participantInsideMount: Boolean(mount?.querySelector('[data-morph-part="participants"]'))
      };
    });
    assert.equal(source.contextVisible, true);
    assert.equal(source.contextInsideMount, false);
    assert.equal(source.participantInsideMount, false);

    await page.evaluate(() => window.__deckDebug.goTo(3));
    await page.waitForTimeout(850);
    const order = await page.evaluate(() => {
      const current = document.querySelector('.slide.is-current');
      const rect = (part) => current.querySelector(`[data-morph-part="${part}"]`).getBoundingClientRect();
      return {
        field: rect('field-research'),
        gap: rect('gap-1'),
        idea: rect('idea-discussion')
      };
    });
    assert.ok(order.field.right < order.gap.left);
    assert.ok(order.gap.right < order.idea.left);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});

test('page three keeps evidence compact and stacks the co-creation context', async () => {
  await withDeckPage(async ({ page, errors }) => {
    await page.evaluate(() => window.__deckDebug.goTo(2));
    await page.waitForTimeout(850);
    const layout = await page.evaluate(() => {
      const slide = document.querySelector('.slide.is-current');
      const evidence = slide.querySelector('.s04-evidence');
      const figures = [...evidence.querySelectorAll('figure')].map((node) => node.getBoundingClientRect());
      const attention = slide.querySelector('.attention-mount').getBoundingClientRect();
      const head = slide.querySelector('.s04-cocreation-head');
      const headChildren = [...head.children].map((node) => node.getBoundingClientRect());
      const readingCardStyle = getComputedStyle(slide.querySelector('.s04-reading-card'));
      const participantStyle = getComputedStyle(slide.querySelector('.s04-participant-tag'));
      const participant = slide.querySelector('.s04-participant-tag');
      const workshop = slide.querySelector('.workshop-mount');
      const transition = slide.querySelector('.s04-cocreation .s04-transition');
      const coCreation = slide.querySelector('.s04-cocreation');
      const problem = slide.querySelector('.s04-problem');
      const barrierIcon = slide.querySelector('.attention-path.is-barrier .attention-path__signage .cross-page-icon');
      const fontSize = (selector) => parseFloat(getComputedStyle(slide.querySelector(selector)).fontSize);
      return {
        hasCaption: Boolean(evidence.querySelector('.s04-evidence-caption')),
        figuresShareRow: Math.abs(figures[0].top - figures[1].top) <= 1,
        evidenceAlignedToAttention: Math.abs(Math.max(...figures.map((rect) => rect.bottom)) - attention.bottom) <= 2,
        contextUsesRows: headChildren.every((rect, index) => index === 0 || rect.top >= headChildren[index - 1].bottom),
        contextWidth: head.getBoundingClientRect().width,
        middleGap: coCreation.getBoundingClientRect().top - attention.bottom,
        bottomInset: problem.getBoundingClientRect().bottom - coCreation.getBoundingClientRect().bottom,
        readingCardBackground: readingCardStyle.backgroundColor,
        readingCardBorder: readingCardStyle.borderTopWidth,
        participantBackground: participantStyle.backgroundColor,
        participantBorder: participantStyle.borderTopWidth,
        participantHasIcon: Boolean(slide.querySelector('.s04-participant-tag svg')),
        metricSize: fontSize('.s04-reading-metric strong'),
        metaSize: fontSize('.s04-reading-card > .t-meta'),
        metricLabelSize: fontSize('.s04-reading-metric span'),
        readingCopySize: fontSize('.s04-reading-copy'),
        coCreationTitleSize: fontSize('.s04-cocreation-title'),
        transitionSize: fontSize('.s04-cocreation .s04-transition'),
        participantSize: fontSize('.s04-participant-tag'),
        titleSize: fontSize('.s04-cocreation-title'),
        participantBelowWorkshop: participant.getBoundingClientRect().bottom <= workshop.getBoundingClientRect().top,
        transitionEnglish: transition.childNodes[0]?.textContent.trim(),
        barrierHasVisibleIcon: Boolean(barrierIcon?.getClientRects().length)
      };
    });
    assert.equal(layout.hasCaption, false);
    assert.equal(layout.figuresShareRow, true);
    assert.equal(layout.evidenceAlignedToAttention, true);
    assert.equal(layout.contextUsesRows, true);
    assert.ok(layout.contextWidth >= 850, `co-creation width is ${layout.contextWidth}px`);
    assert.ok(layout.middleGap >= 32, `middle gap is ${layout.middleGap}px`);
    assert.ok(Math.abs(layout.bottomInset) <= 2, `bottom inset is ${layout.bottomInset}px`);
    assert.equal(layout.readingCardBackground, 'rgba(0, 0, 0, 0)');
    assert.equal(layout.readingCardBorder, '0px');
    assert.equal(layout.participantBackground, 'rgba(0, 0, 0, 0)');
    assert.equal(layout.participantBorder, '0px');
    assert.equal(layout.participantHasIcon, true);
    assert.equal(layout.metricSize, 150);
    assert.ok(layout.metaSize >= 14);
    assert.ok(layout.metricLabelSize >= 14);
    assert.ok(layout.readingCopySize >= 22);
    assert.ok(layout.coCreationTitleSize >= 18);
    assert.ok(layout.transitionSize >= 18);
    assert.ok(layout.participantSize >= 16);
    assert.equal(layout.titleSize, 36);
    assert.equal(layout.participantBelowWorkshop, true);
    assert.equal(layout.transitionEnglish, 'To address these challenges, co-creation design is often introduced in botanical garden operations.');
    assert.equal(layout.barrierHasVisibleIcon, false);
    assert.equal(errors.length, 0, errors.join('\n'));
  });
});
