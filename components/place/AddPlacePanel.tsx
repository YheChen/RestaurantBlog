'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, MapPin, Save, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, createRestaurantId } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { restaurantSchema } from '@/types';
import type { PriceRange, Restaurant } from '@/types';

const PRICE_OPTIONS: PriceRange[] = ['$', '$$', '$$$', '$$$$'];

/** Shape of the controlled form state; every field is a string for input binding. */
interface FormState {
  name: string;
  cuisine: string;
  reviewUrl: string;
  description: string;
  rating: string;
  priceRange: PriceRange | null;
  neighbourhood: string;
  visitDate: string;
  tags: string;
  images: string;
  highlights: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  cuisine: '',
  reviewUrl: '',
  description: '',
  rating: '',
  priceRange: null,
  neighbourhood: '',
  visitDate: '',
  tags: '',
  images: '',
  highlights: '',
  latitude: '',
  longitude: '',
};

/** Serialises an existing restaurant back into editable string form fields. */
function toFormState(restaurant: Restaurant): FormState {
  return {
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    reviewUrl: restaurant.reviewUrl,
    description: restaurant.description,
    rating: restaurant.rating != null ? String(restaurant.rating) : '',
    priceRange: restaurant.priceRange ?? null,
    neighbourhood: restaurant.neighbourhood ?? '',
    visitDate: restaurant.visitDate ?? '',
    tags: restaurant.tags?.join(', ') ?? '',
    images: restaurant.images?.join('\n') ?? '',
    highlights: restaurant.highlights?.join('\n') ?? '',
    latitude: String(restaurant.latitude),
    longitude: String(restaurant.longitude),
  };
}

