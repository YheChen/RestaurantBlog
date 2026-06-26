'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Utensils } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar/SidebarToggle';
import { useAppStore } from '@/store/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Top-left brand lockup. The logo doubles as an "about" affordance that opens a
 * dialog framing this as Chen's personal, visited-and-reviewed collection —
 * not a generic restaurant finder.
 */
export function Brand() {
  const restaurants = useAppStore((state) => state.restaurants);
  const cuisineCount = useMemo(
    () => new Set(restaurants.map((restaurant) => restaurant.cuisine)).size,
    [restaurants],
  );

  return (
    <div className="flex items-center gap-2">
      <SidebarToggle />
      <Dialog>
        <DialogTrigger asChild>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            aria-label="About Chen's Toronto Eats"
            className="glass-panel flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left shadow-lg transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-3"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.55)]">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold tracking-tight">
                Chen&apos;s Toronto Eats
              </span>
              <span className="block text-[10px] text-muted-foreground">
                a personal map of where I&apos;ve eaten
              </span>
            </span>
          </motion.button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.5)]">
                <Utensils className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg">Chen&apos;s Toronto Eats</DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-sm leading-relaxed">
              Hi — I&apos;m Chen. This isn&apos;t a restaurant finder or a directory. It&apos;s my
              personal, ever-growing map of the places I&apos;ve <em>actually</em> eaten across
              downtown Toronto.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Every glowing pin is somewhere I&apos;ve been. Tap one to read my own review, rating, and
            notes — then wander the city in 3D, or flip to a flat 2D map.
          </p>

          <div className="mt-1 flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="text-sm">
              <span className="text-lg font-semibold tabular-nums">{restaurants.length}</span>{' '}
              <span className="text-muted-foreground">spots visited</span>
            </div>
            <span className="h-6 w-px bg-border" aria-hidden="true" />
            <div className="text-sm">
              <span className="text-lg font-semibold tabular-nums">{cuisineCount}</span>{' '}
              <span className="text-muted-foreground">cuisines</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
