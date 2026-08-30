export function mountResearchGapToggle({ root = document } = {}) {
  const visuals = [...root.querySelectorAll('.s05-gap-visual')];
  if (!visuals.length) return () => {};

  const setOpen = (target, open) => {
    visuals.forEach((visual) => {
      const active = visual === target && open;
      visual.classList.toggle('is-revealed', active);
      visual.setAttribute('aria-expanded', String(active));
    });
  };

  const disposers = visuals.map((visual) => {
    visual.setAttribute('role', 'button');
    visual.setAttribute('aria-expanded', 'false');

    const toggle = (event) => {
      event.stopPropagation();
      setOpen(visual, !visual.classList.contains('is-revealed'));
    };
    const onKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle(event);
    };
    visual.addEventListener('click', toggle);
    visual.addEventListener('keydown', onKeydown);
    return () => {
      visual.removeEventListener('click', toggle);
      visual.removeEventListener('keydown', onKeydown);
    };
  });

  return () => disposers.forEach((dispose) => dispose());
}
