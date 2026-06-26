'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useAppStore } from '@/store/useAppStore';
import type { Restaurant } from '@/types';

interface MarkerHandle {
  marker: maplibregl.Marker;
  dot: HTMLElement;
  label: HTMLElement;
}

interface MarkerState {
  hovered: boolean;
  selected: boolean;
  favorite: boolean;
}

const DOT_BASE =
  'te-dot relative h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-background shadow-[0_2px_12px_hsl(var(--primary)/0.7)] transition-transform duration-200';
const LABEL_BASE =
  'te-label pointer-events-none mb-2 max-w-[170px] truncate rounded-full bg-popover/90 px-2.5 py-1 text-xs font-semibold text-popover-foreground opacity-0 shadow-lg ring-1 ring-border transition-all duration-200 -translate-y-1 backdrop-blur';

function buildMarkerElement(restaurant: Restaurant): MarkerHandle {
  const root = document.createElement('div');
  root.className = 'te-marker';

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', `${restaurant.name}, ${restaurant.cuisine}`);
  button.className =
    'group flex cursor-pointer flex-col items-center justify-end rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const label = document.createElement('span');
  label.className = LABEL_BASE;
  label.textContent = restaurant.name;

  const floatWrap = document.createElement('span');
  floatWrap.className = 'relative flex animate-float items-center justify-center';

  const pulse = document.createElement('span');
  pulse.className = 'absolute h-7 w-7 rounded-full bg-primary/50 animate-marker-pulse';

  const dot = document.createElement('span');
  dot.className = DOT_BASE;

  floatWrap.appendChild(pulse);
  floatWrap.appendChild(dot);
  button.appendChild(label);
  button.appendChild(floatWrap);
  root.appendChild(button);

  const marker = new maplibregl.Marker({ element: root, anchor: 'center' }).setLngLat([
    restaurant.longitude,
    restaurant.latitude,
  ]);

  return { marker, dot, label };
}

function applyMarkerState(handle: MarkerHandle, state: MarkerState): void {
  const { dot, label } = handle;
  const active = state.hovered || state.selected;

  dot.classList.toggle('scale-150', state.selected);
  dot.classList.toggle('scale-125', state.hovered && !state.selected);
  dot.classList.toggle('ring-4', state.selected);
  dot.classList.toggle('!bg-amber-400', state.favorite);
  dot.classList.toggle('shadow-[0_2px_16px_hsl(38_95%_55%/0.8)]', state.favorite);

  label.classList.toggle('opacity-100', active);
  label.classList.toggle('translate-y-0', active);
  label.classList.toggle('opacity-0', !active);
}

/**
 * Imperatively manages floating MapLibre markers for the given restaurants.
 * Rendering happens on the map (not in React) so panning stays smooth; React
 * only drives create/destroy and hover/selection styling. Renders no DOM.
 */
export function RestaurantMarkerLayer({ restaurants }: { restaurants: Restaurant[] }) {
  const map = useAppStore((state) => state.map);
  const mapLoaded = useAppStore((state) => state.mapLoaded);
  const selectRestaurant = useAppStore((state) => state.selectRestaurant);
  const setHovered = useAppStore((state) => state.setHovered);

  const handlesRef = useRef<Map<string, MarkerHandle>>(new Map());

  // Reconcile markers with the visible restaurant set by id, adding and removing
  // only the delta. This keeps markers stable (no flicker / GL churn) while the
  // user types in search or toggles filters.
  useEffect(() => {
    const handles = handlesRef.current;

    if (!map || !mapLoaded) {
      handles.forEach((handle) => handle.marker.remove());
      handles.clear();
      return;
    }

    const incoming = new Set(restaurants.map((restaurant) => restaurant.id));

    handles.forEach((handle, id) => {
      if (!incoming.has(id)) {
        handle.marker.remove();
        handles.delete(id);
      }
    });

    const { selectedId, hoveredId, favorites } = useAppStore.getState();
    const favoriteSet = new Set(favorites);

    restaurants.forEach((restaurant) => {
      if (handles.has(restaurant.id)) return;

      const handle = buildMarkerElement(restaurant);
      handle.marker.addTo(map);

      const button = handle.marker.getElement().querySelector('button');
      if (button) {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          selectRestaurant(restaurant.id);
        });
        button.addEventListener('mouseenter', () => setHovered(restaurant.id));
        button.addEventListener('mouseleave', () => setHovered(null));
        button.addEventListener('focus', () => setHovered(restaurant.id));
        button.addEventListener('blur', () => setHovered(null));
      }

      applyMarkerState(handle, {
        hovered: hoveredId === restaurant.id,
        selected: selectedId === restaurant.id,
        favorite: favoriteSet.has(restaurant.id),
      });

      handles.set(restaurant.id, handle);
    });
  }, [map, mapLoaded, restaurants, selectRestaurant, setHovered]);

  // Remove every marker when the layer unmounts.
  useEffect(() => {
    const handles = handlesRef.current;
    return () => {
      handles.forEach((handle) => handle.marker.remove());
      handles.clear();
    };
  }, []);

  // Update hover / selection / favourite styling without rebuilding markers.
  const selectedId = useAppStore((state) => state.selectedId);
  const hoveredId = useAppStore((state) => state.hoveredId);
  const favorites = useAppStore((state) => state.favorites);

  useEffect(() => {
    const favoriteSet = new Set(favorites);
    handlesRef.current.forEach((handle, id) => {
      applyMarkerState(handle, {
        hovered: hoveredId === id,
        selected: selectedId === id,
        favorite: favoriteSet.has(id),
      });
    });
  }, [selectedId, hoveredId, favorites]);

  return null;
}
