import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { test } from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function text(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
}

test('root documentation defines source, build, and generated-file rules', async () => {
  const [readme, agents] = await Promise.all([text('README.md'), text('AGENTS.md')]);

  assert.match(readme, /npm ci/);
  assert.match(readme, /npm run build/);
  assert.match(readme, /dist\/index\.html/);
  assert.match(readme, /generated/i);

  assert.match(agents, /Source-of-truth order/);
  assert.match(agents, /Level L/);
  assert.match(agents, /Level M/);
  assert.match(agents, /Level H/);
  assert.match(agents, /Do not edit `dist\/index\.html`/);
  assert.match(agents, /update-master-slides/);
  assert.match(agents, /Two-stage language workflow/);
  assert.match(agents, /explicitly confirms the page is complete/);
  assert.match(agents, /Stop and escalate/);
  assert.match(agents, /Cross-page component contract/);
  assert.match(agents, /data-cross-page-instance/);
  assert.match(agents, /component-wide opacity/);
  assert.match(agents, /cross-page component family.*Level H/i);
});

test('maintenance task packet has bounded context and handoff fields', async () => {
  const packet = await text('docs/maintenance/task-packet.md');

  for (const heading of [
    'Change level',
    'Language phase',
    'Allowed files',
    'Files to read first',
    'Forbidden actions',
    'Acceptance checks',
    'Stop and escalate when',
    'Handoff'
  ]) {
    assert.match(packet, new RegExp(heading));
  }
});

test('worktrees and generated QA scratch are ignored', async () => {
  const ignore = await text('.gitignore');
  assert.match(ignore, /^\.worktrees\/$/m);
  assert.match(ignore, /^dist\/\.tmp-/m);
  assert.match(ignore, /^output\/$/m);
});

test('root entry uses generated deck and tracked unsafe writers are quarantined', async () => {
  const [entry, legacyReadme, tracked] = await Promise.all([
    text('index.html'),
    text('legacy/README.md'),
    execFileAsync('git', ['ls-files', 'test', 'scratch'], { cwd: new URL('../../', import.meta.url) })
  ]);
  assert.match(entry, /dist\/index\.html/);
  assert.doesNotMatch(entry, /url=ppt\//);
  assert.match(legacyReadme, /unsafe-write-scripts/);
  assert.doesNotMatch(tracked.stdout, /(?:^|\/)update-(?:master-)?slides[^/]*\.js$/m);
});

test('release contract installs cleanly, rebuilds, and runs QA in CI', async () => {
  const [workflow, attributes, checklist] = await Promise.all([
    text('.github/workflows/qa.yml'),
    text('.gitattributes'),
    text('docs/maintenance/release-checklist.md')
  ]);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /playwright install/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run qa/);
  assert.match(attributes, /dist\/index\.html.*linguist-generated/);
  assert.match(checklist, /Artifact SHA-256/);
  assert.match(checklist, /Privacy and source review/);
});

test('tracked project files follow the documented folder map', async () => {
  const [{ stdout }, folderMap, materialsReadme] = await Promise.all([
    execFileAsync('git', ['ls-files'], { cwd: new URL('../../', import.meta.url) }),
    text('docs/maintenance/folder-map.md'),
    text('materials/README.md')
  ]);
  const tracked = stdout.trim().split('\n');
  for (const obsoleteRootFile of [
    'cover3.png',
    'design-qa.md',
    'ppt_content_review.md',
    '修士报告_69_EN_B.md',
    '共创视角下植物园解说标识研究 IV.docx'
  ]) {
    assert.ok(!tracked.includes(obsoleteRootFile), `${obsoleteRootFile} must not remain at project root`);
  }
  assert.ok(tracked.some((file) => file.startsWith('materials/manuscripts/')));
  assert.ok(tracked.some((file) => file.startsWith('docs/reviews/')));
  assert.match(folderMap, /Do not move/);
  assert.match(materialsReadme, /Access classes/);
});
