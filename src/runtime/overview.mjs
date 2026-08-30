const languageLabels = {
  'en-ja': 'EN+JA',
  'zh': 'ZH',
  'en': 'EN',
  'ja': 'JA',
  'es-MX': 'ES'
};

function createPreview(slide) {
  const preview = document.createElement('div');
  preview.className = 'overview-slide-preview';
  preview.setAttribute('aria-hidden', 'true');

  const clone = slide.cloneNode(true);
  clone.removeAttribute('data-slide-id');
  clone.classList.remove('is-current', 'is-before', 'is-after', 'is-hidden', 'is-fullscreen', 'is-fullscreen-capable');
  clone.removeAttribute('aria-current');
  clone.setAttribute('inert', '');
  clone.style.visibility = 'visible';
  clone.style.opacity = '1';
  clone.style.display = 'block';
  clone.querySelectorAll('[data-slide-id]').forEach(node => node.removeAttribute('data-slide-id'));
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  clone.querySelectorAll('canvas').forEach(canvas => canvas.remove());
  clone.querySelectorAll('.cover-lang-switch').forEach(el => el.remove());
  clone.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach((node) => {
    node.setAttribute('tabindex', '-1');
    if ('disabled' in node) node.disabled = true;
  });
  clone.querySelectorAll('[data-anim], [data-motion-item]').forEach((node) => {
    node.style.opacity = '1';
    node.style.transform = 'none';
    node.style.visibility = 'visible';
  });
  // 确保所有延迟加载图片在预览缩略图中均能正常显示
  clone.querySelectorAll('img[data-src]').forEach((img) => {
    if (!img.getAttribute('src') && img.dataset.src) {
      img.src = img.dataset.src;
    }
    img.loading = 'eager';
    img.decoding = 'sync';
  });
  preview.append(clone);
  return preview;
}

function shortTitleKey(slide) {
  return `slides.${slide.dataset.slideId.split('-')[0]}.shortTitle`;
}

export function mountOverview({ slides, controller, languages = [], dictionaries = {} }) {
  const overview = document.createElement('div');
  overview.id = 'overview';
  overview.setAttribute('role', 'dialog');
  overview.setAttribute('aria-label', 'Slide overview');

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'overview-scroll-container';

  const grid = document.createElement('div');
  grid.className = 'esc-grid-wrap';
  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'overview-slide-button';
    const number = String(index + 1).padStart(2, '0');
    const key = shortTitleKey(slide);
    const english = dictionaries.en?.[key] || slide.dataset.shortTitle || slide.dataset.slideId;
    const japanese = dictionaries.ja?.[key] || slide.dataset.shortTitle || slide.dataset.slideId;
    const preview = createPreview(slide);
    const caption = document.createElement('span');
    caption.className = 'overview-slide-caption';
    const englishTitle = document.createElement('span');
    englishTitle.className = 'overview-slide-title-en';
    englishTitle.textContent = `${number} ${english}`;
    const japaneseTitle = document.createElement('span');
    japaneseTitle.className = 'overview-slide-title-ja';
    japaneseTitle.lang = 'ja';
    japaneseTitle.textContent = japanese;
    caption.append(englishTitle, japaneseTitle);
    button.setAttribute('aria-label', `${number} ${english} / ${japanese}`);
    button.append(preview, caption);
    button.addEventListener('click', () => controller.dispatch({ type: 'GO_TO', index }));
    grid.append(button);
  });
  scrollContainer.append(grid);
  overview.append(scrollContainer);

  if (languages.length > 0) {
    const langSwitch = document.createElement('div');
    langSwitch.className = 'lang-switch';

    const langTitle = document.createElement('div');
    langTitle.textContent = 'Language';
    langSwitch.append(langTitle);

    const langOptions = document.createElement('div');
    langOptions.className = 'lang-options';

    languages.forEach((lang) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lang-button';
      button.setAttribute('data-language', lang);
      button.textContent = languageLabels[lang] || lang.toUpperCase();
      langOptions.append(button);
    });

    langSwitch.append(langOptions);
    overview.append(langSwitch);
  }

  document.body.append(overview);
  const scalePreviews = () => {
    overview.querySelectorAll('.overview-slide-preview').forEach((preview) => {
      preview.style.setProperty('--overview-preview-scale', String(preview.clientWidth / 1200));
    });
  };
  window.addEventListener('resize', scalePreviews);
  const unsubscribe = controller.subscribe((state) => {
    overview.classList.toggle('active', state.overviewOpen);
    overview.setAttribute('aria-hidden', state.overviewOpen ? 'false' : 'true');
    if (state.overviewOpen) {
      requestAnimationFrame(scalePreviews);
      overview.querySelectorAll('img[data-src]').forEach((img) => {
        if (!img.getAttribute('src') && img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
    }
    overview.querySelectorAll('.lang-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.language === state.language);
    });
  });
  return () => {
    unsubscribe();
    window.removeEventListener('resize', scalePreviews);
    overview.remove();
  };
}
