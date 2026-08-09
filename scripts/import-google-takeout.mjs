#!/usr/bin/env node
/**
 * Converts a Google Takeout "Maps (your places)/Reviews.json" export into
 * this app's seed data file (data/restaurants.ts).
 *
 * Usage:
 *   node scripts/import-google-takeout.mjs "/path/to/Reviews.json"
 *
 * Rules applied:
 *   - Keeps reviews inside the Toronto/GTA bounding box only.
 *   - Skips entries without a name, coordinates, or a Google Maps URL.
 *   - Skips known non-food places (see EXCLUDED_NAMES).
 *   - Maps "Price per person" survey answers to $ buckets.
 *   - Best-guesses cuisine from the place name ('Unclassified' otherwise).
 *   - Adds meal/order type survey answers as tags.
 *   - Duplicate chain names (e.g. two McDonald's) get their street appended.
 *   - Rating-only reviews get a stub description.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Usage: node scripts/import-google-takeout.mjs "/path/to/Reviews.json"');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data', 'restaurants.ts');

// Rough GTA bounding box.
const inToronto = (lng, lat) => lat > 43.4 && lat < 44.0 && lng > -79.8 && lng < -79.0;

// Places reviewed on Google that are not food/drink venues.
const EXCLUDED_NAMES = [
  'Trapped Escape Rooms & Lounge Toronto',
  'College Street Dental',
  'Lotus Hair Salon',
  'Clutch Games',
  'EngSci Common Room',
  "Computer Science Student's Union",
];

/** Ordered rules: first match wins. Chains first so 'Taco Bell' != Mexican. */
const CUISINE_RULES = [
  [/mcdonald|burger king|taco bell|a&w|popeyes|subway|dairy queen|wendy/i, 'Fast Food'],
  [/tim hortons|starbucks|panera/i, 'Café'],
  [/bbq chicken|fried chicken|monga/i, 'Fried Chicken'],
  [/bingz/i, 'Chinese'],
  [/kingyo|shoten|ohiru/i, 'Japanese'],
  // Name-specific overrides confirmed by Chen.
  [/baroness/i, 'Café'],
  [/good brothers/i, 'Chinese'],
  [/mailo/i, 'Italian'],
  [/anh dao|saigon|pho|phở|banh|bánh|viet/i, 'Vietnamese'],
  [/thai/i, 'Thai'],
  [/sushi|ramen|izakaya|yakitori|japan|gyoza|omakase/i, 'Japanese'],
  [/korean|biwon|soban/i, 'Korean'],
  [/hot ?pot|malatang|麻辣烫|冒菜/i, 'Hot Pot'],
  [/jian bing|chang fen|dumpling|dim sum|house of gourmet|wok/i, 'Chinese'],
  [/taco|burrito|mexic/i, 'Mexican'],
  [/pasta|italian/i, 'Italian'],
  [/pizza|donair/i, 'Pizza'],
  [/shawarma|tahini|kebab|falafel/i, 'Middle Eastern'],
  [/jerk|caribbean/i, 'Caribbean'],
  [/poutine/i, 'Canadian'],
  [/lobster|seafood|fish/i, 'Seafood'],
  [/chip truck/i, 'Food Truck'],
  [/coffee|café|cafe|matcha|toroast|espresso|tea house/i, 'Café'],
  [/noodle/i, 'Noodles'],
  [/burger/i, 'Burgers'],
  // Any CJK characters left → very likely a Chinese spot in this dataset.
  [/[一-鿿]/, 'Chinese'],
];

const CC_BY_SA_4 = {
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
};
const CC_BY_2 = {
  license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
};

/**
 * Freely-licensed photographs from Wikimedia Commons, keyed by generated id.
 * Google's export carries no photos, so these are the handful of venues that
 * happen to have an openly-licensed picture. Every entry must keep its
 * attribution — the CC licences require visible credit.
 *
 * Note: Commons' thumbnailer 400s on the `800px-` bucket for these files;
 * `960px-` is verified to serve.
 */
