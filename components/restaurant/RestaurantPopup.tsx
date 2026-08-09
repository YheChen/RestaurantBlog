'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  ExternalLink,
  Heart,
  Pencil,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

import { RatingStars } from '@/components/restaurant/RatingStars';
import { RestaurantImage } from '@/components/restaurant/RestaurantImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useSelectedRestaurant } from '@/hooks/useFilteredRestaurants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn, formatVisitDate } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Restaurant } from '@/types';

function Gallery({ restaurant }: { restaurant: Restaurant }) {
  const images = useMemo(() => {
    if (restaurant.images && restaurant.images.length > 0) return restaurant.images;
    return restaurant.image ? [restaurant.image] : [];
  }, [restaurant]);

  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [restaurant.id]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <RestaurantImage
          src={images[active]}
          alt={restaurant.name}
          className="h-44 w-full rounded-xl"
          sizes="(max-width: 768px) 100vw, 384px"
          priority
        />
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>
      {restaurant.imageCredit && (
        <p className="px-0.5 text-[10px] leading-snug text-muted-foreground/80">
          Photo:{' '}
          <a
            href={restaurant.imageCredit.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {restaurant.imageCredit.author}
          </a>{' '}
          ·{' '}
          <a
            href={restaurant.imageCredit.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {restaurant.imageCredit.license}
          </a>{' '}
          via Wikimedia Commons
        </p>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                'relative h-12 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset transition',
                index === active
                  ? 'ring-2 ring-primary'
                  : 'opacity-70 ring-border hover:opacity-100',
              )}
            >
              <RestaurantImage src={src} alt="" className="h-full w-full" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PopupBodyProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

/** Shared scrollable content rendered inside both the desktop card and mobile sheet. */
function PopupBody({ restaurant, isFavorite, onToggleFavorite, onClose }: PopupBodyProps) {
  const openEditPanel = useAppStore((state) => state.openEditPanel);
  const removeRestaurant = useAppStore((state) => state.removeRestaurant);

  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCopied(false);
    setConfirmDelete(false);
  }, [restaurant.id]);

  const visited = formatVisitDate(restaurant.visitDate);
  const subtitle = [restaurant.cuisine, restaurant.neighbourhood].filter(Boolean) as string[];
  const paragraphs = restaurant.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  function handleShare() {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?place=${restaurant.id}`;
    void navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }

  return (
    <div className="flex max-h-full flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2 pt-1">
        <Gallery restaurant={restaurant} />

        {/* Title + meta */}
        <div className="mt-4 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {restaurant.name}
          </h2>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {subtitle.map((part, index) => (
              <span key={part} className="flex items-center gap-2">
                {index > 0 && (
                  <Separator orientation="vertical" className="h-3 bg-border" aria-hidden="true" />
                )}
                <span>{part}</span>
              </span>
            ))}
            {restaurant.priceRange && (
              <>
                {subtitle.length > 0 && (
                  <Separator orientation="vertical" className="h-3 bg-border" aria-hidden="true" />
                )}
                <Badge variant="secondary" className="font-medium tracking-wide">
                  {restaurant.priceRange}
                </Badge>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
            <RatingStars rating={restaurant.rating} size={15} />
            {visited && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Visited {visited}
              </span>
            )}
          </div>
        </div>

        {/* Description (supports multiple paragraphs) */}
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Highlights */}
        {restaurant.highlights && restaurant.highlights.length > 0 && (
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Don&apos;t miss
            </div>
            <ul className="space-y-1">
              {restaurant.highlights.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 font-normal text-muted-foreground"
              >
                <Tag className="size-3" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="space-y-2 border-t border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <Button asChild className="flex-1 rounded-xl focus-visible:ring-offset-background">
            <a href={restaurant.reviewUrl} target="_blank" rel="noopener noreferrer">
              Read My Review
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="size-10 shrink-0 rounded-xl focus-visible:ring-offset-background"
          >
            <Heart
              className={cn(
                'size-5 transition-colors',
                isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground',
              )}
              aria-hidden="true"
            />
          </Button>
        </div>

        {confirmDelete ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm">
            <span className="text-destructive">Delete this place?</span>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2"
                onClick={() => removeRestaurant(restaurant.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={handleShare}>
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Share2 className="size-4" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Share'}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2"
                onClick={() => openEditPanel(restaurant.id)}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Delete place"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Close button (overlaid, top-right of the whole panel) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 size-9 rounded-full bg-background/60 backdrop-blur transition-colors hover:bg-background/80 focus-visible:ring-offset-background"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Floating detail panel for the currently selected restaurant. */
export function RestaurantPopup() {
  const selected = useSelectedRestaurant();
  const isMobile = useIsMobile();
  const selectRestaurant = useAppStore((state) => state.selectRestaurant);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favorites = useAppStore((state) => state.favorites);

  const close = () => selectRestaurant(null);
  useEscapeKey(close, Boolean(selected));

  const isFavorite = selected ? favorites.includes(selected.id) : false;

  return (
    <AnimatePresence>
      {selected &&
        (isMobile ? (
          <motion.div
            key="popup-scrim"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          >
            <motion.div
              key="popup-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.name} details`}
              className="glass-panel absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl border border-border shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-center pb-1 pt-3" aria-hidden="true">
                <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="max-h-[calc(85vh-1.75rem)]">
                <PopupBody
                  restaurant={selected}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => toggleFavorite(selected.id)}
                  onClose={close}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="popup-card"
            role="dialog"
            aria-modal="false"
            aria-label={`${selected.name} details`}
            className="glass-panel fixed right-6 top-[88px] z-40 flex max-h-[calc(100vh-160px)] w-96 flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30, duration: 0.35 }}
          >
            <div className="pt-4">
              <PopupBody
                restaurant={selected}
                isFavorite={isFavorite}
                onToggleFavorite={() => toggleFavorite(selected.id)}
                onClose={close}
              />
            </div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
