'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { normalize } from '@/lib/utils';
import type { Restaurant } from '@/types';

/** Returns the restaurant currently selected, or null. */
export function useSelectedRestaurant(): Restaurant | null {
  const restaurants = useAppStore((state) => state.restaurants);
  const selectedId = useAppStore((state) => state.selectedId);
  return useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedId) ?? null,
    [restaurants, selectedId],
  );
}

/**
 * Applies the active search query, cuisine, tag, and favourites filters.
 * Memoized so the derived list is only recomputed when an input changes.
 */
export function useFilteredRestaurants(): Restaurant[] {
  const restaurants = useAppStore((state) => state.restaurants);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeCuisines = useAppStore((state) => state.activeCuisines);
  const activeTags = useAppStore((state) => state.activeTags);
  const showFavoritesOnly = useAppStore((state) => state.showFavoritesOnly);
  const favorites = useAppStore((state) => state.favorites);

  return useMemo(() => {
    const query = normalize(searchQuery);
    const favoriteSet = new Set(favorites);

    return restaurants.filter((restaurant) => {
      if (showFavoritesOnly && !favoriteSet.has(restaurant.id)) return false;

      if (activeCuisines.length > 0 && !activeCuisines.includes(restaurant.cuisine)) {
        return false;
      }

      if (activeTags.length > 0) {
        const tagSet = new Set(restaurant.tags ?? []);
        if (!activeTags.some((tag) => tagSet.has(tag))) return false;
      }

      if (query.length > 0) {
        const haystack = normalize(
          [
            restaurant.name,
            restaurant.cuisine,
            restaurant.neighbourhood ?? '',
            ...(restaurant.tags ?? []),
          ].join(' '),
        );
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [restaurants, searchQuery, activeCuisines, activeTags, showFavoritesOnly, favorites]);
}
