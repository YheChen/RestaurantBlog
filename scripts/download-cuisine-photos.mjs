#!/usr/bin/env node
/**
 * Downloads the cuisine stock photos into public/photos/cuisine/ so the site
 * serves them itself instead of hotlinking Unsplash.
 *
 * No API key and no account needed. The Unsplash Licence
 * (https://unsplash.com/license) permits downloading and redistributing the
 * photos as part of your own work.
 *
 *   node scripts/download-cuisine-photos.mjs            # fetch what is missing
 *   node scripts/download-cuisine-photos.mjs --force    # re-download everything
 *   node scripts/download-cuisine-photos.mjs --width 1400
 *
 * Writes data/cuisine-photos-local.json, which lib/restaurant-images.ts reads
 * to decide between the local copy and the remote URL. Nothing breaks if this
 * is never run: the site just serves the photos from Unsplash instead.
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = [
  path.join(ROOT, 'data', 'cuisine-photos.ts'),
  path.join(ROOT, 'data', 'dish-photos.ts'),
];
const OUT_DIR = path.join(ROOT, 'public', 'photos', 'cuisine');
const MANIFEST = path.join(ROOT, 'data', 'cuisine-photos-local.json');

function parseArgs(argv) {
  const args = { force: false, width: 1200, quality: 72 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--force') args.force = true;
    else if (argv[i] === '--width') args.width = Number(argv[(i += 1)]);
    else if (argv[i] === '--quality') args.quality = Number(argv[(i += 1)]);
    else throw new Error(`Unknown flag: ${argv[i]}`);
  }
  return args;
}

/** Pulls every photo id out of the data files without needing a TS loader. */
async function readPhotoIds() {
  const ids = [];

  for (const file of SOURCES) {
    const source = await readFile(file, 'utf8');

    const literalAfter = (marker, openChar, closeChar) => {
      const at = source.indexOf(`export const ${marker}`);
      if (at === -1) return null;
      const open = source.indexOf(openChar, at);
      // The literal ends at the first closing bracket in column 0, which is
      // the only place one can appear given the file is Prettier-formatted.
      const close = source.indexOf(`\n${closeChar};`, open);
      if (open === -1 || close === -1) throw new Error(`Could not bound ${marker}`);
      return new Function(`return ${source.slice(open, close + 2)};`)();
    };

    for (const marker of ['DISH_PHOTO_IDS', 'CUISINE_PHOTO_IDS']) {
      const table = literalAfter(marker, '{', '}');
      if (table) ids.push(...Object.values(table).flat());
    }
    const generic = literalAfter('GENERIC_PHOTO_IDS', '[', ']');
    if (generic) ids.push(...generic);
  }

  if (ids.length === 0) throw new Error('No photo ids found - did the data files move?');
  return [...new Set(ids)];
}

async function download(id, args) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${args.width}&q=${args.quality}&fm=jpg`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'toronto-eats/1.0 (+https://github.com/YheChen/RestaurantBlog)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`unexpected content-type "${type}"`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`suspiciously small (${bytes.length} bytes)`);

  await writeFile(path.join(OUT_DIR, `${id}.jpg`), bytes);
  return bytes.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = await readPhotoIds();
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`${ids.length} photos to check -> public/photos/cuisine/\n`);

  const local = [];
  const failed = [];
  let downloaded = 0;
  let totalBytes = 0;

  const CONCURRENCY = 6;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    await Promise.all(
      ids.slice(i, i + CONCURRENCY).map(async (id) => {
        const target = path.join(OUT_DIR, `${id}.jpg`);
        if (!args.force && existsSync(target)) {
          const { size } = await stat(target);
          totalBytes += size;
          local.push(id);
          return;
        }
        try {
          // Read `totalBytes` after the await: `totalBytes += await ...` would
          // capture a stale value and lose most updates at this concurrency.
          const size = await download(id, args);
          totalBytes += size;
          downloaded += 1;
          local.push(id);
          console.log(`  ok ${id}`);
        } catch (error) {
          failed.push({ id, reason: error.message });
          console.log(`  x  ${id} - ${error.message}`);
        }
      }),
    );
  }

  local.sort();
  await writeFile(MANIFEST, `${JSON.stringify(local, null, 2)}\n`, 'utf8');

  console.log(
    `\n${downloaded} downloaded, ${local.length - downloaded} already present, ` +
      `${failed.length} failed. ${(totalBytes / 1024 / 1024).toFixed(1)} MB on disk.`,
  );
  console.log(`Wrote ${MANIFEST}`);
  if (failed.length > 0) {
    console.log('\nStill hotlinking these (they are not in the manifest):');
    for (const item of failed) console.log(`  ${item.id} - ${item.reason}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
