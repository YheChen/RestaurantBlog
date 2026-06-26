'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FLY_DURATION, FOCUS_PITCH, FOCUS_ZOOM } from '@/lib/constants';
import type { CameraTarget } from '@/types';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface FlyToOptions {
  /** Screen-space offset (px) applied to the target, e.g. to clear a popup. */
  offset?: [number, number];
}

/**
 * Returns a stable callback that smoothly flies the map camera to a target.
 * Never jumps instantly — always an eased ~1s animation.
 */
export function useFlyTo(): (target: CameraTarget, options?: FlyToOptions) => void {
  const map = useAppStore((state) => state.map);
  const mapMode = useAppStore((state) => state.mapMode);

  return useCallback(
    (target: CameraTarget, options?: FlyToOptions) => {
      if (!map) return;
      const flat = mapMode === '2d';
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: target.zoom ?? FOCUS_ZOOM,
        // Keep the camera flat in 2D so selecting a place never re-tilts the map.
        pitch: target.pitch ?? (flat ? 0 : FOCUS_PITCH),
        bearing: target.bearing ?? (flat ? 0 : map.getBearing()),
        offset: options?.offset,
        duration: FLY_DURATION,
        curve: 1.42,
        essential: true,
        easing: easeInOutCubic,
      });
    },
    [map, mapMode],
  );
}
