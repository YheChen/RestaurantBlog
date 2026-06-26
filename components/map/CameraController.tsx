'use client';

import { useEffect, useRef } from 'react';
import { useFlyTo } from '@/hooks/useFlyTo';
import { useSelectedRestaurant } from '@/hooks/useFilteredRestaurants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAppStore } from '@/store/useAppStore';

/**
 * Watches the selection and smoothly flies the camera to the selected
 * restaurant, offsetting the target so the popup (right card / bottom sheet)
 * never obscures the marker. Keyed off `selectionTick` so re-selecting the same
 * place (e.g. after panning away) always recenters. Renders no DOM.
 */
export function CameraController() {
  const selected = useSelectedRestaurant();
  const selectionTick = useAppStore((state) => state.selectionTick);
  const flyTo = useFlyTo();
  const isMobile = useIsMobile();
  const lastFlownTick = useRef(0);

  useEffect(() => {
    if (!selected || selectionTick === lastFlownTick.current) return;
    lastFlownTick.current = selectionTick;

    const offset: [number, number] = isMobile ? [0, -150] : [-200, 0];
    flyTo({ longitude: selected.longitude, latitude: selected.latitude }, { offset });
  }, [selectionTick, selected, flyTo, isMobile]);

  return null;
}
