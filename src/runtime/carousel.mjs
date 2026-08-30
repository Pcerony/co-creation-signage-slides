const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 900;
const FULLSCREEN_SLIDE_WIDTH = 1600;
const FULLSCREEN_SLIDE_HEIGHT = 900;
const MODE_TRANSITION_DURATION = 800;
const FULLSCREEN_SLIDE_IDS = new Set([
  's01-cover',
  's08-research-process',
  's16-heatmap-overview'
]);

export function isFullscreenSlideId(slideId) {
  return FULLSCREEN_SLIDE_IDS.has(slideId);
}

export function stageGeometry({
  width,
  height,
  currentSlideIndex,
  fullscreen = currentSlideIndex === 0,
  topChromeHeight = 0,
  bottomChromeHeight = 0,
  fullscreenSlideIndexes = []
}) {
  const minimumGap = width <= 900 ? 14 : 18;
  const scale = Math.max(0.1, Math.min(
    1,
    (width * 0.78) / SLIDE_WIDTH,
    (height - topChromeHeight - bottomChromeHeight - minimumGap * 4) / SLIDE_HEIGHT
  ));
  const renderWidth = SLIDE_WIDTH * scale;
  const renderHeight = SLIDE_HEIGHT * scale;
  const slideGap = Math.max(16, 28 * scale);
  const fullscreenPreviewScale = renderHeight / FULLSCREEN_SLIDE_HEIGHT;
  const fullscreenPreviewRenderWidth = FULLSCREEN_SLIDE_WIDTH * fullscreenPreviewScale;
  const fullscreenSlideIndexSet = new Set(fullscreenSlideIndexes);
  // Track slots follow static preview footprints, never the active render mode.
  const slideSlotWidth = (slideIndex) => (
    fullscreenSlideIndexSet.has(slideIndex) ? fullscreenPreviewRenderWidth : renderWidth
  );
  const currentSlotWidth = slideSlotWidth(currentSlideIndex);
  let trackOffset = currentSlotWidth / 2;
  for (let slideIndex = 0; slideIndex < currentSlideIndex; slideIndex += 1) {
    trackOffset += slideSlotWidth(slideIndex) + slideGap;
  }
  const fullscreenScale = Math.min(
    width / FULLSCREEN_SLIDE_WIDTH,
    height / FULLSCREEN_SLIDE_HEIGHT
  );
  const currentScale = fullscreen ? fullscreenScale : scale;
  const currentRenderWidth = fullscreen
    ? FULLSCREEN_SLIDE_WIDTH * currentScale
    : SLIDE_WIDTH * currentScale;
  const currentRenderHeight = fullscreen
    ? FULLSCREEN_SLIDE_HEIGHT * currentScale
    : SLIDE_HEIGHT * currentScale;
  const fullscreenCurrentOverhang = fullscreen
    ? (currentRenderWidth - currentSlotWidth) / 2
    : 0;
  const slotPitch = renderWidth + slideGap;
  const balancedGap = (height - topChromeHeight - bottomChromeHeight - renderHeight) / 4;
  const deckTop = fullscreen
    ? (height - renderHeight) / 2
    : balancedGap * 2 + topChromeHeight;
  const deckX = width / 2 - trackOffset;
  return {
    cover: fullscreen,
    fullscreen,
    scale,
    fullscreenPreviewScale,
    fullscreenPreviewRenderWidth,
    fullscreenScale,
    currentScale,
    renderWidth,
    renderHeight,
    currentSlotWidth,
    currentRenderWidth,
    currentRenderHeight,
    fullscreenCurrentOverhang,
    slideGap,
    slotPitch,
    balancedGap,
    deckTop,
    deckX
  };
}

