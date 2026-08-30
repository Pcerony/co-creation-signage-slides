import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'deck-manifest.json');
const outputDirectory = path.join(root, 'src/assets/images');
const write = process.argv.includes('--write');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function targetPath(asset) {
  return `src/assets/images/${asset.id}${asset.id === 'cover-qr' ? '.png' : '.jpg'}`;
}

if (write) {
  await mkdir(outputDirectory, { recursive: true });
  for (const asset of manifest.assets) {
    asset.legacyPath ||= asset.path;
    asset.path = targetPath(asset);
    const source = path.join(root, asset.legacyPath);
    const target = path.join(root, asset.path);
    if (asset.id === 'cover-qr') {
      await copyFile(source, target);
    } else {
      const maxDimension = asset.access === 'restricted-derived' ? '1280' : '1400';
      const quality = asset.access === 'restricted-derived' ? '70' : '75';
      await execFileAsync('/usr/bin/sips', ['-Z', maxDimension, '-s', 'format', 'jpeg', '-s', 'formatOptions', quality, source, '--out', target]);
    }
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

let totalBytes = 0;
for (const asset of manifest.assets) {
  const expectedPath = targetPath(asset);
  if (asset.path !== expectedPath) throw new Error(`${asset.id}: optimized path drift; run with --write`);
  totalBytes += (await stat(path.join(root, asset.path))).size;
}
if (totalBytes > 20 * 1024 * 1024) throw new Error(`optimized assets exceed 20 MiB: ${totalBytes}`);
console.log(`Optimized asset check passed: ${manifest.assets.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`);
