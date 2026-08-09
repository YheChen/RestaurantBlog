'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { haversineKm, normalize } from '@/lib/utils';
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
 * Applies the active search query, cuisine, tag, and favourites filters, then
 * the active sort. Memoized so the derived list only recomputes when an input
 * changes.
 */
export function useFilteredRestaurants(): Restaurant[] {
  const restaurants = useAppStore((state) => state.restaurants);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeCuisines = useAppStore((state) => state.activeCuisines);
  const activeTags = useAppStore((state) => state.activeTags);
  const showFavoritesOnly = useAppStore((state) => state.showFavoritesOnly);
  const favorites = useAppStore((state) => state.favorites);
  const sortBy = useAppStore((state) => state.sortBy);
  const userLocation = useAppStore((state) => state.userLocation);

  return useMemo(() => {
    const query = normalize(searchQuery);
    const favoriteSet = new Set(favorites);

    const filtered = restaurants.filter((restaurant) => {
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

    if (sortBy === 'default') return filtered;

    const sorted = [...filtered];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
        break;
      case 'recent':
        sorted.sort((a, b) => (b.visitDate ?? '').localeCompare(a.visitDate ?? ''));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
        if (userLocation) {
          sorted.sort(
            (a, b) =>
              haversineKm(userLocation, { lat: a.latitude, lng: a.longitude }) -
              haversineKm(userLocation, { lat: b.latitude, lng: b.longitude }),
          );
        }
        break;
    }
    return sorted;
  }, [
    restaurants,
    searchQuery,
    activeCuisines,
    activeTags,
    showFavoritesOnly,
    favorites,
    sortBy,
    userLocation,
  ]);
}
