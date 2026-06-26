'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Download, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { restaurantArraySchema } from '@/types';

type Status =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function ImportExport() {
  const restaurants = useAppStore((s) => s.restaurants);
  const setRestaurants = useAppStore((s) => s.setRestaurants);
  const selectRestaurant = useAppStore((s) => s.selectRestaurant);

  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Auto-dismiss the inline status message so it does not linger in the toolbar.
  useEffect(() => {
    if (status.kind === 'idle') return;
    const id = setTimeout(() => setStatus({ kind: 'idle' }), 3500);
    return () => clearTimeout(id);
  }, [status]);

  function handleExport() {
    if (typeof document === 'undefined') return;
    const json = JSON.stringify(restaurants, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'toronto-eats.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus({ kind: 'success', message: 'Exported toronto-eats.json' });
  }

  function handleImportClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so the same file can be selected again later.
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = restaurantArraySchema.safeParse(parsed);
      if (!result.success) {
        setStatus({ kind: 'error', message: 'Invalid restaurant data.' });
        return;
      }
      setRestaurants(result.data);
      selectRestaurant(null);
      setStatus({
        kind: 'success',
        message: `Imported ${result.data.length} place${result.data.length === 1 ? '' : 's'}`,
      });
    } catch {
      setStatus({ kind: 'error', message: 'Could not parse JSON file.' });
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Export JSON"
            onClick={handleExport}
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export JSON</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Import JSON"
            onClick={handleImportClick}
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Upload className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import JSON</TooltipContent>
      </Tooltip>

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        aria-label="Import restaurants from a JSON file"
        className="sr-only"
      />

      <AnimatePresence>
        {status.kind !== 'idle' ? (
          <motion.p
            key={status.message}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'ml-1 flex items-center gap-1 whitespace-nowrap text-xs font-medium',
              status.kind === 'error' ? 'text-destructive' : 'text-primary',
            )}
          >
            {status.kind === 'error' ? (
              <AlertCircle className="size-3.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            )}
            {status.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
