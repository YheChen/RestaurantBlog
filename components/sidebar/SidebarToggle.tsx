'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { useAppStore } from '@/store/useAppStore';

export function SidebarToggle() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const count = useFilteredRestaurants().length;

  const Icon = sidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="glass-soft relative inline-flex items-center justify-center rounded-2xl border border-border p-1 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-pressed={sidebarOpen}
            className="rounded-xl"
          >
            <Icon className="h-5 w-5" />
          </Button>
          {count > 0 && (
            <Badge
              variant="default"
              className="pointer-events-none absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 tabular-nums"
            >
              {count}
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {sidebarOpen ? 'Hide places' : 'Show places'}
      </TooltipContent>
    </Tooltip>
  );
}
