import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
