import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';

import {
  validateClaims,
  validateCrossPageMounts,
  validateManifest,
  validatePublicAssetNames,
  validateSources
} from './lib/validate-project.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

async function readYaml(relativePath) {
  return parseYaml(await readFile(path.join(root, relativePath), 'utf8'));
}

async function exists(relativePath) {
  try {
    return (await stat(path.join(root, relativePath))).isFile();
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  const data = await readFile(path.join(root, relativePath));
  return createHash('sha256').update(data).digest('hex');
}

export async function validateProjectFiles() {
  const [manifest, schema, sources, claims] = await Promise.all([
    readJson('deck-manifest.json'),
    readJson('schemas/deck-manifest.schema.json'),
    readYaml('sources.yml'),
    readYaml('claims.yml')
  ]);
  const issues = [];
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateSchema = ajv.compile(schema);

  if (!validateSchema(manifest)) {
    for (const error of validateSchema.errors || []) {
      issues.push(`deck-manifest.json${error.instancePath || '/'}: ${error.message}`);
    }
  }

  const sourceIds = (sources.sources || []).map(source => source.id);
  const claimIds = (claims.claims || []).map(claim => claim.id);
  issues.push(...validateSources(sources));
  issues.push(...validateClaims(claims, { sourceIds }));
  issues.push(...validateManifest(manifest, { claimIds }));

  const referencedFiles = new Set([
    ...manifest.slides.map(slide => slide.content),
    ...manifest.assets.map(asset => asset.path),
    ...(sources.sources || []).map(source => source.path)
  ]);
  for (const relativePath of referencedFiles) {
    if (!await exists(relativePath)) issues.push(`missing referenced file ${relativePath}`);
  }

  const contentsBySlideId = new Map();
  for (const slide of manifest.slides) {
    if (!await exists(slide.content)) continue;
    const content = await readJson(slide.content);
    contentsBySlideId.set(slide.id, content);
    for (const field of ['assets', 'claims']) {
      const registered = [...(slide[field] || [])].sort();
      const declared = [...(content[field] || [])].sort();
      if (JSON.stringify(registered) !== JSON.stringify(declared)) {
        issues.push(`${slide.id}: manifest ${field} do not match ${slide.content}`);
      }
    }
  }
  issues.push(...validateCrossPageMounts(manifest, contentsBySlideId));

  for (const source of sources.sources || []) {
    if (await exists(source.path)) {
      const actual = await sha256(source.path);
      if (actual !== source.sha256) issues.push(`${source.id}: checksum mismatch for ${source.path}`);
    }
  }

  issues.push(...validatePublicAssetNames(
    manifest.assets
      .filter(asset => asset.access === 'public')
      .map(asset => asset.path)
  ));

  return { issues, manifest, sources, claims };
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirect) {
  const result = await validateProjectFiles();
  if (result.issues.length) {
    for (const issue of result.issues) process.stderr.write(`ERROR ${issue}\n`);
    process.exitCode = 1;
  } else {
    const blockedClaims = result.claims.claims.filter(claim => claim.reviewStatus?.startsWith('blocked-'));
    process.stdout.write(
      `PASS ${result.manifest.slides.length} slides, ${result.sources.sources.length} sources, ` +
      `${result.claims.claims.length} claims validated\n`
    );
    if (blockedClaims.length) {
      process.stdout.write(`WARN ${blockedClaims.length} claims remain blocked for human source review\n`);
    }
  }
}
