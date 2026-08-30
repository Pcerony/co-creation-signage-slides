import {
  crossPageComponentCatalog,
  supportsCrossPageVariant
} from '../../src/components/cross-page/catalog.mjs';

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ACCESS_LEVELS = new Set(['public', 'internal', 'restricted-derived', 'restricted-raw']);
const CLAIM_STRENGTHS = new Set([
  'descriptive',
  'exploratory trend',
  'supported association',
  'established external'
]);

function duplicateIssues(items, label) {
  const seen = new Set();
  const issues = [];
  for (const item of items) {
    if (seen.has(item.id)) issues.push(`duplicate ${label} id ${item.id}`);
    seen.add(item.id);
  }
  return issues;
}

export function validateManifest(manifest, { claimIds = [] } = {}) {
  const issues = [];
  const chapters = manifest.chapters || [];
  const layouts = new Set(manifest.layouts || []);
  const assets = manifest.assets || [];
  const slides = manifest.slides || [];
  const crossPageComponents = manifest.crossPageComponents || [];
  const chapterIds = new Set(chapters.map(item => item.id));
  const assetIds = new Set(assets.map(item => item.id));
  const knownClaims = new Set(claimIds);
  const slideIndexes = new Map(slides.map((slide, index) => [slide.id, index]));

  if (manifest.schemaVersion !== 1) issues.push('manifest schemaVersion must be 1');
  if (!ID_PATTERN.test(manifest.deckId || '')) issues.push(`invalid deck id ${manifest.deckId || '<missing>'}`);
  if (!manifest.languages?.includes(manifest.defaultLanguage)) {
    issues.push(`default language ${manifest.defaultLanguage || '<missing>'} is not registered`);
  }
  const languages = new Set(manifest.languages || []);
  for (const [id, composite] of Object.entries(manifest.compositeLanguages || {})) {
    if (!languages.has(id)) issues.push(`${id}: composite language is not registered`);
    if (composite.primary === id || composite.secondary === id) {
      issues.push(`${id}: composite language cannot reference itself`);
    }
    if (!languages.has(composite.primary)) issues.push(`${id}: unknown primary language ${composite.primary}`);
    if (!languages.has(composite.secondary)) issues.push(`${id}: unknown secondary language ${composite.secondary}`);
    if (composite.policy !== 'balanced-emphasis') issues.push(`${id}: unsupported composite policy ${composite.policy}`);
  }

  issues.push(...duplicateIssues(chapters, 'chapter'));
  issues.push(...duplicateIssues(assets, 'asset'));
  issues.push(...duplicateIssues(slides, 'slide'));

  const seenCrossPageInstances = new Set();
  for (const connection of crossPageComponents) {
    const instanceId = connection.instanceId || '<missing>';
    if (seenCrossPageInstances.has(instanceId)) {
      issues.push(`duplicate cross-page instance ${instanceId}`);
    }
    seenCrossPageInstances.add(instanceId);
    if (!ID_PATTERN.test(connection.instanceId || '')) {
      issues.push(`invalid cross-page instance id ${instanceId}`);
    }
    if (!crossPageComponentCatalog[connection.componentId]) {
      issues.push(`${instanceId}: unknown component ${connection.componentId || '<missing>'}`);
    }
    const fromSlideId = connection.from?.slideId;
    const toSlideId = connection.to?.slideId;
    if (!slideIndexes.has(fromSlideId)) issues.push(`${instanceId}: unknown from slide ${fromSlideId || '<missing>'}`);
    if (!slideIndexes.has(toSlideId)) issues.push(`${instanceId}: unknown to slide ${toSlideId || '<missing>'}`);
    if (fromSlideId === toSlideId) issues.push(`${instanceId}: endpoints must use different slides`);
    if (
      slideIndexes.has(fromSlideId)
      && slideIndexes.has(toSlideId)
      && Math.abs(slideIndexes.get(fromSlideId) - slideIndexes.get(toSlideId)) !== 1
    ) {
      issues.push(`${instanceId}: endpoints must be adjacent`);
    }
    for (const endpoint of [connection.from, connection.to]) {
      if (
        crossPageComponentCatalog[connection.componentId]
        && !supportsCrossPageVariant(connection.componentId, endpoint?.variant)
      ) {
        issues.push(`${instanceId}: unsupported ${connection.componentId} variant ${endpoint?.variant || '<missing>'}`);
      }
    }
    if (!Number.isInteger(connection.durationMs) || connection.durationMs < 200 || connection.durationMs > 1200) {
      issues.push(`${instanceId}: duration must be between 200 and 1200 ms`);
    }
  }

  for (const slide of slides) {
    if (!ID_PATTERN.test(slide.id || '')) issues.push(`invalid slide id ${slide.id || '<missing>'}`);
    if (!chapterIds.has(slide.chapterId)) issues.push(`${slide.id}: unknown chapter ${slide.chapterId}`);
    if (!layouts.has(slide.layout)) issues.push(`${slide.id}: unknown layout ${slide.layout}`);
    for (const assetId of slide.assets || []) {
      if (!assetIds.has(assetId)) issues.push(`${slide.id}: unknown asset ${assetId}`);
    }
    for (const claimId of slide.claims || []) {
      if (!knownClaims.has(claimId)) issues.push(`${slide.id}: unknown claim ${claimId}`);
    }
  }

  for (const asset of assets) {
    if (!ACCESS_LEVELS.has(asset.access)) issues.push(`${asset.id}: invalid access ${asset.access}`);
  }

  return issues;
}

