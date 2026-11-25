#!/usr/bin/env node
/**
 * Vendors the real venue photos (Wikimedia Commons) into `public/photos/venue/`.
 *
 * These five used to be hotlinked straight to upload.wikimedia.org. Wikimedia
 * rate-limits, so `/_next/image` fetches intermittently came back 429 and the
 * card fell back to its gradient placeholder — the one tier of photo the app
 * cannot substitute, since a venue photo has no stand-in.
 *
 * Reads the URLs out of `data/restaurants.ts` rather than keeping a second
 * copy, so this stays correct if a photo is swapped. Writes
 * `public/photos/venue/<restaurant-id>.jpg`.
 *
 *   node scripts/download-venue-photos.mjs [--force] [--width 960]
 *
 * Commons only serves thumbnails at a fixed set of widths and answers 400 for
 * anything else, so --width is not free-form: 500, 960 and 1280 are verified to
 * work, while 640, 800, 900 and 1024 are rejected. 960 is the default because
 * it is what the upstream URLs already used.
 *
 * Re-running skips files already on disk unless --force is passed. The CC
 * attribution in `imageCredit` is unaffected and must stay: these are licensed
 * works, and vendoring a copy does not change that.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat, unlink } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'restaurants.ts');
const OUT_DIR = path.join(ROOT, 'public', 'photos', 'venue');

// Wikimedia asks automated clients to identify themselves; keep it generic.
const USER_AGENT = 'TorontoEatsVenuePhotoFetch/1.0 (local build script; low volume)';

/** A width Commons actually serves — see the note in the header comment. */
const DEFAULT_WIDTH = 960;

/** Commons rate-limits briskly; retry 429s rather than failing the run. */
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2000;
const BETWEEN_REQUESTS_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { force: false, width: DEFAULT_WIDTH };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--force') args.force = true;
    else if (argv[i] === '--width') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 100 || value > 4000) {
        throw new Error(`--width must be an integer between 100 and 4000, got "${argv[i + 1]}"`);
      }
      args.width = value;
      i += 1;
    }
  }
  return args;
}

/**
 * Pulls `{ id, url }` for every restaurant whose `image` points at Wikimedia or
 * at an already-vendored venue file. Deliberately a regex over the source: the
 * data file is plain literals, and this avoids a TS build step in a script.
 */
async function readVenuePhotos() {
  const source = await readFile(DATA_FILE, 'utf8');
  const entries = [];
  // Each record opens with `id: '<id>',`; the image follows within that record.
  const recordRe = /id:\s*'([^']+)',[\s\S]*?(?=\n {4}id:\s*'|$)/g;
  for (const [record, id] of source.matchAll(recordRe)) {
    const image = record.match(/\n\s*image:\s*\n?\s*'([^']+)'/);
    if (!image) continue;
    const url = image[1];
    if (!url.includes('upload.wikimedia.org') && !url.startsWith('/photos/venue/')) continue;
    entries.push({ id, url });
  }
  return entries;
}

/**
 * Normalises a Commons URL to a thumbnail of the requested width.
 *
 * Commons serves originals at `/commons/<a>/<ab>/<File>` and thumbnails at
 * `/commons/thumb/<a>/<ab>/<File>/<width>px-<File>`, so an original has to be
 * rewritten into the thumb form to avoid pulling a multi-megabyte source file.
 */
function thumbUrl(url, width) {
  const parsed = new URL(url);
  const thumb = parsed.pathname.match(/^\/wikipedia\/commons\/thumb\/(.+)\/\d+px-([^/]+)$/);
  if (thumb) {
    parsed.pathname = `/wikipedia/commons/thumb/${thumb[1]}/${width}px-${thumb[2]}`;
    return parsed.toString();
  }
  const original = parsed.pathname.match(/^\/wikipedia\/commons\/([^/]+\/[^/]+)\/([^/]+)$/);
  if (original) {
    parsed.pathname = `/wikipedia/commons/thumb/${original[1]}/${original[2]}/${width}px-${original[2]}`;
    return parsed.toString();
  }
  throw new Error(`Unrecognised Commons URL shape: ${url}`);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * One fetch attempt. Returns the response, or null to signal "retry me": a 429
 * or 5xx, which on Commons is transient and the whole reason this script
 * exists.
 */
async function attempt(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (response.status === 400) {
    throw new Error(
      `HTTP 400 — Commons rejected this thumbnail width. It serves only certain sizes; ` +
        `500, 960 and 1280 are known to work.`,
    );
  }
  if (response.status === 429 || response.status >= 500) {
    // Prefer the server's own pacing when it offers one.
    const retryAfter = Number(response.headers.get('retry-after'));
    return { retryAfterMs: Number.isFinite(retryAfter) ? retryAfter * 1000 : null, response: null };
  }
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return { retryAfterMs: null, response };
}

async function download(url, dest) {
  let response = null;
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const result = await attempt(url);
    if (result.response) {
      response = result.response;
      break;
    }
    if (i === MAX_ATTEMPTS - 1) {
      throw new Error(`rate-limited by Commons after ${MAX_ATTEMPTS} attempts`);
    }
    const wait = result.retryAfterMs ?? BASE_BACKOFF_MS * 2 ** i;
    console.log(`      rate-limited, retrying in ${(wait / 1000).toFixed(0)}s…`);
    await sleep(wait);
  }
  if (!response || !response.body) throw new Error('no response body');
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`expected an image, got "${type}"`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
  } catch (error) {
    // Never leave a truncated file behind for the next run to treat as done.
    await unlink(dest).catch(() => {});
    throw error;
  }
  return (await stat(dest)).size;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const entries = await readVenuePhotos();

  if (entries.length === 0) {
    console.error('No venue photos found in data/restaurants.ts — has the `image:` shape changed?');
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(
    `Vendoring ${entries.length} venue photo(s) at ${args.width}px into public/photos/venue/\n`,
  );

  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  for (const { id, url } of entries) {
    const dest = path.join(OUT_DIR, `${id}.jpg`);

    if (!args.force && (await exists(dest))) {
      console.log(`  = ${id}.jpg (already present)`);
      skipped += 1;
      continue;
    }

    if (url.startsWith('/photos/venue/')) {
      // Already rewritten to a local path and the file is gone: we no longer
      // know the upstream URL, so say so rather than silently skipping.
      failures.push({
        id,
        reason: 'local path in data but file missing; restore from git history',
      });
      console.log(`  ! ${id}.jpg — local path in data but file missing`);
      continue;
    }

    try {
      const bytes = await download(thumbUrl(url, args.width), dest);
      console.log(`  + ${id}.jpg (${(bytes / 1024).toFixed(0)} KB)`);
      downloaded += 1;
    } catch (error) {
      failures.push({ id, reason: error.message });
      console.log(`  ! ${id}.jpg — ${error.message}`);
    }
    // Be a polite Commons client.
    await sleep(BETWEEN_REQUESTS_MS);
  }

  console.log(`\n${downloaded} downloaded, ${skipped} already present, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.error('\nFailed:');
    for (const { id, reason } of failures) console.error(`  ${id}: ${reason}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
