export function mountExperimentFlow({ root = document } = {}) {
  const cleanups = [];

  root.querySelectorAll('[data-flow-group]').forEach((group) => {
    const steps = [...group.querySelectorAll('[data-flow-step]')];
    const panels = [...group.querySelectorAll('[data-flow-panel]')];

    const selectStep = (key) => {
      steps.forEach((step) => {
        const active = step.dataset.flowStep === key;
        step.classList.toggle('is-active', active);
        step.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) => {
        const active = panel.dataset.flowPanel === key;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    };

    steps.forEach((step) => {
      const onClick = () => selectStep(step.dataset.flowStep);
      step.addEventListener('click', onClick);
      cleanups.push(() => step.removeEventListener('click', onClick));
    });

    panels.forEach((panel) => {
      const items = [...panel.querySelectorAll('[data-flow-gallery-item]')];
      const dots = [...panel.querySelectorAll('[data-flow-dot]')];
      let current = 0;
      const show = (index) => {
        current = (index + items.length) % items.length;
        items.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === current));
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
      };
      const previous = panel.querySelector('[data-flow-prev]');
      const next = panel.querySelector('[data-flow-next]');
      const onPrevious = () => show(current - 1);
      const onNext = () => show(current + 1);
      previous?.addEventListener('click', onPrevious);
      next?.addEventListener('click', onNext);
      cleanups.push(() => previous?.removeEventListener('click', onPrevious));
      cleanups.push(() => next?.removeEventListener('click', onNext));
      dots.forEach((dot, index) => {
        const onClick = () => show(index);
        dot.addEventListener('click', onClick);
        cleanups.push(() => dot.removeEventListener('click', onClick));
      });
      show(0);
    });

    selectStep(steps.find(step => step.classList.contains('is-active'))?.dataset.flowStep || '0');
  });

  return () => cleanups.forEach(cleanup => cleanup());
}
