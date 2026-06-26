import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapMode, Restaurant, Theme } from '@/types';
import { restaurants as initialRestaurants } from '@/data/restaurants';

interface AppState {
  // Data
  restaurants: Restaurant[];

  // Map instance (non-serializable, never persisted)
  map: MapLibreMap | null;
  mapLoaded: boolean;

  // Selection & hover
  selectedId: string | null;
  hoveredId: string | null;
  // Bumped on every selection intent so re-selecting the same place re-flies.
  selectionTick: number;

  // Search & filters
  searchQuery: string;
  activeCuisines: string[];
  activeTags: string[];
  showFavoritesOnly: boolean;
  favorites: string[];

  // UI
  sidebarOpen: boolean;
  theme: Theme;
  mapMode: MapMode;

  // Actions
  setRestaurants: (restaurants: Restaurant[]) => void;
  setMap: (map: MapLibreMap | null) => void;
  setMapLoaded: (loaded: boolean) => void;
  selectRestaurant: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleCuisine: (cuisine: string) => void;
  clearCuisines: () => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  clearFilters: () => void;
  toggleFavorite: (id: string) => void;
  setShowFavoritesOnly: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMapMode: (mode: MapMode) => void;
  toggleMapMode: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      restaurants: initialRestaurants,
      map: null,
      mapLoaded: false,
      selectedId: null,
      hoveredId: null,
      selectionTick: 0,
      searchQuery: '',
      activeCuisines: [],
      activeTags: [],
      showFavoritesOnly: false,
      favorites: [],
      // Starts closed; the Sidebar opens it on desktop after mount (and it
      // stays closed on mobile so the drawer never covers the map on load).
      sidebarOpen: false,
      theme: 'dark',
      mapMode: '3d',

      setRestaurants: (restaurants) =>
        set((state) => {
          // Reconcile derived state with the new dataset: drop favourites and a
          // selection that no longer exist, and reset filters that may not apply.
          const ids = new Set(restaurants.map((restaurant) => restaurant.id));
          return {
            restaurants,
            favorites: state.favorites.filter((id) => ids.has(id)),
            selectedId: state.selectedId && ids.has(state.selectedId) ? state.selectedId : null,
            activeCuisines: [],
            activeTags: [],
            searchQuery: '',
          };
        }),
      setMap: (map) => set({ map }),
      setMapLoaded: (mapLoaded) => set({ mapLoaded }),
      selectRestaurant: (selectedId) =>
        set((state) => ({ selectedId, selectionTick: state.selectionTick + 1 })),
      setHovered: (hoveredId) => set({ hoveredId }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      toggleCuisine: (cuisine) =>
        set((state) => ({ activeCuisines: toggleInArray(state.activeCuisines, cuisine) })),
      clearCuisines: () => set({ activeCuisines: [] }),
      toggleTag: (tag) => set((state) => ({ activeTags: toggleInArray(state.activeTags, tag) })),
      clearTags: () => set({ activeTags: [] }),
      clearFilters: () =>
        set({ activeCuisines: [], activeTags: [], showFavoritesOnly: false, searchQuery: '' }),
      toggleFavorite: (id) =>
        set((state) => ({ favorites: toggleInArray(state.favorites, id) })),
      setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setMapMode: (mapMode) => set({ mapMode }),
      toggleMapMode: () => set((state) => ({ mapMode: state.mapMode === '3d' ? '2d' : '3d' })),
    }),
    {
      name: 'toronto-eats-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : noopStorage,
      ),
      partialize: (state) => ({
        favorites: state.favorites,
        theme: state.theme,
        showFavoritesOnly: state.showFavoritesOnly,
        mapMode: state.mapMode,
      }),
    },
  ),
);
