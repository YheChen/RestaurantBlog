'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `false` on the server and during the first client render, then `true`
 * after the component has mounted. Useful for gating client-only UI to avoid
 * hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
