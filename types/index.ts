export type { Restaurant, PriceRange, RestaurantInput } from './restaurant';
export {
  restaurantSchema,
  restaurantArraySchema,
  priceRangeSchema,
} from './restaurant';

export type Theme = 'dark' | 'light';

/** Whether the map renders as a flat 2D street map or a pitched 3D city. */
export type MapMode = '2d' | '3d';

/** Camera destination passed to MapLibre's `flyTo`. */
export interface CameraTarget {
  longitude: number;
  latitude: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}
