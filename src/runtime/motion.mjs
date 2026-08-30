export function mountMotion({ controller }) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  controller.dispatch({ type: 'SET_LOW_POWER', enabled: media.matches });
  const unsubscribe = controller.subscribe((state) => document.body.classList.toggle('low-power', state.lowPowerMode));
  return unsubscribe;
}
