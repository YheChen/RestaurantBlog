'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RatingStars } from '@/components/restaurant/RatingStars';

const MAX_RESULTS = 6;

export function SearchBar({ className }: { className?: string }) {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectRestaurant = useAppStore((state) => state.selectRestaurant);

  const filtered = useFilteredRestaurants();
  const results = searchQuery.trim().length > 0 ? filtered.slice(0, MAX_RESULTS) : [];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  // Clear any pending blur-close timer if the component unmounts first.
  useEffect(
    () => () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    },
    [],
  );

  const hasQuery = searchQuery.trim().length > 0;
  const showDropdown = open && hasQuery;
  const showResults = showDropdown && results.length > 0;
  const showEmpty = showDropdown && results.length === 0;

  function commitSelection(index: number) {
    const target = results[index] ?? results[0];
    if (!target) return;
    selectRestaurant(target.id);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      if (!showResults) return;
      event.preventDefault();
      commitSelection(activeIndex >= 0 ? activeIndex : 0);
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget && wrapperRef.current?.contains(event.relatedTarget as Node)) {
      return;
    }
    blurTimeout.current = setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, 80);
  }

  function handleFocus() {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setOpen(true);
  }

  return (
    <div
      ref={wrapperRef}
      onBlur={handleBlur}
      className={cn('relative w-full', className)}
    >
      <div
        className={cn(
          'glass-panel flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-shadow',
          showDropdown && 'shadow-xl',
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search restaurants, cuisines, neighbourhoods…"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showResults && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-label="Search restaurants"
          className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
        <AnimatePresence initial={false}>
          {hasQuery && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(showResults || showEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full mt-2"
          >
            {showEmpty ? (
              <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-muted-foreground shadow-xl">
                No matches
              </div>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Search results"
                className="glass-panel max-h-[60vh] overflow-y-auto rounded-2xl p-1.5 shadow-xl"
              >
                {results.map((restaurant, index) => {
                  const isActive = index === activeIndex;
                  const meta = [restaurant.cuisine, restaurant.neighbourhood]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li
                      key={restaurant.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isActive}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => commitSelection(index)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                        isActive ? 'bg-accent/80' : 'hover:bg-accent/50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {restaurant.name}
                        </p>
                        {meta && (
                          <p className="truncate text-xs text-muted-foreground">{meta}</p>
                        )}
                      </div>
                      <RatingStars
                        rating={restaurant.rating}
                        size={12}
                        showValue={false}
                        className="shrink-0"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
