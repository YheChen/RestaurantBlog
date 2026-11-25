'use client';

import { useEffect } from 'react';

import { OWNER_KEY, OWNER_PARAM } from '@/lib/owner';
import { useAppStore } from '@/store/useAppStore';

/**
 * Reads `?owner=<key>` once on mount and flips owner mode on (matching key) or
 * off (anything else). Owner mode persists, so the param is only needed once
 * per browser.
 *
 * The param is stripped from the URL afterwards so it never rides along in a
 * copied "Share" link. Call this before `useDeepLink` so the rewrite happens
 * before the selection sync reads the query string.
 *
 * SSR-safe: all `window` access happens inside the effect.
 */
export function useOwnerMode(): void {
  const setOwner = useAppStore((s) => s.setOwner);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(OWNER_PARAM);
    if (value === null) return;

    setOwner(value === OWNER_KEY);

    params.delete(OWNER_PARAM);
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [setOwner]);
}
