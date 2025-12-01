/**
 * Constants for CheckInMap component
 */

// Timing constants
export const GEOCODE_DEBOUNCE_MS = 100; // Reduced from 300ms for faster response
export const GEOCODE_TIMEOUT_MS = 10000;
export const GPS_WATCH_TIMEOUT_MS = 10000;
export const GPS_INIT_TIMEOUT_MS = 2000;
export const GPS_CACHE_MAX_AGE_MS = 300000; // 5 minutes
export const DROPDOWN_CLOSE_DELAY_MS = 200;
export const PIN_ANIMATION_DURATION_MS = 600;

// Rate limiting
export const GEOCODE_RATE_LIMIT_MS = 500; // Reduced from 1000ms for faster response

// Zoom levels
export const DEFAULT_ZOOM = 12;
export const GPS_ZOOM_DEFAULT = 16;
export const PLACE_ZOOM = 15;
export const INIT_USER_LOCATION_ZOOM = 14;

// Accuracy-based zoom thresholds
export const ZOOM_VERY_ACCURATE = 17; // < 10m
export const ZOOM_GOOD_ACCURATE = 16; // 10-50m
export const ZOOM_MODERATE_ACCURATE = 15; // 50-100m
export const ZOOM_POOR_ACCURATE = 14; // > 100m

// Accuracy thresholds (in meters)
export const ACCURACY_VERY_GOOD = 10;
export const ACCURACY_GOOD = 50;
export const ACCURACY_MODERATE = 100;
export const GPS_RETRY_THRESHOLD = 20; // Retry if accuracy > 20m

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

// API retry settings
export const API_RETRY_MAX_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 500; // Reduced from 1000ms for faster initialization
export const API_RETRY_BACKOFF_MULTIPLIER = 2;

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