function crossPageMounts(content) {
  const markup = Array.isArray(content?.markup) ? content.markup.join('\n') : String(content?.markup || '');
  return [...markup.matchAll(/<[^>]+>/g)].flatMap(([tag]) => {
    if (!tag.includes('data-cross-page-instance=')) return [];
    const attributes = Object.fromEntries(
      [...tag.matchAll(/\b(data-cross-page-(?:component|instance|variant))="([^"]*)"/g)]
        .map(([, name, value]) => [name, value])
    );
    return attributes['data-cross-page-instance'] ? [attributes] : [];
  });
}

export function validateCrossPageMounts(manifest, contentsBySlideId) {
  const issues = [];
  for (const connection of manifest.crossPageComponents || []) {
    for (const endpoint of [connection.from, connection.to]) {
      const mounts = crossPageMounts(contentsBySlideId.get(endpoint.slideId));
      const matches = mounts.filter((mount) => (
        mount['data-cross-page-component'] === connection.componentId
        && mount['data-cross-page-instance'] === connection.instanceId
        && mount['data-cross-page-variant'] === endpoint.variant
      ));
      if (matches.length !== 1) {
        issues.push(
          `${connection.instanceId}: missing ${connection.componentId}/${endpoint.variant} mount on ${endpoint.slideId}`
        );
      }
    }
  }
  return issues;
}

export function validateSources(document) {
  const sources = document.sources || [];
  const issues = duplicateIssues(sources, 'source');

  for (const source of sources) {
    if (!ID_PATTERN.test(source.id || '')) issues.push(`invalid source id ${source.id || '<missing>'}`);
    if (!SHA256_PATTERN.test(source.sha256 || '')) issues.push(`${source.id}: invalid sha256`);
    if (!ACCESS_LEVELS.has(source.access)) issues.push(`${source.id}: invalid access ${source.access}`);
    if (!source.path) issues.push(`${source.id}: missing path`);
  }

  return issues;
}

export function validateClaims(document, { sourceIds = [] } = {}) {
  const claims = document.claims || [];
  const issues = duplicateIssues(claims, 'claim');
  const knownSources = new Set(sourceIds);

  for (const claim of claims) {
    if (!ID_PATTERN.test(claim.id || '')) issues.push(`invalid claim id ${claim.id || '<missing>'}`);
    if (!knownSources.has(claim.sourceId)) issues.push(`${claim.id}: unknown source ${claim.sourceId}`);
    if (!CLAIM_STRENGTHS.has(claim.allowedStrength)) {
      issues.push(`${claim.id}: invalid allowedStrength ${claim.allowedStrength}`);
    }
    if (!claim.locator) issues.push(`${claim.id}: missing locator`);
  }

  return issues;
}

export function validatePublicAssetNames(paths) {
  return paths.flatMap(assetPath => {
    const filename = assetPath.split('/').at(-1) || '';
    const isHeatmap = /heatmap/i.test(filename);
    const anonymous = /(?:^|[-_])p\d{2}(?:[-_.]|$)/i.test(filename);
    return isHeatmap && !anonymous
      ? [`public asset uses a non-anonymous heatmap filename: ${assetPath}`]
      : [];
  });
}
