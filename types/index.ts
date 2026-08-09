export type { Restaurant, PriceRange, ImageCredit, RestaurantInput } from './restaurant';
export { restaurantSchema, restaurantArraySchema, priceRangeSchema } from './restaurant';

export type Theme = 'dark' | 'light';

/** Whether the map renders as a flat 2D street map or a pitched 3D city. */
export type MapMode = '2d' | '3d';

/** Ordering applied to the browsable restaurant list. */
export type SortOption = 'default' | 'rating' | 'recent' | 'name' | 'distance';

/** A geographic point ({ lat, lng }). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Camera destination passed to MapLibre's `flyTo`. */
export interface CameraTarget {
  longitude: number;
  latitude: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}
