/**
 * Constants for CheckInMap component
 */

// Timing constants
export const GEOCODE_DEBOUNCE_MS = 50; // Fast response
export const GEOCODE_TIMEOUT_MS = 10000;
export const DROPDOWN_CLOSE_DELAY_MS = 200;
export const PIN_ANIMATION_DURATION_MS = 600;

// Zoom levels
export const DEFAULT_ZOOM = 12;
export const GPS_ZOOM = 16;
export const PLACE_ZOOM = 15;

// Coordinate validation
export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;
export const COORDINATE_PRECISION = 6; // Decimal places

// Default location (Sydney, Australia)
export const DEFAULT_LOCATION = {
  lat: -33.8688,
  lng: 151.2093
};

// Map bounds (restrict to reasonable areas)
export const MAP_BOUNDS = {
  north: 85,
  south: -85,
  east: 180,
  west: -180
};

// Storage keys
export const STORAGE_KEYS = {
  GEOCODE_CACHE: 'besties_geocode_cache',
  RECENT_SEARCHES: 'besties_recent_searches',
  MAP_TYPE: 'besties_map_type'
};

// Cache settings
export const GEOCODE_CACHE_SIZE = 100; // Max cached results
export const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const RECENT_SEARCHES_MAX = 10;


// Map style configuration
export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'water',
    stylers: [{ color: '#e0f2fe' }] // Light blue water
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ saturation: -50 }, { lightness: 10 }]
  }
];

// Touch target minimum size (accessibility)
export const MIN_TOUCH_TARGET_SIZE = 44; // pixels

