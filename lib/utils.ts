import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LatLng } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slugifies a name into a unique kebab-case id not already in `existingIds`. */
export function createRestaurantId(name: string, existingIds: Iterable<string>): string {
  const taken = new Set(existingIds);
  const base =
    normalize(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'place';
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

/** Great-circle distance in kilometres between two points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Formats a distance in km for display (e.g. "450 m", "2.3 km"). */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Formats an ISO date string (e.g. "2024-03-14") into "March 2024". */
export function formatVisitDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
}

// Combining diacritical marks (U+0300–U+036F); built via RegExp to keep source ASCII-clean.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Case/diacritic-insensitive normalization used by search. */
export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').trim();
}
