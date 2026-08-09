'use client';

import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

import { FilterPopover } from './FilterPopover';
import { MapModeToggle } from './MapModeToggle';
import { StatsPopover } from './StatsPopover';
import { ThemeToggle } from './ThemeToggle';

export function ControlsToolbar() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-panel flex items-center gap-1 rounded-2xl p-1.5 shadow-lg">
        <FilterPopover />
        <StatsPopover />
        <Separator orientation="vertical" className="h-6" />
        <MapModeToggle />
        <Separator orientation="vertical" className="h-6" />
        <ThemeToggle />
      </div>
    </TooltipProvider>
  );
}
