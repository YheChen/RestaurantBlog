'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { MapMode } from '@/types';

const MODES: { value: MapMode; label: string }[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

/** Segmented control switching the map between a flat 2D and pitched 3D view. */
export function MapModeToggle() {
  const mapMode = useAppStore((state) => state.mapMode);
  const setMapMode = useAppStore((state) => state.setMapMode);

  return (
    <div
      role="group"
      aria-label="Map view mode"
      className="flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5 text-xs font-semibold"
    >
      {MODES.map((mode) => {
        const active = mapMode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setMapMode(mode.value)}
            aria-pressed={active}
            aria-label={`${mode.label} map view`}
            className={cn(
              'relative rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="map-mode-pill"
                className="absolute inset-0 -z-[1] rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
