// Lists every file in public/ so the service worker can pre-cache the whole app for offline use.
// Run `npm run manifest` after adding/removing files in public/ (a unit test fails if it is stale).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SKIP = new Set(['asset-manifest.json', 'sw.js']);

export function listFiles(dir = root, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base + '/' + e.name;
    if (e.isDirectory()) out.push(...listFiles(path.join(dir, e.name), rel));
    else if (!SKIP.has(e.name)) out.push(rel);
  }
  return out.sort();
}

export function buildManifest() {
  return JSON.stringify({ files: ['/', ...listFiles()] }, null, 1) + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(root, 'asset-manifest.json'), buildManifest());
  console.log('asset-manifest.json updated');
}
