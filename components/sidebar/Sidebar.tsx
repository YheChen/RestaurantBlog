'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarItem } from '@/components/sidebar/SidebarItem';
import { SortControl } from '@/components/sidebar/SortControl';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAppStore } from '@/store/useAppStore';
import type { Restaurant } from '@/types';

function SidebarHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1 px-4 pb-3 pt-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">Where I&apos;ve Eaten</h2>
        <Badge variant="secondary" className="tabular-nums">
          {count}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">Chen&apos;s picks · downtown Toronto</p>
    </div>
  );
}

function HeaderActions() {
  const openAddPanel = useAppStore((s) => s.openAddPanel);
  return (
    <div className="flex items-center justify-between gap-2 px-3 pb-2">
      <SortControl />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-primary hover:text-primary"
        onClick={openAddPanel}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add
      </Button>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-muted-foreground">No places match your filters</p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

function RestaurantList({
  restaurants,
  onClear,
}: {
  restaurants: Restaurant[];
  onClear: () => void;
}) {
  if (restaurants.length === 0) {
    return <EmptyState onClear={onClear} />;
  }

  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col gap-1 px-2 pb-4">
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
            <SidebarItem restaurant={restaurant} />
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function Sidebar() {
  const restaurants = useFilteredRestaurants();
  const isMobile = useIsMobile();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const clearFilters = useAppStore((s) => s.clearFilters);

  // Open the sidebar by default on desktop only (it animates in); on mobile it
  // stays closed so the drawer never covers the map on first load.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (window.matchMedia('(min-width: 768px)').matches) {
      setSidebarOpen(true);
    }
  }, [setSidebarOpen]);

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="flex w-[88vw] flex-col gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="p-0">
            <div className="flex flex-col gap-1 px-4 pb-3 pt-4">
              <div className="flex items-center gap-2">
                <SheetTitle>Where I&apos;ve Eaten</SheetTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {restaurants.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Chen&apos;s picks · downtown Toronto</p>
            </div>
          </SheetHeader>
          <HeaderActions />
          <div className="min-h-0 flex-1">
            <RestaurantList restaurants={restaurants} onClear={clearFilters} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          key="sidebar"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          aria-label="All places"
          className="glass-panel fixed bottom-[150px] left-6 top-[88px] z-30 flex w-80 flex-col overflow-hidden rounded-2xl border border-border shadow-xl"
        >
          <SidebarHeader count={restaurants.length} />
          <HeaderActions />
          <div className="min-h-0 flex-1">
            <RestaurantList restaurants={restaurants} onClear={clearFilters} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