export function mountCarousel({ deck, slides, controller }) {
  const fullscreenSlideIndexes = [];
  for (const [index, slide] of slides.entries()) {
    const fullscreenCapable = isFullscreenSlideId(slide.dataset.slideId);
    if (fullscreenCapable) fullscreenSlideIndexes.push(index);
    slide.classList.toggle('is-fullscreen-capable', fullscreenCapable);

    let shell = slide.parentElement;
    if (!shell?.classList.contains('slide-shell')) {
      shell = document.createElement('div');
      shell.className = 'slide-shell';
      slide.before(shell);
      shell.append(slide);
    }
    shell.classList.toggle('is-fullscreen-shell', fullscreenCapable);
  }

  let renderedState = controller.getState();
  let previousFullscreen = isFullscreenSlideId(slides[renderedState.currentSlideIndex]?.dataset.slideId);
  let transitionTimer = 0;
  const render = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const geometry = stageGeometry({
      width,
      height,
      currentSlideIndex: renderedState.currentSlideIndex,
      fullscreen: isFullscreenSlideId(slides[renderedState.currentSlideIndex]?.dataset.slideId),
      topChromeHeight: document.querySelector('#presentation-indicator')?.getBoundingClientRect().height || 0,
      bottomChromeHeight: document.querySelector('#presentation-footer')?.getBoundingClientRect().height || 0,
      fullscreenSlideIndexes
    });
    document.documentElement.style.setProperty('--slide-scale', geometry.scale);
    document.documentElement.style.setProperty('--fullscreen-preview-scale', geometry.fullscreenPreviewScale);
    document.documentElement.style.setProperty('--fullscreen-preview-render-width', `${geometry.fullscreenPreviewRenderWidth}px`);
    document.documentElement.style.setProperty('--fullscreen-current-overhang', `${geometry.fullscreenCurrentOverhang}px`);
    document.documentElement.style.setProperty('--fullscreen-slide-scale', geometry.fullscreenScale);
    document.documentElement.style.setProperty('--slide-render-width', `${geometry.renderWidth}px`);
    document.documentElement.style.setProperty('--slide-render-height', `${geometry.renderHeight}px`);
    document.documentElement.style.setProperty('--slide-gap', `${geometry.slideGap}px`);
    document.documentElement.style.setProperty('--stage-balanced-gap', `${geometry.balancedGap}px`);
    const background = getComputedStyle(
      slides[renderedState.currentSlideIndex]?.querySelector('.canvas-card') || slides[renderedState.currentSlideIndex]
    ).backgroundColor;
    document.documentElement.style.setProperty('--fullscreen-stage-background', background);
    deck.style.top = `${geometry.deckTop}px`;
    deck.style.transform = `translate3d(${geometry.deckX}px,0,0)`;
  };
  const applyState = (next, fullscreen) => {
    renderedState = next;
    previousFullscreen = fullscreen;
    document.body.classList.toggle('fullscreen-stage', fullscreen);
    document.body.classList.toggle('cover-stage', slides[next.currentSlideIndex]?.dataset.slideId === 's01-cover');
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-current', index === next.currentSlideIndex);
      slide.classList.toggle('is-prev', index === next.currentSlideIndex - 1);
      slide.classList.toggle('is-next', index === next.currentSlideIndex + 1);
      slide.parentElement?.classList.toggle('is-current-shell', index === next.currentSlideIndex);
      slide.setAttribute('aria-hidden', index === next.currentSlideIndex ? 'false' : 'true');
    });
    render();
  };
  const cancelModeTransition = () => {
    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = 0;
    document.body.classList.remove('stage-mode-transitioning', 'entering-fullscreen-stage');
    controller.setNavigationLocked(false);
  };
  const beginModeTransition = (next, fullscreen) => {
    cancelModeTransition();
    if (next.lowPowerMode) {
      applyState(next, fullscreen);
      return;
    }
    controller.setNavigationLocked(true);
    document.body.classList.add('stage-mode-transitioning');
    document.body.classList.toggle('entering-fullscreen-stage', fullscreen && !previousFullscreen);
    applyState(next, fullscreen);
    transitionTimer = setTimeout(cancelModeTransition, MODE_TRANSITION_DURATION);
  };
  const onResize = () => requestAnimationFrame(() => {
    if (transitionTimer) cancelModeTransition();
    render();
  });
  window.addEventListener('resize', onResize, { passive: true });
  const unsubscribe = controller.subscribe((next, action) => {
    const fullscreen = isFullscreenSlideId(slides[next.currentSlideIndex]?.dataset.slideId);
    if (action.force) {
      cancelModeTransition();
      applyState(next, fullscreen);
      return;
    }
    if (fullscreen !== previousFullscreen) beginModeTransition(next, fullscreen);
    else applyState(next, fullscreen);
  });
  slides.forEach((slide, index) => slide.addEventListener('click', () => {
    if (Math.abs(index - controller.getState().currentSlideIndex) === 1) controller.dispatch({ type: 'GO_TO', index });
  }));
  return () => {
    unsubscribe();
    cancelModeTransition();
    document.body.classList.remove('fullscreen-stage', 'cover-stage', 'stage-mode-transitioning', 'entering-fullscreen-stage');
    window.removeEventListener('resize', onResize);
  };
}
