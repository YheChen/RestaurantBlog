import { z } from 'zod';

/**
 * Canonical shape for a restaurant the author has visited.
 * `cuisine` and `priceRange` extend the base brief because the carousel and
 * filtering UI depend on them; every other field matches the project spec.
 */
export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  reviewUrl: string;
  description: string;
  cuisine: string;
  rating?: number;
  visitDate?: string;
  tags?: string[];
  image?: string;
  priceRange?: PriceRange;
  neighbourhood?: string;
}

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export const priceRangeSchema = z.enum(['$', '$$', '$$$', '$$$$']);

/**
 * Runtime validation schema. Used to validate imported JSON so a malformed
 * file can never corrupt application state.
 */
export const restaurantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  reviewUrl: z.string().url(),
  description: z.string().min(1),
  cuisine: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  visitDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  priceRange: priceRangeSchema.optional(),
  neighbourhood: z.string().optional(),
});

export const restaurantArraySchema = z.array(restaurantSchema);

export type RestaurantInput = z.infer<typeof restaurantSchema>;
