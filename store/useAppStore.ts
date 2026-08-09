import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LatLng, MapMode, Restaurant, SortOption, Theme } from '@/types';
import { restaurants as initialRestaurants } from '@/data/restaurants';
import { createRestaurantId } from '@/lib/utils';

interface AppState {
  // Data
  restaurants: Restaurant[];

  // Map instance (non-serializable, never persisted)
  map: MapLibreMap | null;
  mapLoaded: boolean;

  // Selection & hover
  selectedId: string | null;
  hoveredId: string | null;
  selectionTick: number;

  // Search, filters & sort
  searchQuery: string;
  activeCuisines: string[];
  activeTags: string[];
  showFavoritesOnly: boolean;
  favorites: string[];
  sortBy: SortOption;

  // Geolocation (per session)
  userLocation: LatLng | null;

  // Add / edit place panel + map location picking
  addPanelOpen: boolean;
  editingId: string | null;
  pickingLocation: boolean;
  pickedPoint: LatLng | null;

  // UI
  sidebarOpen: boolean;
  theme: Theme;
  mapMode: MapMode;

  // Data actions
  setRestaurants: (restaurants: Restaurant[]) => void;
  addRestaurant: (restaurant: Restaurant) => void;
  updateRestaurant: (restaurant: Restaurant) => void;
  removeRestaurant: (id: string) => void;
  resetRestaurants: () => void;

  // Map / selection
  setMap: (map: MapLibreMap | null) => void;
  setMapLoaded: (loaded: boolean) => void;
  selectRestaurant: (id: string | null) => void;
  setHovered: (id: string | null) => void;

  // Search / filters / sort
  setSearchQuery: (query: string) => void;
  toggleCuisine: (cuisine: string) => void;
  clearCuisines: () => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  clearFilters: () => void;
  toggleFavorite: (id: string) => void;
  setShowFavoritesOnly: (value: boolean) => void;
  setSortBy: (sort: SortOption) => void;

  // Geolocation
  setUserLocation: (location: LatLng | null) => void;

  // Add / edit panel
  openAddPanel: () => void;
  openEditPanel: (id: string) => void;
  closeAddPanel: () => void;
  setPickingLocation: (picking: boolean) => void;
  setPickedPoint: (point: LatLng | null) => void;

  // UI
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

/** Drops favourites / selection that no longer exist in a new dataset. */
function reconcile(restaurants: Restaurant[], favorites: string[], selectedId: string | null) {
  const ids = new Set(restaurants.map((restaurant) => restaurant.id));
  return {
    restaurants,
    favorites: favorites.filter((id) => ids.has(id)),
    selectedId: selectedId && ids.has(selectedId) ? selectedId : null,
    activeCuisines: [] as string[],
    activeTags: [] as string[],
    searchQuery: '',
  };
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
      sortBy: 'default',
      userLocation: null,
      addPanelOpen: false,
      editingId: null,
      pickingLocation: false,
      pickedPoint: null,
      sidebarOpen: false,
      theme: 'dark',
      mapMode: '3d',

      setRestaurants: (restaurants) =>
        set((state) => reconcile(restaurants, state.favorites, state.selectedId)),

      addRestaurant: (restaurant) =>
        set((state) => {
          const existing = state.restaurants.map((item) => item.id);
          const id = existing.includes(restaurant.id)
            ? createRestaurantId(restaurant.name, existing)
            : restaurant.id;
          return {
            restaurants: [...state.restaurants, { ...restaurant, id }],
            selectedId: id,
            selectionTick: state.selectionTick + 1,
            addPanelOpen: false,
            editingId: null,
            pickingLocation: false,
            pickedPoint: null,
          };
        }),

      updateRestaurant: (restaurant) =>
        set((state) => ({
          restaurants: state.restaurants.map((item) =>
            item.id === restaurant.id ? restaurant : item,
          ),
          selectedId: restaurant.id,
          selectionTick: state.selectionTick + 1,
          addPanelOpen: false,
          editingId: null,
          pickingLocation: false,
          pickedPoint: null,
        })),

      removeRestaurant: (id) =>
        set((state) => ({
          restaurants: state.restaurants.filter((item) => item.id !== id),
          favorites: state.favorites.filter((favorite) => favorite !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          addPanelOpen: state.editingId === id ? false : state.addPanelOpen,
          editingId: state.editingId === id ? null : state.editingId,
        })),

      resetRestaurants: () =>
        set((state) => reconcile(initialRestaurants, state.favorites, state.selectedId)),

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
      toggleFavorite: (id) => set((state) => ({ favorites: toggleInArray(state.favorites, id) })),
      setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),
      setSortBy: (sortBy) => set({ sortBy }),

      setUserLocation: (userLocation) => set({ userLocation }),

      openAddPanel: () =>
        set({ addPanelOpen: true, editingId: null, selectedId: null, pickedPoint: null }),
      openEditPanel: (id) =>
        set({ addPanelOpen: true, editingId: id, selectedId: null, pickedPoint: null }),
      closeAddPanel: () =>
        set({ addPanelOpen: false, editingId: null, pickingLocation: false, pickedPoint: null }),
      setPickingLocation: (pickingLocation) => set({ pickingLocation }),
      setPickedPoint: (pickedPoint) => set({ pickedPoint }),

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
      // The restaurant list is persisted so manual additions and imports survive
      // reloads; the user becomes the owner of their list (reset restores seed data).
      partialize: (state) => ({
        restaurants: state.restaurants,
        favorites: state.favorites,
        theme: state.theme,
        showFavoritesOnly: state.showFavoritesOnly,
        mapMode: state.mapMode,
        sortBy: state.sortBy,
      }),
    },
  ),
);
