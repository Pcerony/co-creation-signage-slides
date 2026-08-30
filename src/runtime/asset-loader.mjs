export function adjacentSlideIndexes(current, slideCount) {
  return [...new Set([current - 1, current, current + 1].filter((index) => index >= 0 && index < slideCount))];
}

export function updateLazyAssets(slides, current) {
  const active = new Set(adjacentSlideIndexes(current, slides.length));
  slides.forEach((slide, index) => {
    for (const image of slide.querySelectorAll('img')) {
      image.loading = active.has(index) ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (active.has(index) && image.dataset.src && !image.hasAttribute('src')) image.src = image.dataset.src;
    }
  });
}
