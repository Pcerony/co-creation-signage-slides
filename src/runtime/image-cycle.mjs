export function mountImageCycles({ root = document } = {}) {
  const cleanups = [];

  root.querySelectorAll('[data-image-cycle]').forEach((cycle) => {
    const items = [...cycle.querySelectorAll('[data-image-cycle-item]')];
    const counter = cycle.querySelector('[data-image-cycle-counter]');
    if (items.length === 0) return;

    let current = Math.max(0, items.findIndex(item => item.classList.contains('is-active')));
    const show = (index) => {
      current = (index + items.length) % items.length;
      items.forEach((item, itemIndex) => {
        const active = itemIndex === current;
        item.classList.toggle('is-active', active);
        item.hidden = !active;
        item.setAttribute('aria-hidden', String(!active));
      });
      if (counter) counter.textContent = `${current + 1} / ${items.length}`;
    };
    const onClick = () => show(current + 1);

    cycle.addEventListener('click', onClick);
    cleanups.push(() => cycle.removeEventListener('click', onClick));
    show(current);
  });

  return () => cleanups.forEach(cleanup => cleanup());
}
