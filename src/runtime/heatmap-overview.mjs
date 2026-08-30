const HOVER_DELAY_MS = 120;

export function mountHeatmapOverview({ root = document } = {}) {
  const disposers = [...root.querySelectorAll('[data-heatmap-overview]')].map((view) => {
    const pickers = [...view.querySelectorAll('[data-heatmap-pick]')];
    const cards = [...view.querySelectorAll('[data-heatmap-card]')];
    const current = view.querySelector('[data-heatmap-current]');
    let hoverTimer = 0;

    const selectHeatmap = (activeIndex) => {
      if (current) current.textContent = `P${String(activeIndex + 1).padStart(2, '0')}`;
      pickers.forEach((picker) => {
        picker.classList.toggle('active', Number(picker.dataset.heatmapPick) === activeIndex);
      });
      cards.forEach((card) => {
        const offset = Number(card.dataset.heatmapIndex) - activeIndex;
        const distance = Math.abs(offset);
        const visible = distance <= 4;
        card.classList.toggle('active', offset === 0);
        card.style.setProperty('--heat-y', `${offset * 26}px`);
        card.style.setProperty('--heat-rx', `${offset * -2.2}deg`);
        card.style.setProperty('--heat-scale', String(Math.max(0.72, 1 - distance * 0.055)));
        card.style.setProperty(
          '--heat-opacity',
          visible ? String(offset === 0 ? 1 : Math.max(0.12, 0.5 - distance * 0.075)) : '0'
        );
        card.style.zIndex = String(100 - distance);
      });
    };

    const bindings = pickers.map((picker) => {
      const onEnter = (event) => {
        event.stopPropagation();
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => selectHeatmap(Number(picker.dataset.heatmapPick)), HOVER_DELAY_MS);
      };
      const onLeave = () => {
        clearTimeout(hoverTimer);
        hoverTimer = 0;
      };
      picker.addEventListener('mouseenter', onEnter);
      picker.addEventListener('mouseleave', onLeave);
      return { picker, onEnter, onLeave };
    });

    selectHeatmap(0);
    return () => {
      clearTimeout(hoverTimer);
      bindings.forEach(({ picker, onEnter, onLeave }) => {
        picker.removeEventListener('mouseenter', onEnter);
        picker.removeEventListener('mouseleave', onLeave);
      });
    };
  });

  return () => disposers.forEach(dispose => dispose());
}
