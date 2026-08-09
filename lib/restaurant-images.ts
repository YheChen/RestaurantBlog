import { CUISINE_PHOTO_IDS, GENERIC_PHOTO_IDS, cuisinePhotoUrl } from '@/data/cuisine-photos';
import { DISH_PHOTO_IDS, RESTAURANT_DISHES } from '@/data/dish-photos';
import type { ImageCredit, Restaurant } from '@/types';

export interface ResolvedPhotos {
  /** Cover first. Empty only if a restaurant somehow resolves to nothing. */
  images: string[];
  credit?: ImageCredit;
  /** True when these are representative cuisine photos, not the venue itself. */
  isStock: boolean;
}

const UNSPLASH_CREDIT: ImageCredit = {
  author: 'Unsplash',
  license: 'Unsplash Licence',
  licenseUrl: 'https://unsplash.com/license',
  sourceUrl: 'https://unsplash.com',
};

/** Stable string hash so a given restaurant always gets the same stock photo. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Decides which photos to show for a restaurant.
 *
 * Precedence: an explicit gallery, then a single explicit photo, then a
 * photo of the dish the place is known for, then one for its cuisine. Hand-added venue photos therefore always win over stock, and the UI never has to special-case a missing image.
 */
export function resolveRestaurantPhotos(restaurant: Restaurant): ResolvedPhotos {
  if (restaurant.images && restaurant.images.length > 0) {
    return { images: restaurant.images, credit: restaurant.imageCredit, isStock: false };
  }
  if (restaurant.image) {
    return { images: [restaurant.image], credit: restaurant.imageCredit, isStock: false };
  }

  // Dish beats cuisine: a pho place should show pho, not "Vietnamese food".
  const dish = RESTAURANT_DISHES[restaurant.id];
  const pool =
    (dish ? DISH_PHOTO_IDS[dish] : undefined) ??
    CUISINE_PHOTO_IDS[restaurant.cuisine] ??
    GENERIC_PHOTO_IDS;
  const id = pool[hashString(restaurant.id) % pool.length];
  return { images: [cuisinePhotoUrl(id)], credit: UNSPLASH_CREDIT, isStock: true };
}

/** Convenience wrapper for the places that only need a cover image. */
export function resolveCoverImage(restaurant: Restaurant): string | undefined {
  return resolveRestaurantPhotos(restaurant).images[0];
}
