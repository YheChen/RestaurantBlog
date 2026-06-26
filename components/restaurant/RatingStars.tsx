import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating?: number;
  className?: string;
  showValue?: boolean;
  size?: number;
}

/** Five-star rating display supporting half-star precision. */
export function RatingStars({ rating, className, showValue = true, size = 14 }: RatingStarsProps) {
  if (typeof rating !== 'number') return null;

  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Rated ${clamped} out of 5`}>
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = Math.max(0, Math.min(1, clamped - index));
          return (
            <span key={index} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star
                className="absolute inset-0 text-muted-foreground/40"
                style={{ width: size, height: size }}
                strokeWidth={2}
              />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star
                  className="text-amber-400"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                  strokeWidth={2}
                />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-foreground/90">{clamped.toFixed(1)}</span>
      )}
    </div>
  );
}
