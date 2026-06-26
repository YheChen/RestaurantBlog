'use client';

import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';

/** Syncs the persisted theme to the <html> class so Tailwind dark mode tracks it. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>;
}
