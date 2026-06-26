import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { MapMode, Theme } from '@/types';
import { GLYPHS_URL, VECTOR_TILES_URL } from './constants';

interface Palette {
  background: string;
  water: string;
  waterway: string;
  land: string;
  landResidential: string;
  landCommercial: string;
  wood: string;
  grass: string;
  park: string;
  roadMinor: string;
  roadSecondary: string;
  roadPrimary: string;
  roadHighway: string;
  roadCasing: string;
  rail: string;
  path: string;
  boundary: string;
  buildingLow: string;
  buildingMid: string;
  buildingHigh: string;
  building2D: string;
  building2DOutline: string;
  label: string;
  labelHalo: string;
  roadLabel: string;
  roadLabelHalo: string;
  waterLabel: string;
  skyColor: string;
  horizonColor: string;
  fogColor: string;
  lightColor: string;
  lightIntensity: number;
}

const DARK: Palette = {
  background: '#07080a',
  water: '#122c42',
  waterway: '#16344f',
  land: '#0a0b0e',
  landResidential: '#0c0d11',
  landCommercial: '#0e0e13',
  wood: '#0c1812',
  grass: '#0d1a13',
  park: '#0e1f17',
  roadMinor: '#15171c',
  roadSecondary: '#20232c',
  roadPrimary: '#272b35',
  roadHighway: '#343a4c',
  roadCasing: '#040508',
  rail: '#232732',
  path: '#1c1f27',
  boundary: '#2f3440',
  buildingLow: '#15171d',
  buildingMid: '#1f232c',
  buildingHigh: '#30364a',
  building2D: '#1b1e26',
  building2DOutline: '#070809',
  label: '#9398a8',
  labelHalo: '#05060a',
  roadLabel: '#b4b9c7',
  roadLabelHalo: '#07080c',
  waterLabel: '#5180a8',
  skyColor: '#0a0e16',
  horizonColor: '#11161f',
  fogColor: '#090b10',
  lightColor: '#ffffff',
  lightIntensity: 0.45,
};

const LIGHT: Palette = {
  background: '#eef1f5',
  water: '#a9cdee',
  waterway: '#9cc2e6',
  land: '#f3f5f8',
  landResidential: '#eef0f4',
  landCommercial: '#f1efed',
  wood: '#d8e8d4',
  grass: '#dcebd6',
  park: '#d6ead7',
  roadMinor: '#ffffff',
  roadSecondary: '#ffffff',
  roadPrimary: '#ffffff',
  roadHighway: '#fce3c2',
  roadCasing: '#d7dce5',
  rail: '#c4cad6',
  path: '#e1dee6',
  boundary: '#c2c8d3',
  buildingLow: '#e4e7ed',
  buildingMid: '#dde1e8',
  buildingHigh: '#eef1f5',
  building2D: '#e8eaed',
  building2DOutline: '#d6d9df',
  label: '#48505f',
  labelHalo: '#ffffff',
  roadLabel: '#596172',
  roadLabelHalo: '#ffffff',
  waterLabel: '#5a86b0',
  skyColor: '#cfe0f2',
  horizonColor: '#e6eef7',
  fogColor: '#eef3f8',
  lightColor: '#ffffff',
  lightIntensity: 0.5,
};

function buildingLayersFor(p: Palette, mode: MapMode): LayerSpecification[] {
  if (mode === '2d') {
    // Flat footprint buildings, Google-Maps style — only at street-level zoom.
    return [
      {
        id: 'building-2d',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 13.5,
        paint: {
          'fill-color': p.building2D,
          'fill-outline-color': p.building2DOutline,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, 1],
        },
      },
    ];
  }

  return [
    // Skyline tier — tall "major" buildings (>= 55m) reveal first when zoomed
    // far out, so the city reads as a recognizable skyline rather than clutter.
    {
      id: 'building-major',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 10.5,
      filter: ['>=', ['coalesce', ['get', 'render_height'], 0], 55],
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['number', ['get', 'render_height'], 0],
          0,
          p.buildingLow,
          30,
          p.buildingMid,
          90,
          p.buildingHigh,
          220,
          p.buildingHigh,
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10.5,
          0,
          11.8,
          ['number', ['get', 'render_height'], 0],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10.5,
          0,
          11.8,
          ['number', ['get', 'render_min_height'], 0],
        ],
        'fill-extrusion-vertical-gradient': true,
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 11.8, 0.95],
      },
    },
    // Mid-rise tier (18m–55m) — fades in as you zoom into a neighbourhood.
    {
      id: 'building-mid',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 12.5,
      filter: [
        'all',
        ['>=', ['coalesce', ['get', 'render_height'], 0], 18],
        ['<', ['coalesce', ['get', 'render_height'], 0], 55],
      ],
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['number', ['get', 'render_height'], 0],
          0,
          p.buildingLow,
          30,
          p.buildingMid,
          90,
          p.buildingHigh,
          220,
          p.buildingHigh,
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12.5,
          0,
          13.8,
          ['number', ['get', 'render_height'], 0],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12.5,
          0,
          13.8,
          ['number', ['get', 'render_min_height'], 0],
        ],
        'fill-extrusion-vertical-gradient': true,
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0, 13.8, 0.95],
      },
    },
    // Low-rise tier (< 18m) — the rest of the fabric, only at street-level zoom.
    {
      id: 'building-minor',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13.5,
      filter: ['<', ['coalesce', ['get', 'render_height'], 0], 18],
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['number', ['get', 'render_height'], 0],
          0,
          p.buildingLow,
          30,
          p.buildingMid,
          90,
          p.buildingHigh,
          220,
          p.buildingHigh,
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13.5,
          0,
          14.5,
          ['number', ['get', 'render_height'], 0],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13.5,
          0,
          14.5,
          ['number', ['get', 'render_min_height'], 0],
        ],
        'fill-extrusion-vertical-gradient': true,
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, 0.95],
      },
    },
  ];
}

