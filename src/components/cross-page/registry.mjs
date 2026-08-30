import {
  crossPageComponentCatalog,
  supportsCrossPageVariant
} from './catalog.mjs';

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const ICON_PATHS = Object.freeze({
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  lightbulb: '<path d="M9 18h6M10 22h4M8 14c-1.2-1.3-1.5-2.5-1.5-3.5a5.5 5.5 0 0 1 11 0c0 1.3-.5 2.6-1.5 3.5-.8.8-1.3 1.5-1.5 2.5h-5c-.2-1-.8-1.8-1.5-2.5Z"/>',
  'pen-tool': '<path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-1.5M14 5a3 3 0 0 0-3 3v11l-8 3 3-8h11a3 3 0 0 0 3-3V5Z"/>',
  signpost: '<path d="M12 3v18M5 6h11l3 3-3 3H5l-3-3 3-3Z"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'
});

function icon(name) {
  return `<svg class="cross-page-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

function renderAttentionPath({ instanceId, variant }) {
  return [
    `<div class="cross-page-component attention-path is-${variant}" data-cross-page-rendered="attention-path" data-cross-page-instance="${escapeAttribute(instanceId)}" data-cross-page-variant="${variant}">`,
    '  <div class="attention-path__row is-attention" data-morph-part="attention-row">',
    '    <span class="attention-path__label" data-morph-part="information">INFORMATION</span>',
    '    <span class="attention-path__line" data-morph-part="attention-line"></span>',
    '    <strong class="attention-path__stage" data-morph-part="attention">01 ATTENTION</strong>',
    '  </div>',
    '  <div class="attention-path__row is-secondary" data-morph-part="encoding-row">',
    '    <span class="attention-path__label" data-morph-part="working-memory">WORKING MEMORY</span>',
    '    <span class="attention-path__line" data-morph-part="encoding-line"></span>',
    '    <strong class="attention-path__stage" data-morph-part="encoding">02 ENCODING</strong>',
    '  </div>',
    '  <div class="attention-path__row is-secondary" data-morph-part="integration-row">',
    '    <span class="attention-path__label" data-morph-part="short-term-memory">SHORT-TERM MEMORY</span>',
    '    <span class="attention-path__line" data-morph-part="integration-line"></span>',
    '    <strong class="attention-path__stage" data-morph-part="integration">03 INTEGRATION</strong>',
    '  </div>',
    '  <div class="attention-path__row is-secondary" data-morph-part="consolidation-row">',
    '    <span class="attention-path__label" data-morph-part="long-term-memory">LONG-TERM MEMORY</span>',
    '    <span class="attention-path__line" data-morph-part="consolidation-line"></span>',
    '    <strong class="attention-path__stage" data-morph-part="consolidation">04 CONSOLIDATION</strong>',
    '  </div>',
    `  <div class="attention-path__signage" data-morph-part="signage">${icon('signpost')}<span data-i18n="common.interpretiveSignage">解说标识</span></div>`,
    '</div>'
  ].join('\n');
}

function workshopStep({ part, iconName, key, text, className = '' }) {
  return `<div class="workshop-flow__step ${className}" data-morph-part="${part}">${icon(iconName)}<span data-i18n="${key}">${text}</span></div>`;
}

function connector(part) {
  return `<span class="workshop-flow__connector" data-morph-part="${part}" aria-hidden="true">›</span>`;
}

function renderWorkshopFlow({ instanceId, variant }) {
  return [
    `<section class="cross-page-component workshop-flow is-${variant}" data-cross-page-rendered="workshop-flow" data-cross-page-instance="${escapeAttribute(instanceId)}" data-cross-page-variant="${variant}">`,
    '  <div class="workshop-flow__track">',
    `    ${workshopStep({ part: 'field-research', iconName: 'search', key: 'common.fieldResearch', text: '实地调研' })}`,
    `    ${connector('connector-field')}`,
    `    <div class="workshop-flow__gap" data-morph-part="gap-1">${icon('alert')}<span>GAP 1</span></div>`,
    `    ${connector('connector-gap-1')}`,
    `    ${workshopStep({ part: 'idea-discussion', iconName: 'lightbulb', key: 'common.ideaDiscussion', text: '理念讨论', className: 'is-dark' })}`,
    `    ${connector('connector-idea')}`,
    `    ${workshopStep({ part: 'prototype-design', iconName: 'pen-tool', key: 'common.prototypeDesign', text: '原型设计', className: 'is-accent' })}`,
    `    ${connector('connector-gap-2')}`,
    `    <div class="workshop-flow__gap" data-morph-part="gap-2">${icon('alert')}<span>GAP 2</span></div>`,
    '  </div>',
    '</section>'
  ].join('\n');
}

export const componentDefinitions = new Map([
  ['attention-path', { variants: new Set(crossPageComponentCatalog['attention-path']), render: renderAttentionPath }],
  ['workshop-flow', { variants: new Set(crossPageComponentCatalog['workshop-flow']), render: renderWorkshopFlow }]
]);

export function renderCrossPageComponent({ componentId, instanceId, variant }) {
  const definition = componentDefinitions.get(componentId);
  if (!definition || !supportsCrossPageVariant(componentId, variant)) {
    throw new Error(`unsupported ${componentId}/${variant}`);
  }
  return definition.render({ instanceId, variant });
}

export function hydrateCrossPageComponents({ root = document } = {}) {
  const mounts = [...root.querySelectorAll('[data-cross-page-component]')];
  for (const mount of mounts) {
    if (mount.dataset.crossPageHydrated === 'true') continue;
    mount.innerHTML = renderCrossPageComponent({
      componentId: mount.dataset.crossPageComponent,
      instanceId: mount.dataset.crossPageInstance,
      variant: mount.dataset.crossPageVariant
    });
    mount.dataset.crossPageHydrated = 'true';
  }
  return mounts;
}
