import { resolveCompositeLanguage } from './hybrid-language.mjs';

export function chapterProgressModel(chapters, slides) {
  return chapters
    .map((chapter) => ({
      ...chapter,
      slideIndexes: slides.flatMap((slide, index) => slide.chapterId === chapter.id ? [index] : [])
    }))
    .filter((chapter) => chapter.slideIndexes.length > 0);
}

export function mountChapterProgress({
  controller,
  chapters,
  slides,
  dictionaries,
  compositeLanguages = {},
  root = document
}) {
  const container = root.querySelector('#indicator-timeline-chapters');
  if (!container) return () => {};

  const groups = chapterProgressModel(chapters, slides).map((chapter) => {
    const group = document.createElement('div');
    group.className = 'timeline-chapter-group';
    group.dataset.chapterId = chapter.id;

    const dots = document.createElement('div');
    dots.className = 'chapter-dots';
    for (const slideIndex of chapter.slideIndexes) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'chapter-dot';
      dot.dataset.slideIndex = String(slideIndex);
      dots.append(dot);
    }

    const label = document.createElement('span');
    label.className = 'chapter-label';
    group.append(dots, label);
    container.append(group);
    return { ...chapter, group, label, dots: [...dots.children] };
  });

  const onClick = (event) => {
    const dot = event.target.closest('.chapter-dot[data-slide-index]');
    if (dot) controller.dispatch({ type: 'GO_TO', index: Number(dot.dataset.slideIndex) });
  };
  container.addEventListener('click', onClick);

  const unsubscribe = controller.subscribe((state) => {
    const composite = resolveCompositeLanguage(state.language, compositeLanguages);
    const language = composite?.primary || state.language;
    for (const chapter of groups) {
      const activeChapter = chapter.slideIndexes.includes(state.currentSlideIndex);
      chapter.group.classList.toggle('is-active', activeChapter);
      chapter.label.classList.toggle('is-active', activeChapter);
      chapter.label.textContent = dictionaries[language]?.[chapter.titleKey] || chapter.id;
      chapter.dots.forEach((dot) => {
        const active = Number(dot.dataset.slideIndex) === state.currentSlideIndex;
        dot.classList.toggle('is-active', active);
        dot.toggleAttribute('aria-current', active);
        dot.setAttribute('aria-label', `${chapter.label.textContent} ${Number(dot.dataset.slideIndex) + 1}`);
      });
    }
  });

  return () => {
    unsubscribe();
    container.removeEventListener('click', onClick);
    container.replaceChildren();
  };
}