const PHOTOS = {
  'house-of-gourmet': {
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/House_of_Gourmet_Seafood%2C_BBQ%2C_Noodle_Restaurant_in_Toronto_Chinatown.jpg/960px-House_of_Gourmet_Seafood%2C_BBQ%2C_Noodle_Restaurant_in_Toronto_Chinatown.jpg',
    credit: {
      author: 'atallasianguy',
      ...CC_BY_SA_4,
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:House_of_Gourmet_Seafood,_BBQ,_Noodle_Restaurant_in_Toronto_Chinatown.jpg',
    },
  },
  'banh-mi-nguyen-huong': {
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Chinatown_in_Toronto%2C_October_11_2025_%2802%29.jpg/960px-Chinatown_in_Toronto%2C_October_11_2025_%2802%29.jpg',
    credit: {
      author: 'Dillan Payne',
      ...CC_BY_SA_4,
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Chinatown_in_Toronto,_October_11_2025_(02).jpg',
    },
  },
  'juicy-dumpling': {
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Juicy_Dumpling_on_Dundas_in_Toronto%2C_October_11_2025.jpg/960px-Juicy_Dumpling_on_Dundas_in_Toronto%2C_October_11_2025.jpg',
    credit: {
      author: 'Dillan Payne',
      ...CC_BY_SA_4,
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Juicy_Dumpling_on_Dundas_in_Toronto,_October_11_2025.jpg',
    },
  },
  'smoke-s-poutinerie-spadina': {
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Smoke%27s_Poutinerie_Spadina_and_College_2022.jpg/960px-Smoke%27s_Poutinerie_Spadina_and_College_2022.jpg',
    credit: {
      author: 'Xander Wu',
      ...CC_BY_SA_4,
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Smoke's_Poutinerie_Spadina_and_College_2022.jpg",
    },
  },
  'the-burgernator': {
    // Already 662x1000, so the original is served directly.
    image:
      'https://upload.wikimedia.org/wikipedia/commons/2/28/The_Burgernator_in_Toronto%27s_Kensington_Market_%289027087953%29.jpg',
    credit: {
      author: 'Jason Baker',
      ...CC_BY_2,
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:The_Burgernator_in_Toronto's_Kensington_Market_(9027087953).jpg",
    },
  },
};

function guessCuisine(name) {
  for (const [pattern, cuisine] of CUISINE_RULES) {
    if (pattern.test(name)) return cuisine;
  }
  return 'Unclassified';
}

function mapPrice(option) {
  const match = option?.match(/\$(\d+)[^\d]+(\d+)/);
  if (!match) return undefined;
  const upper = Number(match[2]);
  if (upper <= 10) return '$';
  if (upper <= 20) return '$$';
  if (upper <= 30) return '$$$';
  return '$$$$';
}

