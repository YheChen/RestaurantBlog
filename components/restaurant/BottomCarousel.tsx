'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { CarouselCard } from '@/components/restaurant/CarouselCard';
import { cn } from '@/lib/utils';

const SCROLL_STEP = 320;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

/** Bottom-anchored, horizontally scrollable strip of filtered restaurants. */
export function BottomCarousel() {
  const restaurants = useFilteredRestaurants();
  const isMobile = useIsMobile();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const selectedId = useAppStore((state) => state.selectedId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Give the mobile bottom sheet room when a restaurant is selected.
  if (isMobile && selectedId !== null) return null;
  if (restaurants.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        'fixed bottom-5 z-20',
        isMobile
          ? 'inset-x-0'
          : sidebarOpen
            ? 'inset-x-0 pl-[344px] pr-6'
            : 'inset-x-0 px-6',
      )}
    >
      <div className={cn('relative flex items-center gap-2', !isMobile && 'mx-auto max-w-5xl')}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Scroll carousel left"
          onClick={() => scrollBy(-1)}
          className="glass-soft hidden h-10 w-10 shrink-0 rounded-full border border-border shadow-md md:flex"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <motion.div
          ref={scrollRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="no-scrollbar flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 py-2"
        >
          {restaurants.map((restaurant, index) => (
            <CarouselCard key={restaurant.id} restaurant={restaurant} index={index} />
          ))}
        </motion.div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Scroll carousel right"
          onClick={() => scrollBy(1)}
          className="glass-soft hidden h-10 w-10 shrink-0 rounded-full border border-border shadow-md md:flex"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
