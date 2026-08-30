import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  validateClaims,
  validateCrossPageMounts,
  validateManifest,
  validatePublicAssetNames,
  validateSources
} from '../../scripts/lib/validate-project.mjs';

const validManifest = {
  schemaVersion: 1,
  deckId: 'test-deck',
  defaultLanguage: 'zh',
  languages: ['zh', 'en', 'ja', 'es-MX'],
  chapters: [{ id: 'background', titleKey: 'chapters.background' }],
  layouts: ['cover'],
  assets: [{ id: 'cover-qr', path: 'src/assets/presentation/cover-qr.png', access: 'public' }],
  slides: [{
    id: 's01-cover',
    chapterId: 'background',
    layout: 'cover',
    content: 'src/content/slides/s01-cover.json',
    assets: ['cover-qr'],
    claims: ['claim-1']
  }]
};

test('manifest validator accepts stable references', () => {
  assert.deepEqual(validateManifest(validManifest, { claimIds: ['claim-1'] }), []);
});

test('manifest validator reports duplicate and unknown references with slide IDs', () => {
  const manifest = structuredClone(validManifest);
  manifest.slides.push({ ...manifest.slides[0], layout: 'missing-layout', assets: ['missing-asset'] });

  const issues = validateManifest(manifest, { claimIds: [] });
  assert.ok(issues.some(issue => issue.includes('duplicate slide id s01-cover')));
  assert.ok(issues.some(issue => issue.includes('s01-cover: unknown layout missing-layout')));
  assert.ok(issues.some(issue => issue.includes('s01-cover: unknown asset missing-asset')));
  assert.ok(issues.some(issue => issue.includes('s01-cover: unknown claim claim-1')));
});

test('manifest validator accepts a registered composite mode and rejects invalid components', () => {
  const manifest = structuredClone(validManifest);
  manifest.languages.unshift('en-ja');
  manifest.defaultLanguage = 'en-ja';
  manifest.compositeLanguages = {
    'en-ja': { primary: 'en', secondary: 'ja', policy: 'balanced-emphasis' }
  };
  assert.deepEqual(validateManifest(manifest, { claimIds: ['claim-1'] }), []);

  manifest.compositeLanguages['en-ja'].secondary = 'missing';
  const issues = validateManifest(manifest, { claimIds: ['claim-1'] });
  assert.ok(issues.some(issue => issue.includes('en-ja: unknown secondary language missing')));

  manifest.compositeLanguages['en-ja'] = {
    primary: 'en-ja', secondary: 'ja', policy: 'balanced-emphasis'
  };
  assert.ok(validateManifest(manifest, { claimIds: ['claim-1'] })
    .some(issue => issue.includes('en-ja: composite language cannot reference itself')));
});

test('manifest validator accepts adjacent cross-page component connections', () => {
  const manifest = structuredClone(validManifest);
  manifest.slides.push({
    ...manifest.slides[0],
    id: 's02-background',
    content: 'src/content/slides/s02-background.json'
  });
  manifest.crossPageComponents = [{
    instanceId: 'background-attention',
    componentId: 'attention-path',
    from: { slideId: 's01-cover', variant: 'expanded' },
    to: { slideId: 's02-background', variant: 'barrier' },
    durationMs: 760
  }];

  assert.deepEqual(validateManifest(manifest, { claimIds: ['claim-1'] }), []);
});

test('manifest validator rejects invalid cross-page component connections', () => {
  const manifest = structuredClone(validManifest);
  manifest.slides.push(
    { ...manifest.slides[0], id: 's02-background', content: 'src/content/slides/s02-background.json' },
    { ...manifest.slides[0], id: 's03-method', content: 'src/content/slides/s03-method.json' }
  );
  manifest.crossPageComponents = [
    {
      instanceId: 'bad-component',
      componentId: 'missing-component',
      from: { slideId: 's01-cover', variant: 'expanded' },
      to: { slideId: 's03-method', variant: 'barrier' },
      durationMs: 120
    },
    {
      instanceId: 'bad-component',
      componentId: 'attention-path',
      from: { slideId: 'missing-slide', variant: 'missing-variant' },
      to: { slideId: 'missing-slide', variant: 'barrier' },
      durationMs: 1300
    }
  ];

  const issues = validateManifest(manifest, { claimIds: ['claim-1'] });
  assert.ok(issues.some(issue => issue.includes('duplicate cross-page instance bad-component')));
  assert.ok(issues.some(issue => issue.includes('bad-component: unknown component missing-component')));
  assert.ok(issues.some(issue => issue.includes('bad-component: endpoints must be adjacent')));
  assert.ok(issues.some(issue => issue.includes('bad-component: unknown from slide missing-slide')));
  assert.ok(issues.some(issue => issue.includes('bad-component: endpoints must use different slides')));
  assert.ok(issues.some(issue => issue.includes('bad-component: unsupported attention-path variant missing-variant')));
  assert.ok(issues.filter(issue => issue.includes('duration must be between 200 and 1200 ms')).length === 2);
});

test('cross-page mount validator requires one matching endpoint per slide', () => {
  const manifest = {
    crossPageComponents: [{
      instanceId: 'background-attention',
      componentId: 'attention-path',
      from: { slideId: 's02-background', variant: 'expanded' },
      to: { slideId: 's04-knowledge-overload', variant: 'barrier' },
      durationMs: 760
    }]
  };
  const validContents = new Map([
    ['s02-background', { markup: '<div data-cross-page-component="attention-path" data-cross-page-instance="background-attention" data-cross-page-variant="expanded"></div>' }],
    ['s04-knowledge-overload', { markup: ['<div data-cross-page-component="attention-path"', ' data-cross-page-instance="background-attention" data-cross-page-variant="barrier"></div>'] }]
  ]);
  assert.deepEqual(validateCrossPageMounts(manifest, validContents), []);

  const invalidContents = new Map(validContents);
  invalidContents.set('s04-knowledge-overload', {
    markup: '<div data-cross-page-component="workshop-flow" data-cross-page-instance="background-attention" data-cross-page-variant="workshop"></div>'
  });
  assert.ok(validateCrossPageMounts(manifest, invalidContents)
    .some(issue => issue.includes('background-attention: missing attention-path/barrier mount on s04-knowledge-overload')));
});

test('source validator requires unique IDs and lowercase SHA-256 digests', () => {
  const sources = {
    sources: [
      { id: 'source-1', path: 'source.txt', sha256: 'bad', access: 'internal' },
      { id: 'source-1', path: 'other.txt', sha256: 'a'.repeat(64), access: 'public' }
    ]
  };

  const issues = validateSources(sources);
  assert.ok(issues.some(issue => issue.includes('invalid sha256')));
  assert.ok(issues.some(issue => issue.includes('duplicate source id source-1')));
});

test('claim validator rejects unknown sources and invalid wording strengths', () => {
  const claims = {
    claims: [{ id: 'claim-1', sourceId: 'missing', locator: 'lines 1-2', allowedStrength: 'proven' }]
  };

  const issues = validateClaims(claims, { sourceIds: ['source-1'] });
  assert.ok(issues.some(issue => issue.includes('unknown source missing')));
  assert.ok(issues.some(issue => issue.includes('invalid allowedStrength proven')));
});

test('public asset validator rejects likely participant names', () => {
  const issues = validatePublicAssetNames([
    'src/assets/presentation/p01-control.png',
    'src/assets/presentation/academic_heatmap_akama-kumiko.png'
  ]);

  assert.deepEqual(issues, [
    'public asset uses a non-anonymous heatmap filename: src/assets/presentation/academic_heatmap_akama-kumiko.png'
  ]);
});
