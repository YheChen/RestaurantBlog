'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

import { RatingStars } from '@/components/restaurant/RatingStars';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

export function SidebarItem({ restaurant }: { restaurant: Restaurant }) {
  const selectedId = useAppStore((s) => s.selectedId);
  const favorites = useAppStore((s) => s.favorites);
  const selectRestaurant = useAppStore((s) => s.selectRestaurant);
  const setHovered = useAppStore((s) => s.setHovered);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const isSelected = selectedId === restaurant.id;
  const isFavorite = favorites.includes(restaurant.id);

  const subtitle = [restaurant.cuisine, restaurant.neighbourhood].filter(Boolean).join(' · ');

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={() => setHovered(restaurant.id)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'group flex items-center gap-1 rounded-xl border border-transparent pr-2 transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent ring-1 ring-primary/40',
      )}
    >
      <button
        type="button"
        onClick={() => selectRestaurant(restaurant.id)}
        aria-current={isSelected ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{restaurant.name}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          <div className="mt-1">
            <RatingStars rating={restaurant.rating} size={12} showValue={false} />
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleFavorite(restaurant.id);
        }}
        aria-label={
          isFavorite
            ? `Remove ${restaurant.name} from favourites`
            : `Add ${restaurant.name} to favourites`
        }
        aria-pressed={isFavorite}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Heart
          className={cn('h-4 w-4 transition-colors', isFavorite && 'fill-current text-primary')}
          aria-hidden="true"
        />
      </button>
    </motion.div>
  );
}
