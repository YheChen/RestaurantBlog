'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LocateFixed, Loader2, Plus, Shuffle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

/**
 * Floating, bottom-right stack of map action buttons: pick a random place,
 * locate the user, and add a new place. Hidden on mobile while a place is
 * selected so it never covers the bottom sheet.
 */
export function MapActions() {
  const selectedId = useAppStore((s) => s.selectedId);
  const selectRestaurant = useAppStore((s) => s.selectRestaurant);
  const openAddPanel = useAppStore((s) => s.openAddPanel);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setSortBy = useAppStore((s) => s.setSortBy);

  const restaurants = useFilteredRestaurants();
  const isMobile = useIsMobile();

  const [locating, setLocating] = useState(false);

  // Keep the map clear on small screens once the bottom sheet is up.
  if (isMobile && selectedId) return null;

  const handleSurprise = () => {
    if (restaurants.length === 0) return;
    const random = restaurants[Math.floor(Math.random() * restaurants.length)];
    selectRestaurant(random.id);
  };

  const handleLocate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setSortBy('distance');
        const map = useAppStore.getState().map;
        if (map) {
          map.flyTo({ center: [loc.lng, loc.lat], zoom: 13.5, essential: true });
        }
        setLocating(false);
      },
      () => {
        // Permission denied or position unavailable — just re-enable the button.
        setLocating(false);
      },
    );
  };

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12, scale: 0.85 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={cn(
          'fixed right-4 z-30 flex flex-col items-center gap-2',
          'bottom-24 md:bottom-6 md:right-6',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div variants={item} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Surprise me with a random place"
                onClick={handleSurprise}
                disabled={restaurants.length === 0}
                className="glass-soft h-11 w-11 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Shuffle className="size-5" aria-hidden="true" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">Surprise me</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div variants={item} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Find places near me"
                onClick={handleLocate}
                disabled={locating}
                className="glass-soft h-11 w-11 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {locating ? (
                    <motion.span
                      key="spinner"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="locate"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                    >
                      <LocateFixed className="size-5" aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">
            {locating ? 'Locating…' : 'Find places near me'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div variants={item} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <Button
                variant="default"
                size="icon"
                aria-label="Add a place"
                onClick={openAddPanel}
                className="h-12 w-12 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Plus className="size-5" aria-hidden="true" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">Add a place</TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
