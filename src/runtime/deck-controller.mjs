function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createDeckController({
  slideCount,
  languages,
  initialSlideIndex = 0,
  initialLanguage = languages[0],
  initialLowPowerMode = false
}) {
  if (!Number.isInteger(slideCount) || slideCount < 1) throw new Error('slideCount must be positive');
  const allowedLanguages = new Set(languages);
  let destroyed = false;
  let navigationLocked = false;
  let state = Object.freeze({
    currentSlideIndex: clamp(initialSlideIndex, 0, slideCount - 1),
    language: initialLanguage,
    overviewOpen: false,
    lowPowerMode: Boolean(initialLowPowerMode)
  });
  const subscribers = new Set();

  function dispatch(action) {
    if (destroyed) throw new Error('deck controller is destroyed');
    if (
      navigationLocked
      && !action.force
      && ['NEXT', 'PREVIOUS', 'GO_TO'].includes(action.type)
    ) return;
    let next = state;
    switch (action.type) {
      case 'NEXT':
        next = { ...state, currentSlideIndex: clamp(state.currentSlideIndex + 1, 0, slideCount - 1) };
        break;
      case 'PREVIOUS':
        next = { ...state, currentSlideIndex: clamp(state.currentSlideIndex - 1, 0, slideCount - 1) };
        break;
      case 'GO_TO':
        next = { ...state, currentSlideIndex: clamp(Number(action.index) || 0, 0, slideCount - 1), overviewOpen: false };
        break;
      case 'SET_LANGUAGE':
        if (!allowedLanguages.has(action.language)) throw new Error(`unsupported language ${action.language}`);
        next = { ...state, language: action.language };
        break;
      case 'TOGGLE_OVERVIEW':
        next = { ...state, overviewOpen: !state.overviewOpen };
        break;
      case 'CLOSE_OVERVIEW':
        next = { ...state, overviewOpen: false };
        break;
      case 'SET_LOW_POWER':
        next = { ...state, lowPowerMode: Boolean(action.enabled) };
        break;
      default:
        throw new Error(`unknown action ${action.type}`);
    }
    state = Object.freeze(next);
    subscribers.forEach((subscriber) => subscriber(state, action));
  }

  return {
    dispatch,
    getState: () => state,
    setNavigationLocked(locked) {
      if (destroyed) throw new Error('deck controller is destroyed');
      navigationLocked = Boolean(locked);
    },
    subscribe(subscriber) {
      if (destroyed) throw new Error('deck controller is destroyed');
      subscribers.add(subscriber);
      subscriber(state, { type: 'INIT' });
      return () => subscribers.delete(subscriber);
    },
    destroy() {
      subscribers.clear();
      destroyed = true;
    }
  };
}
