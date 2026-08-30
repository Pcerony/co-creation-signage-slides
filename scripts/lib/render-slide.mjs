import { layoutRegistry } from '../../src/layouts/registry.mjs';

export function renderSlide({ slide, content }) {
  if (!slide?.id || !content?.id) {
    throw new Error('slide and content IDs are required');
  }
  if (content.id !== slide.id) {
    throw new Error(`content id ${content.id} does not match slide ${slide.id}`);
  }
  if (content.layout && content.layout !== slide.layout) {
    throw new Error(`content layout ${content.layout} does not match slide layout ${slide.layout}`);
  }
  const hasMarkup = typeof content.markup === 'string'
    ? Boolean(content.markup.trim())
    : Array.isArray(content.markup)
      && content.markup.length > 0
      && content.markup.every(fragment => typeof fragment === 'string' && fragment.trim());
  if (!hasMarkup) {
    throw new Error(`slide ${slide.id} has no markup`);
  }

  const layout = layoutRegistry.get(slide.layout);
  if (!layout) {
    throw new Error(`unknown layout ${slide.layout} for slide ${slide.id}`);
  }
  return layout.render({ slide, content });
}