/** Splits a comma-separated string into trimmed, non-empty parts. */
function splitCommas(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Splits a multi-line string into trimmed, non-empty lines. */
function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

const fieldLabel = 'text-xs font-medium text-muted-foreground';
const textareaClasses =
  'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

/** A labelled form row wiring the label to its control for accessibility. */
function Field({ id, label, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Non-modal add/edit form; lives on the right (opening it clears the detail popup, freeing that side). */
export function AddPlacePanel() {
  const addPanelOpen = useAppStore((state) => state.addPanelOpen);
  const editingId = useAppStore((state) => state.editingId);
  const restaurants = useAppStore((state) => state.restaurants);
  const pickingLocation = useAppStore((state) => state.pickingLocation);
  const pickedPoint = useAppStore((state) => state.pickedPoint);
  const addRestaurant = useAppStore((state) => state.addRestaurant);
  const updateRestaurant = useAppStore((state) => state.updateRestaurant);
  const removeRestaurant = useAppStore((state) => state.removeRestaurant);
  const closeAddPanel = useAppStore((state) => state.closeAddPanel);
  const setPickingLocation = useAppStore((state) => state.setPickingLocation);
  const setPickedPoint = useAppStore((state) => state.setPickedPoint);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isEditing = editingId != null;

  const editingRestaurant = useMemo(
    () => (editingId ? restaurants.find((r) => r.id === editingId) : undefined),
    [editingId, restaurants],
  );

  // Prefill (edit) or reset (add) whenever the panel opens or its target changes.
  useEffect(() => {
    if (!addPanelOpen) return;
    setForm(editingRestaurant ? toFormState(editingRestaurant) : EMPTY_FORM);
    setError(null);
    setConfirmingDelete(false);
  }, [addPanelOpen, editingId, editingRestaurant]);

  // Consume a point picked on the map into the location fields.
  useEffect(() => {
    if (!pickedPoint) return;
    setForm((prev) => ({
      ...prev,
      latitude: String(pickedPoint.lat),
      longitude: String(pickedPoint.lng),
    }));
    setPickedPoint(null);
  }, [pickedPoint, setPickedPoint]);

  // Escape closes the panel while it is open.
  useEffect(() => {
    if (!addPanelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAddPanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addPanelOpen, closeAddPanel]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseMapCenter = () => {
    const map = useAppStore.getState().map;
    if (!map) return;
    const center = map.getCenter();
    setForm((prev) => ({
      ...prev,
      latitude: String(center.lat),
      longitude: String(center.lng),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const cuisine = form.cuisine.trim();
    const reviewUrl = form.reviewUrl.trim();
    const description = form.description.trim();

    if (!name || !cuisine || !reviewUrl || !description) {
      setError('Name, cuisine, review URL and description are required.');
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!form.latitude.trim() || !form.longitude.trim()) {
      setError('Please set a location (latitude and longitude).');
      return;
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    const tags = splitCommas(form.tags);
    const images = splitLines(form.images);
    const highlights = splitLines(form.highlights);
    const rating = form.rating.trim() ? Number(form.rating) : undefined;
    const visitDate = form.visitDate.trim() || undefined;
    const neighbourhood = form.neighbourhood.trim() || undefined;

    const id = isEditing
      ? (editingId as string)
      : createRestaurantId(
          name,
          restaurants.map((r) => r.id),
        );

    const candidate: Restaurant = {
      id,
      name,
      cuisine,
      reviewUrl,
      description,
      latitude,
      longitude,
      ...(rating != null && !Number.isNaN(rating) ? { rating } : {}),
      ...(form.priceRange ? { priceRange: form.priceRange } : {}),
      ...(neighbourhood ? { neighbourhood } : {}),
      ...(visitDate ? { visitDate } : {}),
      ...(tags.length ? { tags } : {}),
      ...(images.length ? { images } : {}),
      ...(highlights.length ? { highlights } : {}),
    };

    const result = restaurantSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check the form for errors.');
      return;
    }

    setError(null);
    if (isEditing) {
      updateRestaurant(result.data);
    } else {
      addRestaurant(result.data);
    }
    // The store closes the panel and resets picking/picked state on success.
  };

  const handleDelete = () => {
    if (!editingId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    removeRestaurant(editingId);
  };

  return (
    <AnimatePresence>
      {addPanelOpen && (
        <motion.aside
          key="add-place-panel"
          role="dialog"
          aria-modal="false"
          aria-label={isEditing ? 'Edit place' : 'Add a place'}
          className={cn(
            'glass-panel fixed z-40 flex flex-col overflow-hidden border border-border shadow-2xl',
            'inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl',
            'md:inset-x-auto md:right-6 md:top-[88px] md:bottom-6 md:w-[360px] md:max-h-none md:rounded-2xl',
          )}
          initial={{ opacity: 0, x: 32, y: '100%' }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 32, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        >
          {/* Mobile grab handle */}
          <div className="flex justify-center pb-1 pt-3 md:hidden" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 md:pt-5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {isEditing ? 'Edit place' : 'Add a place'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeAddPanel}
              aria-label="Close panel"
              className="size-8 shrink-0 rounded-full focus-visible:ring-offset-background"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 px-5 pb-4">
                <Field id="place-name" label="Name" required>
                  <Input
                    id="place-name"
                    value={form.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="Restaurant name"
                    autoComplete="off"
                    required
                  />
                </Field>

                <Field id="place-cuisine" label="Cuisine" required>
                  <Input
                    id="place-cuisine"
                    value={form.cuisine}
                    onChange={(event) => setField('cuisine', event.target.value)}
                    placeholder="e.g. Japanese, Italian"
                    autoComplete="off"
                    required
                  />
                </Field>

                <Field id="place-review-url" label="Review URL" required>
                  <Input
                    id="place-review-url"
                    type="url"
                    value={form.reviewUrl}
                    onChange={(event) => setField('reviewUrl', event.target.value)}
                    placeholder="https://…"
                    autoComplete="off"
                    required
                  />
                </Field>

                <Field id="place-description" label="Description" required>
                  <textarea
                    id="place-description"
                    value={form.description}
                    onChange={(event) => setField('description', event.target.value)}
                    placeholder="What did you think? Multiple paragraphs welcome."
                    rows={4}
                    required
                    className={cn(textareaClasses, 'min-h-[96px] resize-y')}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field id="place-rating" label="Rating">
                    <Input
                      id="place-rating"
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={form.rating}
                      onChange={(event) => setField('rating', event.target.value)}
                      placeholder="0–5"
                    />
                  </Field>

                  <Field id="place-neighbourhood" label="Neighbourhood">
                    <Input
                      id="place-neighbourhood"
                      value={form.neighbourhood}
                      onChange={(event) => setField('neighbourhood', event.target.value)}
                      placeholder="e.g. Kensington"
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <div className="space-y-1.5">
                  <span className={fieldLabel} id="place-price-label">
                    Price range
                  </span>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-labelledby="place-price-label"
                  >
                    {PRICE_OPTIONS.map((option) => {
                      const active = form.priceRange === option;
                      return (
                        <Button
                          key={option}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          size="sm"
                          aria-pressed={active}
                          onClick={() =>
                            setField('priceRange', active ? null : option)
                          }
                          className="flex-1 rounded-lg focus-visible:ring-offset-background"
                        >
                          {option}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Field id="place-visit-date" label="Visit date">
                  <Input
                    id="place-visit-date"
                    type="date"
                    value={form.visitDate}
                    onChange={(event) => setField('visitDate', event.target.value)}
                  />
                </Field>

                <Field id="place-tags" label="Tags">
                  <Input
                    id="place-tags"
                    value={form.tags}
                    onChange={(event) => setField('tags', event.target.value)}
                    placeholder="Comma separated, e.g. cozy, date night"
                    autoComplete="off"
                  />
                </Field>

                <Field id="place-images" label="Photo URLs">
                  <textarea
                    id="place-images"
                    value={form.images}
                    onChange={(event) => setField('images', event.target.value)}
                    placeholder="One URL per line"
                    rows={3}
                    className={cn(textareaClasses, 'min-h-[72px] resize-y')}
                  />
                </Field>

                <Field id="place-highlights" label="Highlights">
                  <textarea
                    id="place-highlights"
                    value={form.highlights}
                    onChange={(event) => setField('highlights', event.target.value)}
                    placeholder="One highlight per line"
                    rows={3}
                    className={cn(textareaClasses, 'min-h-[72px] resize-y')}
                  />
                </Field>

                {/* Location */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/30 p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">Location</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field id="place-latitude" label="Latitude" required>
                      <Input
                        id="place-latitude"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(event) => setField('latitude', event.target.value)}
                        placeholder="43.6532"
                        required
                      />
                    </Field>
                    <Field id="place-longitude" label="Longitude" required>
                      <Input
                        id="place-longitude"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(event) => setField('longitude', event.target.value)}
                        placeholder="-79.3832"
                        required
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={pickingLocation ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setPickingLocation(true)}
                      aria-pressed={pickingLocation}
                      className="rounded-lg focus-visible:ring-offset-background"
                    >
                      <MapPin className="size-4" aria-hidden="true" />
                      Pick on map
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleUseMapCenter}
                      className="rounded-lg focus-visible:ring-offset-background"
                    >
                      <Crosshair className="size-4" aria-hidden="true" />
                      Use map center
                    </Button>
                  </div>

                  <AnimatePresence>
                    {pickingLocation && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-muted-foreground"
                      >
                        Click the map to drop this place…
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Sticky action bar */}
            <div className="border-t border-border/60 px-5 py-4">
              {isEditing && (
                <div className="mb-3">
                  {confirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-muted-foreground">
                        Confirm delete?
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="rounded-lg focus-visible:ring-offset-background"
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded-lg focus-visible:ring-offset-background"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      className="w-full rounded-lg focus-visible:ring-offset-background"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete place
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="flex-1 rounded-xl focus-visible:ring-offset-background"
                >
                  <Save className="size-4" aria-hidden="true" />
                  {isEditing ? 'Save changes' : 'Add place'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeAddPanel}
                  className="rounded-xl focus-visible:ring-offset-background"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
