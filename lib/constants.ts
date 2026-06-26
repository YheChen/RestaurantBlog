import type { CameraTarget } from '@/types';

/** CN Tower — the visual anchor for downtown Toronto. */
export const CN_TOWER: { longitude: number; latitude: number } = {
  longitude: -79.3871,
  latitude: 43.6426,
};

/** Initial camera framing requested by the brief. */
export const INITIAL_CAMERA: Required<CameraTarget> = {
  longitude: CN_TOWER.longitude,
  latitude: CN_TOWER.latitude,
  zoom: 15,
  pitch: 60,
  bearing: 20,
};

/** Zoom used when flying to an individual restaurant. */
export const FOCUS_ZOOM = 16.5;
export const FOCUS_PITCH = 62;

/** Duration (ms) of the fly-to animation. */
export const FLY_DURATION = 1100;

/** Free, key-less OpenMapTiles-schema vector tiles (OpenStreetMap data). */
export const VECTOR_TILES_URL = 'https://tiles.openfreemap.org/planet';
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

export const MOBILE_BREAKPOINT = 768;
