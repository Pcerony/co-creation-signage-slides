import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactPath = path.join(root, 'dist/index.html');
const artifact = await readFile(artifactPath, 'utf8');
const manifest = JSON.parse(await readFile(path.join(root, 'deck-manifest.json'), 'utf8'));
const bytes = (await stat(artifactPath)).size;
const issues = [];

if (bytes >= 30 * 1024 * 1024) issues.push(`dist/index.html exceeds 30 MiB (${bytes} bytes)`);
if (/<(?:link|script)[^>]+(?:href|src)="https?:/i.test(artifact)) issues.push('remote runtime dependency found');
if ((artifact.match(/\bdata-src="data:image\//g) || []).length < 10) issues.push('nonadjacent media is not deferred');
if ((artifact.match(/\bdata-slide-id=/g) || []).length !== manifest.slides.length) {
  issues.push(`generated slide count is not ${manifest.slides.length}`);
}

if (issues.length) {
  issues.forEach((issue) => process.stderr.write(`ERROR ${issue}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS portable artifact ${(bytes / 1024 / 1024).toFixed(1)} MiB with deferred media\n`);
}
