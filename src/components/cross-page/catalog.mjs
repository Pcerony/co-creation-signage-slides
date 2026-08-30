export const crossPageComponentCatalog = Object.freeze({
  'attention-path': Object.freeze(['expanded', 'barrier']),
  'workshop-flow': Object.freeze(['workshop', 'gap-loop'])
});

export function supportsCrossPageVariant(componentId, variant) {
  return crossPageComponentCatalog[componentId]?.includes(variant) || false;
}
