import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  hydrateCrossPageComponents,
  renderCrossPageComponent
} from '../../src/components/cross-page/registry.mjs';
import {
  findCrossPageConnection,
  inverseRectTransform,
  pairMorphParts,
  rectTransformString
} from '../../src/runtime/cross-page-components.mjs';

function morphParts(html) {
  return [...html.matchAll(/data-morph-part="([^"]+)"/g)].map((match) => match[1]);
}

for (const [componentId, variants] of [
  ['attention-path', ['expanded', 'barrier']],
  ['workshop-flow', ['workshop', 'gap-loop']]
]) {
  test(`${componentId} variants share one stable morph-part structure`, () => {
    const rendered = variants.map((variant) => renderCrossPageComponent({
      componentId,
      instanceId: `test-${componentId}`,
      variant
    }));

    for (const [index, html] of rendered.entries()) {
      assert.match(html, new RegExp(`data-cross-page-rendered="${componentId}"`));
      assert.match(html, new RegExp(`data-cross-page-variant="${variants[index]}"`));
      assert.doesNotMatch(html, /<script\b/i);
      assert.doesNotMatch(html, /\sstyle=/i);
      assert.equal(new Set(morphParts(html)).size, morphParts(html).length, 'part IDs are unique');
    }
    assert.deepEqual(morphParts(rendered[0]), morphParts(rendered[1]));
  });
}

test('workshop morph contains only the three continuing stages', () => {
  const workshop = renderCrossPageComponent({
    componentId: 'workshop-flow',
    instanceId: 'workshop-research-gap',
    variant: 'workshop'
  });
  const gapLoop = renderCrossPageComponent({
    componentId: 'workshop-flow',
    instanceId: 'workshop-research-gap',
    variant: 'gap-loop'
  });

  assert.doesNotMatch(workshop, /data-morph-part="participants"|workshop-flow__title/);
  assert.doesNotMatch(gapLoop, /data-morph-part="participants"|workshop-flow__title/);
  assert.ok(
    gapLoop.indexOf('data-morph-part="field-research"')
      < gapLoop.indexOf('data-morph-part="gap-1"')
  );
  assert.ok(
    gapLoop.indexOf('data-morph-part="gap-1"')
      < gapLoop.indexOf('data-morph-part="idea-discussion"')
  );
});

test('component hydration fills each mount exactly once', () => {
  const mount = {
    dataset: {
      crossPageComponent: 'attention-path',
      crossPageInstance: 'background-attention',
      crossPageVariant: 'expanded'
    },
    innerHTML: ''
  };
  const root = { querySelectorAll: () => [mount] };

  assert.deepEqual(hydrateCrossPageComponents({ root }), [mount]);
  assert.match(mount.innerHTML, /data-cross-page-rendered="attention-path"/);
  assert.equal(mount.dataset.crossPageHydrated, 'true');

  mount.innerHTML = 'preserved';
  hydrateCrossPageComponents({ root });
  assert.equal(mount.innerHTML, 'preserved');
});

test('component renderer rejects unknown IDs and variants', () => {
  assert.throws(() => renderCrossPageComponent({
    componentId: 'missing', instanceId: 'test', variant: 'expanded'
  }), /unsupported missing\/expanded/);
  assert.throws(() => renderCrossPageComponent({
    componentId: 'attention-path', instanceId: 'test', variant: 'missing'
  }), /unsupported attention-path\/missing/);
});

test('pages two through four declare mounts instead of component internals', async () => {
  const paths = [
    'src/content/slides/s02-background.json',
    'src/content/slides/s04-knowledge-overload.json',
    'src/content/slides/s05-evaluation-limit.json'
  ];
  const contents = await Promise.all(paths.map(async (path) => JSON.parse(
    await readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
  )));
  const markup = contents.map((content) => (
    Array.isArray(content.markup) ? content.markup.join('\n') : content.markup
  ));

  assert.match(markup[0], /data-cross-page-instance="background-attention"[^>]+expanded/);
  assert.match(markup[1], /data-cross-page-instance="background-attention"[^>]+barrier/);
  assert.match(markup[1], /data-cross-page-instance="workshop-research-gap"[^>]+workshop/);
  assert.match(markup[2], /data-cross-page-instance="workshop-research-gap"[^>]+gap-loop/);
  assert.match(markup[1], /s04-cocreation[\s\S]+common\.workshopProcess[\s\S]+common\.workshopParticipants[\s\S]+legacy\.text\.0183[\s\S]+data-cross-page-instance="workshop-research-gap"/);
  assert.ok(contents.every((content) => Array.isArray(content.markup)));
  assert.doesNotMatch(markup.join('\n'), /s02-path-row|s04-attention-row|s04-workshop-step/);
});

test('connection lookup resolves forward and reverse endpoints', () => {
  const connection = {
    instanceId: 'background-attention',
    componentId: 'attention-path',
    from: { slideId: 's02-background', variant: 'expanded' },
    to: { slideId: 's04-knowledge-overload', variant: 'barrier' },
    durationMs: 760
  };

  assert.deepEqual(
    findCrossPageConnection([connection], 's02-background', 's04-knowledge-overload'),
    { connection, direction: 'forward', source: connection.from, target: connection.to }
  );
  assert.deepEqual(
    findCrossPageConnection([connection], 's04-knowledge-overload', 's02-background'),
    { connection, direction: 'reverse', source: connection.to, target: connection.from }
  );
  assert.equal(findCrossPageConnection([connection], 's02-background', 'missing'), null);
});

test('geometry helpers pair stable parts and never generate opacity', () => {
  const transform = inverseRectTransform(
    { left: 10, top: 20, width: 80, height: 40 },
    { left: 110, top: 70, width: 40, height: 20 }
  );
  assert.deepEqual(transform, { translateX: -100, translateY: -50, scaleX: 2, scaleY: 2 });
  assert.equal(rectTransformString(transform), 'translate(-100px, -50px) scale(2, 2)');
  assert.doesNotMatch(rectTransformString(transform), /opacity/i);

  const source = new Map([['a', { id: 'source-a' }], ['only-source', {}], ['b', { id: 'source-b' }]]);
  const target = new Map([['b', { id: 'target-b' }], ['a', { id: 'target-a' }]]);
  assert.deepEqual(pairMorphParts(source, target), [
    { partId: 'a', source: source.get('a'), target: target.get('a') },
    { partId: 'b', source: source.get('b'), target: target.get('b') }
  ]);
});
