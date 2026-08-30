import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml']
]);

export async function embedHtmlAssets(html, { root, assets = [], baseDirectory = 'ppt' }) {
  const matches = [...html.matchAll(/\b(?:data-)?src="([^"]+)"/g)];
  const replacements = new Map();
  await Promise.all(matches.map(async ([, source]) => {
    if (/^(?:data:|https?:|#)/i.test(source) || replacements.has(source)) return;
    const decodedSource = decodeURIComponent(source);
    const assetId = decodedSource.startsWith('asset:') ? decodedSource.slice(6) : null;
    const asset = assetId ? assets.find((candidate) => candidate.id === assetId) : null;
    if (assetId && !asset) throw new Error(`unknown embedded asset ${assetId}`);
    const absolutePath = asset
      ? path.resolve(root, asset.path)
      : path.resolve(root, baseDirectory, decodedSource);
    const relativePath = path.relative(root, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) throw new Error(`asset escapes project root: ${source}`);
    const mime = MIME_TYPES.get(path.extname(absolutePath).toLowerCase());
    if (!mime) throw new Error(`unsupported embedded asset type: ${source}`);
    const buffer = await readFile(absolutePath);
    replacements.set(source, `data:${mime};base64,${buffer.toString('base64')}`);
  }));
  return html.replace(/\b((?:data-)?src)="([^"]+)"/g, (match, attribute, source) => `${attribute}="${replacements.get(source) || source}"`);
}