function buildStyle(p: Palette, mode: MapMode): StyleSpecification {
  const buildingLayers = buildingLayersFor(p, mode);

  return {
    version: 8,
    name: 'toronto-eats',
    glyphs: GLYPHS_URL,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: VECTOR_TILES_URL,
      },
    },
    light: {
      anchor: 'viewport',
      color: p.lightColor,
      intensity: p.lightIntensity,
      position: [1.5, 90, 80],
    },
    sky: {
      'sky-color': p.skyColor,
      'sky-horizon-blend': 0.7,
      'horizon-color': p.horizonColor,
      'fog-color': p.fogColor,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 12, 0.4, 16, 0.12],
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': p.background },
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        paint: {
          'fill-color': ['match', ['get', 'class'], 'wood', p.wood, 'grass', p.grass, p.land],
          'fill-opacity': 0.6,
        },
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        paint: {
          'fill-color': [
            'match',
            ['get', 'class'],
            'residential',
            p.landResidential,
            'commercial',
            p.landCommercial,
            'industrial',
            p.landCommercial,
            'retail',
            p.landCommercial,
            'cemetery',
            p.park,
            p.land,
          ],
          'fill-opacity': 0.5,
        },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': p.park, 'fill-opacity': 0.75 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': p.water },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        paint: {
          'line-color': p.waterway,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 2.5],
        },
      },
      {
        id: 'boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['<=', ['to-number', ['get', 'admin_level']], 6]],
        paint: {
          'line-color': p.boundary,
          'line-dasharray': [3, 2],
          'line-opacity': 0.55,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.5, 12, 1.4],
        },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadCasing,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 16, 13],
        },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'service', 'street'],
        minzoom: 13,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadMinor,
          'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 18, 6],
        },
      },
      {
        id: 'road-tertiary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', 'class', 'tertiary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadSecondary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 5],
        },
      },
      {
        id: 'road-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'primary', 'secondary', 'trunk'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadPrimary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 8],
        },
      },
      {
        id: 'road-highway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', 'class', 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadHighway,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 9],
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'rail', 'transit'],
        minzoom: 12,
        paint: {
          'line-color': p.rail,
          'line-dasharray': [2, 2],
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 18, 2.4],
        },
      },
      {
        id: 'path',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'path', 'pedestrian', 'footway', 'track'],
        minzoom: 14,
        paint: {
          'line-color': p.path,
          'line-dasharray': [1.5, 1.5],
          'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 18, 2],
        },
      },
      ...buildingLayers,
      {
        id: 'road-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 13],
          'text-letter-spacing': 0.02,
        },
        paint: {
          'text-color': p.roadLabel,
          'text-halo-color': p.roadLabelHalo,
          'text-halo-width': 1.2,
          'text-halo-blur': 0.4,
        },
      },
      {
        id: 'water-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'water_name',
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 14],
          'text-max-width': 6,
        },
        paint: {
          'text-color': p.waterLabel,
          'text-halo-color': p.labelHalo,
          'text-halo-width': 1,
        },
      },
      {
        id: 'place-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', 'class', 'city', 'town', 'suburb', 'neighbourhood', 'quarter'],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 16, 15],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.12,
          'text-max-width': 8,
        },
        paint: {
          'text-color': p.label,
          'text-halo-color': p.labelHalo,
          'text-halo-width': 1.2,
          'text-halo-blur': 0.6,
        },
      },
    ],
  };
}

const STYLES: Record<Theme, Record<MapMode, StyleSpecification>> = {
  dark: { '3d': buildStyle(DARK, '3d'), '2d': buildStyle(DARK, '2d') },
  light: { '3d': buildStyle(LIGHT, '3d'), '2d': buildStyle(LIGHT, '2d') },
};

export function getMapStyle(theme: Theme, mode: MapMode): StyleSpecification {
  return STYLES[theme][mode];
}
