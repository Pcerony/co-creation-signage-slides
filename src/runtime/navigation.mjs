export function resolveInitialSlide(search, slideCount) {
  const requested = Number(new URLSearchParams(search).get('slide'));
  return Number.isInteger(requested) && requested >= 1 && requested <= slideCount ? requested - 1 : 0;
}

export function bindNavigation({ controller, target = document }) {
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') controller.dispatch({ type: 'NEXT' });
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') controller.dispatch({ type: 'PREVIOUS' });
    if (event.key === 'Escape') controller.dispatch({ type: 'TOGGLE_OVERVIEW' });
    if (event.key === 'Home') controller.dispatch({ type: 'GO_TO', index: 0 });
    if (event.key === 'End') controller.dispatch({ type: 'GO_TO', index: Number.MAX_SAFE_INTEGER });
  };

  let lastWheelTime = 0;
  const onWheel = (event) => {
    if (controller.getState().overviewOpen) return;
    if (Math.abs(event.deltaY) < 5) return;

    const now = Date.now();
    if (now - lastWheelTime < 350) return;
    lastWheelTime = now;

    if (event.deltaY > 0) {
      controller.dispatch({ type: 'NEXT' });
    } else if (event.deltaY < 0) {
      controller.dispatch({ type: 'PREVIOUS' });
    }
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('wheel', onWheel, { passive: true });

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('wheel', onWheel);
  };
}
