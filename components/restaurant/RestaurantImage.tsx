'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-orange-500/40 to-rose-600/40',
  'from-amber-500/40 to-orange-600/40',
  'from-emerald-500/40 to-teal-600/40',
  'from-sky-500/40 to-indigo-600/40',
  'from-fuchsia-500/40 to-purple-600/40',
  'from-rose-500/40 to-red-600/40',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsOf(value: string): string {
  return value
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface RestaurantImageProps {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Renders a restaurant photo with a deterministic gradient fallback so the UI
 * never shows a broken image, even when the remote photo fails to load.
 */
export function RestaurantImage({ src, alt, className, sizes, priority }: RestaurantImageProps) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[hashString(alt) % GRADIENTS.length];
  const showImage = Boolean(src) && !failed;

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('relative overflow-hidden bg-gradient-to-br', gradient, className)}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes ?? '(max-width: 768px) 100vw, 360px'}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xl font-semibold tracking-wide text-white/80">
            {initialsOf(alt)}
          </span>
        </div>
      )}
    </div>
  );
}
