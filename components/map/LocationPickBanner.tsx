'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

/**
 * Top-center banner shown while the user is picking a location on the map.
 * Sits just below the search bar and offers a quick way to cancel picking.
 */
export function LocationPickBanner() {
  const pickingLocation = useAppStore((s) => s.pickingLocation);
  const setPickingLocation = useAppStore((s) => s.setPickingLocation);

  return (
    <AnimatePresence>
      {pickingLocation ? (
        <motion.div
          key="location-pick-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="glass-panel fixed left-1/2 top-20 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-lg"
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center justify-center text-primary"
          >
            <Crosshair className="size-4" aria-hidden="true" />
          </motion.span>
          <span className="text-sm font-medium">Tap the map to set the location</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cancel picking a location"
            onClick={() => setPickingLocation(false)}
            className="-mr-1 size-7 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
