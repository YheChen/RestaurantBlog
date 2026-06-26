'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useFilteredRestaurants } from '@/hooks/useFilteredRestaurants';
import { getMapStyle } from '@/lib/mapStyle';
import { INITIAL_CAMERA } from '@/lib/constants';
import type { MapMode } from '@/types';
import { RestaurantMarkerLayer } from './RestaurantMarker';
import { CameraController } from './CameraController';

/**
 * Enables or disables all rotation/pitch gestures — mouse drag, touch, AND
 * keyboard (Shift+Arrow) — so 2D mode is truly locked flat for every input.
 */
function setRotationEnabled(map: maplibregl.Map, enabled: boolean): void {
  if (enabled) {
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.keyboard.enableRotation();
  } else {
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    map.keyboard.disableRotation();
  }
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const prevModeRef = useRef<MapMode>(useAppStore.getState().mapMode);

  const theme = useAppStore((state) => state.theme);
  const mapMode = useAppStore((state) => state.mapMode);
  const mapLoaded = useAppStore((state) => state.mapLoaded);
  const filtered = useFilteredRestaurants();

  // Create the map exactly once. Store actions, initial theme, and initial mode
  // are read via getState so this effect never re-runs and re-instantiates it.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const {
      theme: initialTheme,
      mapMode: initialMode,
      setMap,
      setMapLoaded,
      selectRestaurant,
    } = useAppStore.getState();
    const flat = initialMode === '2d';

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(initialTheme, initialMode),
      center: [INITIAL_CAMERA.longitude, INITIAL_CAMERA.latitude],
      zoom: INITIAL_CAMERA.zoom,
      pitch: flat ? 0 : INITIAL_CAMERA.pitch,
      bearing: flat ? 0 : INITIAL_CAMERA.bearing,
      maxPitch: 75,
      antialias: true,
      attributionControl: false,
      dragRotate: true,
    });

    mapRef.current = map;
    setRotationEnabled(map, !flat);

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors · OpenFreeMap',
      }),
      'bottom-right',
    );

    map.on('load', () => {
      setMap(map);
      setMapLoaded(true);
    });

    // Clicking the bare map (not a marker) clears the current selection.
    map.on('click', () => selectRestaurant(null));

    return () => {
      const { setMap, setMapLoaded } = useAppStore.getState();
      setMapLoaded(false);
      setMap(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap the basemap when the theme or 2D/3D mode changes, preserving the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(getMapStyle(theme, mapMode));
  }, [theme, mapMode, mapLoaded]);

  // On a 2D/3D switch, animate the camera flat or pitched and lock/unlock
  // rotation. Skips the first run (the initial state is set at map creation).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || prevModeRef.current === mapMode) return;
    prevModeRef.current = mapMode;

    if (mapMode === '2d') {
      setRotationEnabled(map, false);
      map.easeTo({ pitch: 0, bearing: 0, duration: 700, essential: true });
    } else {
      setRotationEnabled(map, true);
      map.easeTo({ pitch: INITIAL_CAMERA.pitch, duration: 700, essential: true });
    }
  }, [mapMode, mapLoaded]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="Map of Toronto restaurants" />

      {/* Soft vignette to frame the scene and lift the floating UI. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(var(--background)/0.55)_100%)]" />

      {mapLoaded && <RestaurantMarkerLayer restaurants={filtered} />}
      <CameraController />

      <AnimatePresence>
        {!mapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm font-medium tracking-wide">Loading Chen&apos;s Toronto…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
