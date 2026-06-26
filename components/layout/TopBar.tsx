'use client';

import { Brand } from './Brand';
import { SearchBar } from '@/components/search/SearchBar';
import { ControlsToolbar } from '@/components/controls/ControlsToolbar';

/**
 * Responsive top bar. A flex row keeps the brand, search, and controls from
 * ever overlapping: on mobile the search wraps to its own line; from `sm` up it
 * sits centred between the brand and the controls and grows to fill the space.
 * The container is click-through so the map stays draggable in the gaps.
 */
export function TopBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-wrap items-start gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto order-1">
        <Brand />
      </div>

      <div className="pointer-events-auto order-3 ml-auto sm:order-3 sm:ml-0">
        <ControlsToolbar />
      </div>

      <div className="pointer-events-auto order-4 flex w-full min-w-0 justify-center sm:order-2 sm:w-auto sm:flex-1">
        <SearchBar className="max-w-[560px]" />
      </div>
    </div>
  );
}
