/**
 * Utility functions for CheckInMap component
 */

import {
  STORAGE_KEYS,
  GEOCODE_CACHE_SIZE,
  GEOCODE_CACHE_TTL_MS,
  RECENT_SEARCHES_MAX,
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  COORDINATE_PRECISION
} from './mapConstants';

/**
 * Validate coordinates are within valid ranges
 */
export const validateCoordinates = (coords) => {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return false;
  }
  
  if (isNaN(coords.lat) || isNaN(coords.lng)) {
    return false;
  }
  
  if (coords.lat < MIN_LATITUDE || coords.lat > MAX_LATITUDE) {
    return false;
  }
  
  if (coords.lng < MIN_LONGITUDE || coords.lng > MAX_LONGITUDE) {
    return false;
  }
  
  return true;
};

/**
 * Round coordinates to specified precision
 */
export const roundCoordinates = (coords, precision = COORDINATE_PRECISION) => {
  return {
    lat: parseFloat(coords.lat.toFixed(precision)),
    lng: parseFloat(coords.lng.toFixed(precision))
  };
};

/**
 * Create cache key from coordinates
 */
export const createCacheKey = (coords) => {
  const rounded = roundCoordinates(coords);
  return `${rounded.lat.toFixed(COORDINATE_PRECISION)},${rounded.lng.toFixed(COORDINATE_PRECISION)}`;
};

/**
 * Get geocoding result from cache
 */
export const getCachedGeocode = (coords) => {
  try {
    const cacheKey = createCacheKey(coords);
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.GEOCODE_CACHE) || '{}');
    const cached = cache[cacheKey];
    
    if (cached && (Date.now() - cached.timestamp) < GEOCODE_CACHE_TTL_MS) {
      return cached.address;
    }
    
    // Remove expired entry
    if (cached) {
      delete cache[cacheKey];
      localStorage.setItem(STORAGE_KEYS.GEOCODE_CACHE, JSON.stringify(cache));
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Store geocoding result in cache
 */
export const cacheGeocode = (coords, address) => {
  try {
    const cacheKey = createCacheKey(coords);
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.GEOCODE_CACHE) || '{}');
    
    // Remove oldest entries if cache is too large
    const keys = Object.keys(cache);
    if (keys.length >= GEOCODE_CACHE_SIZE) {
      // Sort by timestamp and remove oldest
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      const toRemove = sorted.slice(0, keys.length - GEOCODE_CACHE_SIZE + 1);
      toRemove.forEach(key => delete cache[key]);
    }
    
    cache[cacheKey] = {
      address,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.GEOCODE_CACHE, JSON.stringify(cache));
  } catch (error) {
    // Ignore storage errors (quota exceeded, etc.)
  }
};

/**
 * Get recent searches
 */
export const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
  } catch (error) {
    return [];
  }
};

/**
 * Add to recent searches
 */
export const addRecentSearch = (location, coords = null) => {
  try {
    const recent = getRecentSearches();
    const newEntry = {
      location,
      coords,
      timestamp: Date.now()
    };
    
    // Remove duplicates
    const filtered = recent.filter(item => item.location !== location);
    
    // Add to beginning
    const updated = [newEntry, ...filtered].slice(0, RECENT_SEARCHES_MAX);
    
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  } catch (error) {
    // Ignore storage errors
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (coords1, coords2) => {
  if (!validateCoordinates(coords1) || !validateCoordinates(coords2)) {
    return null;
  }
  
  const R = 6371000; // Earth radius in meters
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Format distance for display
 */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return null;
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(meters / 1000)}km`;
  }
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHaptics = () => {
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 */
export const triggerHaptic = (pattern = [10]) => {
  if (supportsHaptics()) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Ignore errors
    }
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxAttempts = 3, delay = 1000, backoffMultiplier = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoffMultiplier, attempt - 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Check if coordinates are within map bounds
 */
export const isWithinBounds = (coords, bounds) => {
  if (!validateCoordinates(coords)) return false;
  if (!bounds) return true; // No bounds restriction
  
  return coords.lat >= bounds.south &&
         coords.lat <= bounds.north &&
         coords.lng >= bounds.west &&
         coords.lng <= bounds.east;
};

