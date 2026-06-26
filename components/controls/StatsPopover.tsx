'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';

interface CuisineCount {
  cuisine: string;
  count: number;
}

export function StatsPopover() {
  const restaurants = useAppStore((s) => s.restaurants);
  const favorites = useAppStore((s) => s.favorites);

  const stats = useMemo(() => {
    const total = restaurants.length;

    const ratings = restaurants
      .map((r) => r.rating)
      .filter((rating): rating is number => typeof rating === 'number');
    const averageRating =
      ratings.length > 0
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
        : null;

    const cuisineCounts = new Map<string, number>();
    for (const r of restaurants) {
      cuisineCounts.set(r.cuisine, (cuisineCounts.get(r.cuisine) ?? 0) + 1);
    }

    const topCuisines: CuisineCount[] = Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count || a.cuisine.localeCompare(b.cuisine))
      .slice(0, 5);

    const maxCount = topCuisines.reduce((max, c) => Math.max(max, c.count), 0);

    return {
      total,
      averageRating,
      distinctCuisines: cuisineCounts.size,
      favoritesCount: favorites.length,
      topCuisines,
      maxCount,
    };
  }, [restaurants, favorites]);

  const summary: { label: string; value: string }[] = [
    { label: 'Places', value: String(stats.total) },
    { label: 'Avg rating', value: stats.averageRating ?? '—' },
    { label: 'Cuisines', value: String(stats.distinctCuisines) },
    { label: 'Favorites', value: String(stats.favoritesCount) },
  ];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Statistics"
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Statistics</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Overview</h3>
            <p className="text-xs text-muted-foreground">Your Toronto Eats collection</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
              >
                <div className="text-2xl font-semibold tabular-nums leading-none">
                  {item.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top cuisines
            </h4>
            {stats.topCuisines.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topCuisines.map(({ cuisine, count }) => (
                  <li key={cuisine} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{cuisine}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${stats.maxCount > 0 ? (count / stats.maxCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
