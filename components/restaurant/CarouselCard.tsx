'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { RestaurantImage } from '@/components/restaurant/RestaurantImage';
import { RatingStars } from '@/components/restaurant/RatingStars';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

interface CarouselCardProps {
  restaurant: Restaurant;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/** A single glassy restaurant card inside the bottom carousel. */
export function CarouselCard({ restaurant, index }: CarouselCardProps) {
  const selectedId = useAppStore((state) => state.selectedId);
  const selectRestaurant = useAppStore((state) => state.selectRestaurant);
  const setHovered = useAppStore((state) => state.setHovered);

  const isSelected = selectedId === restaurant.id;

  // If this card unmounts while hovered (e.g. filtered out), release the hover
  // so a now-hidden marker is not left highlighted.
  useEffect(
    () => () => {
      const store = useAppStore.getState();
      if (store.hoveredId === restaurant.id) store.setHovered(null);
    },
    [restaurant.id],
  );

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => selectRestaurant(restaurant.id)}
      onMouseEnter={() => setHovered(restaurant.id)}
      onMouseLeave={() => setHovered(null)}
      aria-label={`View ${restaurant.name}`}
      aria-pressed={isSelected}
      className={cn(
        'glass-panel group w-60 shrink-0 snap-start overflow-hidden rounded-2xl text-left',
        'border border-border shadow-lg shadow-black/20 transition-shadow',
        'hover:shadow-xl hover:shadow-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      <RestaurantImage
        src={restaurant.image}
        alt={restaurant.name}
        className="h-28 w-full"
        sizes="240px"
      />
      <div className="space-y-1 p-3">
        <h3 className="truncate font-semibold leading-tight">{restaurant.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{restaurant.cuisine}</p>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <RatingStars rating={restaurant.rating} size={12} />
          {restaurant.priceRange && (
            <span className="text-xs font-medium text-muted-foreground">
              {restaurant.priceRange}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
