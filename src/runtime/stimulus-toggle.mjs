export function mountStimulusToggle({ root = document } = {}) {
  const wrappers = [...root.querySelectorAll('.stimulus-image-wrapper')];
  if (!wrappers.length) return () => {};

  const disposers = wrappers.map((wrapper) => {
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');

    const toggle = (event) => {
      event.stopPropagation();
      wrapper.classList.toggle('show-heatmap');
    };

    const onKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle(event);
    };

    wrapper.addEventListener('click', toggle);
    wrapper.addEventListener('keydown', onKeydown);

    return () => {
      wrapper.removeEventListener('click', toggle);
      wrapper.removeEventListener('keydown', onKeydown);
    };
  });

  return () => disposers.forEach((dispose) => dispose());
}
