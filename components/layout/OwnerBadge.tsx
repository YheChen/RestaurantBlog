'use client';

import { PencilRuler, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

/**
 * Small indicator shown only while owner mode is on, so it is obvious that the
 * add / edit / delete controls are visible and easy to switch them back off.
 * Renders nothing for ordinary visitors.
 */
export function OwnerBadge() {
  const isOwner = useAppStore((s) => s.isOwner);
  const setOwner = useAppStore((s) => s.setOwner);

  if (!isOwner) return null;

  return (
    <div className="glass-soft flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 shadow-lg">
      <PencilRuler className="size-3.5 text-primary" aria-hidden="true" />
      <span className="text-xs font-medium">Owner</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Leave owner mode"
        title="Leave owner mode"
        onClick={() => setOwner(false)}
        className="size-6 rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
