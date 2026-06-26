'use client';

import { Heart, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cuisines, tags } from '@/data/restaurants';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function FilterPopover() {
  const activeCuisines = useAppStore((s) => s.activeCuisines);
  const activeTags = useAppStore((s) => s.activeTags);
  const showFavoritesOnly = useAppStore((s) => s.showFavoritesOnly);
  const toggleCuisine = useAppStore((s) => s.toggleCuisine);
  const toggleTag = useAppStore((s) => s.toggleTag);
  const setShowFavoritesOnly = useAppStore((s) => s.setShowFavoritesOnly);
  const clearFilters = useAppStore((s) => s.clearFilters);

  const hasActiveFilters =
    activeCuisines.length > 0 || activeTags.length > 0 || showFavoritesOnly;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Filters"
              className="relative rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {hasActiveFilters ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
                />
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filters</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0">
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              aria-pressed={showFavoritesOnly}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                showFavoritesOnly
                  ? 'border-transparent bg-primary/10 text-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                <Heart
                  className={cn(
                    'size-4',
                    showFavoritesOnly && 'fill-primary text-primary',
                  )}
                  aria-hidden="true"
                />
                Favorites only
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors',
                  showFavoritesOnly ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-4 rounded-full bg-background shadow transition-all',
                    showFavoritesOnly ? 'left-4' : 'left-0.5',
                  )}
                />
              </span>
            </button>

            <div className="space-y-2">
              <h3 className="px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cuisine
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {cuisines.map((c) => {
                  const active = activeCuisines.includes(c);
                  return (
                    <Button
                      key={c}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      onClick={() => toggleCuisine(c)}
                      className="h-7 rounded-full px-3 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {c}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const active = activeTags.includes(t);
                  return (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      onClick={() => toggleTag(t)}
                      className="h-7 rounded-full px-3 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {t}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Clear all
              </Button>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
