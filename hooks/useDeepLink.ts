'use client';

import { useEffect } from 'react';

import { useAppStore } from '@/store/useAppStore';

const PLACE_PARAM = 'place';

/**
 * Syncs the selected restaurant with the `?place=<id>` URL query param using
 * the History API only (no external router). Call once, e.g. from the page.
 *
 * - On mount: if `?place=<id>` matches a known restaurant, selects it.
 * - Whenever the selection changes: reflects it in the URL via
 *   `history.replaceState` (never pushes a new history entry).
 *
 * SSR-safe: all `window` access is guarded.
 */
export function useDeepLink(): void {
  const selectedId = useAppStore((s) => s.selectedId);

  // On mount: adopt the selection from the URL, if valid.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const placeId = new URLSearchParams(window.location.search).get(PLACE_PARAM);
    if (!placeId) return;

    const { restaurants, selectRestaurant } = useAppStore.getState();
    if (restaurants.some((restaurant) => restaurant.id === placeId)) {
      selectRestaurant(placeId);
    }
  }, []);

  // Keep the URL in sync with the current selection.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    if (selectedId) {
      params.set(PLACE_PARAM, selectedId);
    } else {
      params.delete(PLACE_PARAM);
    }

    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(window.history.state, '', url);
  }, [selectedId]);
}
