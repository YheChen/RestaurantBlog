/**
 * Representative stock photography, one small set per cuisine.
 *
 * These are NOT photos of the restaurants themselves. They exist so every
 * card has something appetising before (or instead of) a real venue photo,
 * and they are always overridden by a real photo when one is available.
 * See `lib/restaurant-images.ts` for the precedence rules.
 *
 * Every id below was taken verbatim from a live Unsplash search page and
 * confirmed to resolve, rather than hand-written, because a wrong id renders
 * as a broken tile in production.
 *
 * Licence: the Unsplash Licence (https://unsplash.com/license) permits free
 * commercial and non-commercial use without attribution. Credit is shown
 * anyway, since the site credits every other photo it displays.
 */

import downloadedIds from './cuisine-photos-local.json';

/** Unsplash photo ids keyed by the `cuisine` values used in data/restaurants.ts. */
export const CUISINE_PHOTO_IDS: Record<string, readonly string[]> = {
  Japanese: [
    'photo-1591224803255-6cfbba886c2c',
    'photo-1602273660127-a0000560a4c1',
    'photo-1629684782790-385ed5adb497',
  ],
  Chinese: [
    'photo-1496116218417-1a781b1c416c',
    'photo-1589047133481-02b4a5327d89',
    'photo-1563245372-f21724e3856d',
  ],
  Café: [
    'photo-1485808191679-5f86510681a2',
    'photo-1507133750040-4a8f57021571',
    'photo-1529892485617-25f63cd7b1e9',
  ],
  Vietnamese: [
    'photo-1597345637412-9fd611e758f3',
    'photo-1582878826629-29b7ad1cdc43',
    'photo-1677837914128-2367031a11e7',
  ],
  Noodles: [
    'photo-1612929633738-8fe44f7ec841',
    'photo-1612927601601-6638404737ce',
    'photo-1627900440398-5db32dba8db1',
  ],
  'Hot Pot': [
    'photo-1614104030967-5ca61a54247b',
    'photo-1703945530505-2f06e3e1cf97',
    'photo-1682496178113-6275890f1fd7',
  ],
  Korean: [
    'photo-1661366394743-fe30fe478ef7',
    'photo-1632558610168-8377309e34c7',
    'photo-1744870132190-5c02d3f8d9f9',
  ],
  'Fast Food': [
    'photo-1518013431117-eb1465fa5752',
    'photo-1630431341973-02e1b662ec35',
    'photo-1615485290836-4ebcebf44aaf',
  ],
  'Middle Eastern': [
    'photo-1638537125835-82acb38d3531',
    'photo-1699728088614-7d1d4277414b',
    'photo-1530469912745-a215c6b256ea',
  ],
  Thai: [
    'photo-1637806930600-37fa8892069d',
    'photo-1637806931098-af30b519be53',
    'photo-1559314809-0d155014e29e',
  ],
  Pizza: [
    'photo-1513104890138-7c749659a591',
    'photo-1565299624946-b28f40a0ae38',
    'photo-1604382354936-07c5d9983bd3',
  ],
  Mexican: [
    'photo-1599974579688-8dbdd335c77f',
    'photo-1565299585323-38d6b0865b47',
    'photo-1551504734-5ee1c4a1479b',
  ],
  Italian: [
    'photo-1556761223-4c4282c73f77',
    'photo-1546549032-9571cd6b27df',
    'photo-1516100882582-96c3a05fe590',
  ],
  'Fried Chicken': [
    'photo-1569058242253-92a9c755a0ec',
    'photo-1562967916-eb82221dfb92',
    'photo-1638439430466-b2bb7fdc1d67',
  ],
  Burgers: [
    'photo-1568901346375-23c9450c58cd',
    'photo-1586190848861-99aa4a171e90',
    'photo-1572802419224-296b0aeee0d9',
  ],
  Seafood: [
    'photo-1655697253644-63c270874bb7',
    'photo-1585545335512-1e43f40d4999',
    'photo-1559814048-149b70765d47',
  ],
  'Food Truck': [
    'photo-1565123409695-7b5ef63a2efb',
    'photo-1570441262582-a2d4b9a916a5',
    'photo-1509315811345-672d83ef2fbc',
  ],
  Caribbean: [
    'photo-1632852576480-c10a8e19496a',
    'photo-1783173690380-92016b00bd82',
    'photo-1592415162645-c055a337b613',
  ],
  Canadian: [
    'photo-1541592106381-b31e9677c0e5',
    'photo-1639744210631-209fce3e256c',
    'photo-1684815495679-f6e6bc0634ec',
  ],
};

/** Used when a cuisine has no dedicated set (e.g. a place added in-app). */
export const GENERIC_PHOTO_IDS: readonly string[] = [
  'photo-1600891964599-f61ba0e24092',
  'photo-1544148103-0773bf10d330',
  'photo-1574966739987-65e38db0f7ce',
];

/** Ids present in public/photos/cuisine/, written by the download script. */
const localIds = new Set<string>(downloadedIds as string[]);

/** Remote Unsplash delivery URL, used when the photo has not been downloaded. */
export function unsplashUrl(id: string, width = 960): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;
}

/**
 * Where to load a cuisine photo from.
 *
 * Prefers the self-hosted copy in `public/`, so the site does not depend on a
 * third party staying up. Falls back to Unsplash when the photo has not been
 * downloaded, which keeps a fresh clone working before anyone runs
 * `npm run photos`.
 */
export function cuisinePhotoUrl(id: string, width = 960): string {
  return localIds.has(id) ? `/photos/cuisine/${id}.jpg` : unsplashUrl(id, width);
}