const strip = (value) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function slugify(value) {
  return strip(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Street portion of "252 Spadina Ave., Toronto, ON ..." → "Spadina Ave". */
function streetOf(address) {
  const first = (address ?? '').split(',')[0] ?? '';
  return first
    .replace(/^[\d\s-]+/, '')
    .replace(/\.+$/, '')
    .trim();
}

/**
 * Derives a Toronto neighbourhood from a street address. Google's export has no
 * neighbourhood field, but the addresses are precise enough to place each spot:
 * rules are `[street matcher, [minNumber, maxNumber] | null, neighbourhood]`,
 * first match wins. Ranges follow the usual downtown boundaries (Spadina splits
 * the College strip; Bathurst is Kensington's western edge; etc.).
 */
const NEIGHBOURHOOD_RULES = [
  [/spadina/, [250, 445], 'Chinatown'],
  [/spadina/, [446, 600], 'University of Toronto'],
  [/dundas/, [400, 560], 'Chinatown'],
  [/dundas/, [1, 399], 'Downtown Yonge'],
  [/college/, [1, 199], 'Discovery District'],
  [/college/, [200, 295], 'University of Toronto'],
  [/college/, [296, 420], 'Kensington Market'],
  [/kensington|augusta/, null, 'Kensington Market'],
  [/baldwin/, null, 'Baldwin Village'],
  [/harbord/, null, 'Harbord Village'],
  [/huron|st george|saint george/, null, 'University of Toronto'],
  [/university ave/, null, 'Discovery District'],
  [/mccaul/, null, 'Grange Park'],
  [/bloor/, [1, 400], 'The Annex'],
  [/bloor/, [401, 900], 'Koreatown'],
  [/yonge/, [1, 400], 'Downtown Yonge'],
  [/yonge/, [401, 900], 'Yonge & Bloor'],
  [/elm st/, null, 'Downtown Yonge'],
  [/wellesley/, null, 'Church-Wellesley'],
  [/winchester/, null, 'Cabbagetown'],
  [/bay st/, null, 'Bay Street Corridor'],
  [/queen st w|queen street w/, null, 'Queen West'],
  [/front st w|front street w/, null, 'CityPlace'],
  [/bremner/, null, 'Entertainment District'],
  [/eglinton/, null, 'Yonge & Eglinton'],
];

function deriveNeighbourhood(address) {
  const first = (address ?? '').split(',')[0] ?? '';
  // Handles "478Dundas Street West" (missing space) and "455 A Spadina Ave.".
  const number = Number((first.match(/\d+/) ?? [])[0]);
  const street = strip(first).replace(/[^a-z ]+/g, ' ');
  for (const [matcher, range, neighbourhood] of NEIGHBOURHOOD_RULES) {
    if (!matcher.test(street)) continue;
    if (range && (!Number.isFinite(number) || number < range[0] || number > range[1])) continue;
    return neighbourhood;
  }
  return undefined;
}

const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const features = raw.features ?? [];

const skipped = { outside: 0, invalid: 0, excluded: [] };
const kept = [];

for (const feature of features) {
  const p = feature.properties ?? {};
  const loc = p.location ?? {};
  const [lng, lat] = feature.geometry?.coordinates ?? [];
  const name = (loc.name ?? '').trim();

  if (!name || typeof lng !== 'number' || typeof lat !== 'number' || !p.google_maps_url) {
    skipped.invalid += 1;
    continue;
  }
  if (!inToronto(lng, lat)) {
    skipped.outside += 1;
    continue;
  }
  if (EXCLUDED_NAMES.some((excluded) => name.startsWith(excluded))) {
    skipped.excluded.push(name);
    continue;
  }

  const questions = p.questions ?? [];
  const q = (label) => questions.find((item) => item.question === label);

  const tags = [];
  const meal = q('Meal type')?.selected_option;
  if (meal && meal !== 'Other') tags.push(meal.toLowerCase());
  const order = q('Order type')?.selected_option;
  if (order) tags.push(order.toLowerCase());

  const rating = p.five_star_rating_published;
  const text = (p.review_text_published ?? '').trim();

  kept.push({
    name,
    latitude: lat,
    longitude: lng,
    reviewUrl: p.google_maps_url,
    description: text || `Rated ${rating ?? '?'}★ on Google — no written review yet.`,
    cuisine: guessCuisine(name),
    rating: typeof rating === 'number' ? rating : undefined,
    visitDate: (p.date ?? '').slice(0, 10) || undefined,
    tags: tags.length > 0 ? tags : undefined,
    priceRange: mapPrice(q('Price per person')?.selected_option),
    neighbourhood: deriveNeighbourhood(loc.address),
    address: loc.address ?? '',
  });
}

// Disambiguate duplicate names (chains) by appending the street.
const nameCounts = new Map();
for (const place of kept) {
  nameCounts.set(place.name, (nameCounts.get(place.name) ?? 0) + 1);
}
for (const place of kept) {
  if ((nameCounts.get(place.name) ?? 0) > 1) {
    const street = streetOf(place.address);
    if (street) place.name = `${place.name} (${street})`;
  }
}

// Unique ids; fall back to the street for names that slugify to nothing (CJK).
const taken = new Set();
for (const place of kept) {
  let base = slugify(place.name) || slugify(streetOf(place.address)) || 'place';
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  taken.add(id);
  place.id = id;

  const photo = PHOTOS[id];
  if (photo) {
    place.image = photo.image;
    place.imageCredit = photo.credit;
  }
}

const photographed = kept.filter((place) => place.image).length;
if (photographed !== Object.keys(PHOTOS).length) {
  console.warn(
    `WARNING: ${Object.keys(PHOTOS).length} photos defined but ${photographed} matched — an id in PHOTOS may be stale.`,
  );
}

const entries = kept.map((place) => {
  const fields = [
    `    id: ${JSON.stringify(place.id)},`,
    `    name: ${JSON.stringify(place.name)},`,
    `    latitude: ${place.latitude},`,
    `    longitude: ${place.longitude},`,
    `    reviewUrl: ${JSON.stringify(place.reviewUrl)},`,
    `    cuisine: ${JSON.stringify(place.cuisine)},`,
  ];
  if (place.neighbourhood)
    fields.push(`    neighbourhood: ${JSON.stringify(place.neighbourhood)},`);
  if (place.priceRange) fields.push(`    priceRange: ${JSON.stringify(place.priceRange)},`);
  if (typeof place.rating === 'number') fields.push(`    rating: ${place.rating},`);
  if (place.visitDate) fields.push(`    visitDate: ${JSON.stringify(place.visitDate)},`);
  if (place.tags) fields.push(`    tags: ${JSON.stringify(place.tags)},`);
  if (place.image) fields.push(`    image: ${JSON.stringify(place.image)},`);
  if (place.imageCredit) {
    fields.push(`    imageCredit: ${JSON.stringify(place.imageCredit)},`);
  }
  fields.push(`    description: ${JSON.stringify(place.description)},`);
  return `  {\n${fields.join('\n')}\n  },`;
});

const file = `import type { Restaurant } from '@/types';

/**
 * Chen's real Google Maps reviews, imported from a Google Takeout export via
 * \`scripts/import-google-takeout.mjs\`. Toronto food & drink places only.
 * Regenerate with:
 *   node scripts/import-google-takeout.mjs "/path/to/Reviews.json"
 */
export const restaurants: Restaurant[] = [
${entries.join('\n')}
];

/** Sorted, de-duplicated list of cuisines used to build the cuisine filter. */
export const cuisines: string[] = Array.from(
  new Set(restaurants.map((restaurant) => restaurant.cuisine)),
).sort((a, b) => a.localeCompare(b));

/** Sorted, de-duplicated list of tags used to build the tag filter. */
export const tags: string[] = Array.from(
  new Set(restaurants.flatMap((restaurant) => restaurant.tags ?? [])),
).sort((a, b) => a.localeCompare(b));
`;

fs.writeFileSync(OUTPUT, file);

console.log(`Wrote ${kept.length} places to ${path.relative(ROOT, OUTPUT)}`);
console.log(`Skipped: ${skipped.outside} outside Toronto, ${skipped.invalid} invalid entries`);
console.log(`Excluded non-food (${skipped.excluded.length}): ${skipped.excluded.join(' | ')}`);
const byCuisine = new Map();
for (const place of kept) byCuisine.set(place.cuisine, (byCuisine.get(place.cuisine) ?? 0) + 1);
console.log(
  'Cuisines:',
  [...byCuisine.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cuisine, count]) => `${cuisine} ${count}`)
    .join(', '),
);

const byHood = new Map();
for (const place of kept) {
  const key = place.neighbourhood ?? '(none)';
  byHood.set(key, (byHood.get(key) ?? 0) + 1);
}
console.log(
  'Neighbourhoods:',
  [...byHood.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hood, count]) => `${hood} ${count}`)
    .join(', '),
);
const missing = kept.filter((place) => !place.neighbourhood);
if (missing.length > 0) {
  console.log('NO NEIGHBOURHOOD:', missing.map((m) => `${m.name} @ ${m.address}`).join(' | '));
}
