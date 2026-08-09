'use client';

import { ArrowUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { SortOption } from '@/types';

interface SortOptionConfig {
  value: SortOption;
  label: string;
  shortLabel: string;
}

const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { value: 'default', label: 'Default order', shortLabel: 'Sort' },
  { value: 'rating', label: 'Top rated', shortLabel: 'Rated' },
  { value: 'recent', label: 'Recently visited', shortLabel: 'Recent' },
  { value: 'name', label: 'Name (A–Z)', shortLabel: 'Name' },
  { value: 'distance', label: 'Nearest to me', shortLabel: 'Nearest' },
];

export function SortControl() {
  const sortBy = useAppStore((s) => s.sortBy);
  const setSortBy = useAppStore((s) => s.setSortBy);
  const userLocation = useAppStore((s) => s.userLocation);

  const current = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Sort places"
          className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowUpDown className="size-4" aria-hidden="true" />
          {current.shortLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-1">
        <div role="menu" aria-label="Sort places by" className="space-y-0.5">
          {SORT_OPTIONS.map((option) => {
            const active = sortBy === option.value;
            const disabled = option.value === 'distance' && userLocation === null;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {disabled ? (
                    <span className="text-xs text-muted-foreground">Use ‘Near me’ first</span>
                  ) : null}
                </span>
                {active ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
