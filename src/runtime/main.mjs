import { updateLazyAssets } from './asset-loader.mjs';
import { mountAsciiBackground } from './ascii-background.mjs';
import { mountCarousel } from './carousel.mjs';
import { mountChapterProgress } from './chapter-progress.mjs';
import { mountCrossPageComponents } from './cross-page-components.mjs';
import { createDeckController } from './deck-controller.mjs';
import { mountExperimentFlow } from './experiment-flow.mjs';
import { mountHeatmapOverview } from './heatmap-overview.mjs';
import { mountImageCycles } from './image-cycle.mjs';
import { mountI18n } from './i18n.mjs';
import { mountMotion } from './motion.mjs';
import { bindNavigation, resolveInitialSlide } from './navigation.mjs';
import { mountOverview } from './overview.mjs';
import { mountResearchGapToggle } from './research-gap-toggle.mjs';
import { mountStimulusToggle } from './stimulus-toggle.mjs';
import { hydrateCrossPageComponents } from '../components/cross-page/registry.mjs';

const data = window.__deckData;
const deck = document.querySelector('#deck');
const slides = [...deck.querySelectorAll(':scope > .slide')];
const crossPageLayer = document.querySelector('#cross-page-layer');
hydrateCrossPageComponents({ root: deck });

let storedLanguage = null;
try {
  storedLanguage = localStorage.getItem('deck-language');
} catch (e) {
  // ignore
}

const controller = createDeckController({
  slideCount: slides.length,
  languages: data.manifest.languages,
  initialSlideIndex: resolveInitialSlide(location.search, slides.length),
  initialLanguage: (storedLanguage && data.manifest.languages.includes(storedLanguage))
    ? storedLanguage
    : data.manifest.defaultLanguage
});

const cleanup = [
  bindNavigation({ controller }),
  mountCrossPageComponents({
    controller,
    deck,
    slides,
    connections: data.manifest.crossPageComponents,
    layer: crossPageLayer
  }),
  mountCarousel({ deck, slides, controller }),
  mountHeatmapOverview({ root: deck }),
  mountImageCycles({ root: deck }),
  mountExperimentFlow({ root: deck }),
  mountAsciiBackground({ controller, slides }),
  mountOverview({
    slides,
    controller,
    languages: data.manifest.languages,
    dictionaries: data.dictionaries
  }),
  mountResearchGapToggle({ root: deck }),
  mountStimulusToggle({ root: deck }),
  mountI18n({
    controller,
    dictionaries: data.dictionaries,
    compositeLanguages: data.manifest.compositeLanguages
  }),
  mountChapterProgress({
    controller,
    chapters: data.manifest.chapters,
    slides: data.manifest.slides,
    dictionaries: data.dictionaries,
    compositeLanguages: data.manifest.compositeLanguages
  }),
  mountMotion({ controller }),
  controller.subscribe((state, action) => {
    updateLazyAssets(slides, state.currentSlideIndex);
    const slide = slides[state.currentSlideIndex];
    
    const indicatorTitle = document.querySelector('#indicator-title');
    if (indicatorTitle) {
      const slideKey = slide.dataset.slideId.split('-')[0];
      const key = `slides.${slideKey}.shortTitle`;
      const composites = data.manifest.compositeLanguages;
      const composite = composites && composites[state.language] ? composites[state.language] : null;
      const primaryLanguage = composite?.primary || state.language;
      const primaryText = data.dictionaries[primaryLanguage]?.[key] || slide.dataset.shortTitle || '';
      
      let text = primaryText;
      if (composite) {
        const secondaryText = data.dictionaries[composite.secondary]?.[key];
        if (secondaryText && secondaryText !== primaryText) {
          text = `${primaryText} / ${secondaryText}`;
        }
      }
      indicatorTitle.textContent = text;
    }
    
    document.querySelector('#indicator-page').textContent = `${state.currentSlideIndex + 1} / ${slides.length}`;
    history.replaceState(null, '', `?slide=${state.currentSlideIndex + 1}`);
    if (action && action.type === 'SET_LANGUAGE') {
      try {
        localStorage.setItem('deck-language', state.language);
      } catch (e) {
        // ignore
      }
    }
  })
];

window.__deckDebug = Object.freeze({
  getState: controller.getState,
  goTo: (index) => controller.dispatch({ type: 'GO_TO', index, force: true })
});
window.addEventListener('pagehide', () => {
  cleanup.forEach((dispose) => dispose());
  controller.destroy();
}, { once: true });
