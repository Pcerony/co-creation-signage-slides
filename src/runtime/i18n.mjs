import {
  languageTag,
  resolveCompositeLanguage,
  shouldAnnotateElement
} from './hybrid-language.mjs';

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => node.parentElement?.closest('script,style') || !node.nodeValue.trim()
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

export function translationKeyForNode(node, sourceToKey) {
  return node.parentElement?.dataset.i18n || sourceToKey.get(node.nodeValue.trim());
}

export function mountI18n({
  controller,
  dictionaries,
  compositeLanguages = {},
  root = document.body
}) {
  const sourceToKey = new Map(Object.entries(dictionaries.zh).map(([key, value]) => [value.trim(), key]));
  const targets = textNodes(root).map((node) => ({
    node,
    prefix: node.nodeValue.match(/^\s*/)[0],
    suffix: node.nodeValue.match(/\s*$/)[0],
    key: translationKeyForNode(node, sourceToKey),
    annotation: null
  })).filter((target) => target.key);
  const onLanguageClick = (event) => {
    const button = event.target.closest('[data-language]');
    if (button) controller.dispatch({ type: 'SET_LANGUAGE', language: button.dataset.language });
  };
  root.addEventListener('click', onLanguageClick);
  const unsubscribe = controller.subscribe((state) => {
    const composite = resolveCompositeLanguage(state.language, compositeLanguages);
    const primaryLanguage = composite?.primary || state.language;
    document.documentElement.lang = languageTag(state.language, compositeLanguages);
    document.body.classList.forEach((className) => {
      if (className.startsWith('lang-')) document.body.classList.remove(className);
    });
    document.body.classList.add(`lang-${state.language}`);
    for (const target of targets) {
      target.annotation?.remove();
      target.annotation = null;
      target.node.nodeValue = `${target.prefix}${dictionaries[primaryLanguage][target.key]}${target.suffix}`;
      if (composite && shouldAnnotateElement(target.node.parentElement)) {
        const secondaryText = dictionaries[composite.secondary][target.key];
        if (secondaryText && secondaryText !== dictionaries[primaryLanguage][target.key]) {
          const annotation = document.createElement('span');
          annotation.className = 'hybrid-ja-text';
          annotation.lang = composite.secondary;
          annotation.textContent = secondaryText;
          target.node.after(annotation);
          target.annotation = annotation;
        }
      }
    }
    root.querySelectorAll('[data-language]').forEach((button) => button.classList.toggle('active', button.dataset.language === state.language));
  });
  return () => {
    unsubscribe();
    targets.forEach((target) => target.annotation?.remove());
    root.removeEventListener('click', onLanguageClick);
  };
}
