import React, { useRef, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { isEnabled } from '../../config/features';
import { useAuth } from '../../contexts/AuthContext';
import errorTracker from '../../services/errorTracking';
import { logAnalyticsEvent } from '../../services/firebase';
import SubtleNotification from '../errors/SubtleNotification';
import {
  GEOCODE_DEBOUNCE_MS,
  GEOCODE_TIMEOUT_MS,
  DROPDOWN_CLOSE_DELAY_MS,
  PIN_ANIMATION_DURATION_MS,
  DEFAULT_ZOOM,
  GPS_ZOOM,
  PLACE_ZOOM,
  COORDINATE_PRECISION,
  DEFAULT_LOCATION,
  MAP_BOUNDS,
  MAP_STYLES,
  MIN_TOUCH_TARGET_SIZE,
} from './mapConstants';
import {
  validateCoordinates,
  roundCoordinates,
  getCachedGeocode,
  cacheGeocode,
  getRecentSearches,
  addRecentSearch,
  formatDistance,
  triggerHaptic
} from './mapUtils';

/**
 * Simplified CheckInMap component
 * 
 * Core functionality:
 * - Drag map to set location
 * - GPS button to get current location
 * - Autocomplete search
 */
const CheckInMap = ({
  locationInput,
  setLocationInput,
  gpsCoords,
  setGpsCoords,
  mapInitialized,
  setMapInitialized,
  autocompleteLoaded,
  showLocationDropdown,
  setShowLocationDropdown,
  loading,
  setLoading
}) => {
  // Essential refs only
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const pinAnimationRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // State
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [subtleError, setSubtleError] = useState(null);
  
  // Auth
  const { userData } = useAuth();
  
  // Load favorites and recent searches
  useEffect(() => {
    if (userData?.favoriteLocations) {
      setFavorites(userData.favoriteLocations);
    }
    const recent = getRecentSearches();
    setRecentSearches(recent);
    
    // Try to use last location from recent searches if no GPS coords
    if (!gpsCoords && recent.length > 0 && recent[0].coords) {
      const lastCoords = recent[0].coords;
      if (validateCoordinates(lastCoords)) {
        setGpsCoords(lastCoords);
        setLocationInput(recent[0].location);
      }
    }
  }, [userData, gpsCoords, setGpsCoords, setLocationInput]);
  
  // Try to get location automatically on mount if GPS is enabled and no location set
  useEffect(() => {
    if (!mapInitialized || gpsCoords || !isEnabled('gpsLocation') || !navigator.geolocation) return;
    
    // Try to get location silently (non-blocking)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (validateCoordinates(coords) && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords);
          mapInstanceRef.current.setZoom(GPS_ZOOM);
          setGpsCoords(coords);
          geocodeLocation(coords, 'auto');
        }
      },
      () => {
        // Silent fail - user can manually get location
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [mapInitialized, gpsCoords, geocodeLocation, setGpsCoords]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      if (geocoderRef.current) {
        // Geocoder doesn't need explicit cleanup
      }
    };
  }, []);
  
  // Geocode location (simplified - no rate limiting)
  const geocodeLocation = useCallback((coords, source = 'click') => {
    if (!validateCoordinates(coords)) {
      errorTracker.logCustomError('Invalid coordinates', { coords, source });
      return;
    }
    
    const rounded = roundCoordinates(coords);
    
    // Clear pending geocoding
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    // Show coordinates immediately
    const coordsString = `${rounded.lat.toFixed(COORDINATE_PRECISION)}, ${rounded.lng.toFixed(COORDINATE_PRECISION)}`;
    setLocationInput(coordsString);
    setGpsCoords(rounded);
    setGeocodingError(false);
    
    // Check cache first
    const cached = getCachedGeocode(rounded);
    if (cached) {
      setLocationInput(cached);
      setGeocodingError(false);
      addRecentSearch(cached, rounded);
      setRecentSearches(getRecentSearches());
      
      // Pin animation
      if (pinAnimationRef.current) {
        pinAnimationRef.current.classList.add('animate-pin-pulse');
        setTimeout(() => {
          if (pinAnimationRef.current) {
            pinAnimationRef.current.classList.remove('animate-pin-pulse');
          }
        }, PIN_ANIMATION_DURATION_MS);
      }
      triggerHaptic([10]);
      return;
    }
    
    // Debounce geocoding (50ms for fast response)
    geocodeTimeoutRef.current = setTimeout(() => {
      setIsGeocoding(true);
      
      // Create geocoder if needed
      if (!geocoderRef.current && window.google?.maps?.Geocoder) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
      
      if (!geocoderRef.current) {
        setIsGeocoding(false);
        setGeocodingError(true);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        setIsGeocoding(false);
        setGeocodingError(true);
      }, GEOCODE_TIMEOUT_MS);
      
      geocoderRef.current.geocode({ location: rounded }, (results, status) => {
        clearTimeout(timeoutId);
        setIsGeocoding(false);
        
        if (status === 'OK' && results?.[0]) {
          const address = results[0].formatted_address;
          setLocationInput(address);
          setGeocodingError(false);
          cacheGeocode(rounded, address);
          addRecentSearch(address, rounded);
          setRecentSearches(getRecentSearches());
          
          // Pin animation
          if (pinAnimationRef.current) {
            pinAnimationRef.current.classList.add('animate-pin-pulse');
            setTimeout(() => {
              if (pinAnimationRef.current) {
                pinAnimationRef.current.classList.remove('animate-pin-pulse');
              }
            }, PIN_ANIMATION_DURATION_MS);
          }
          triggerHaptic([10]);
          logAnalyticsEvent('map_location_geocoded', { source });
        } else {
          setGeocodingError(true);
          errorTracker.logCustomError('Geocoding failed', { status, coords: rounded });
        }
      });
    }, GEOCODE_DEBOUNCE_MS);
  }, [setLocationInput, setGpsCoords]);
  
  // Initialize map (simplified - no retry logic)
  useEffect(() => {
    if (!mapRef.current || mapInitialized || !window.google?.maps?.Map) return;
    
    try {
      const defaultLocation = gpsCoords && validateCoordinates(gpsCoords) ? gpsCoords : DEFAULT_LOCATION;
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: true,
        gestureHandling: 'cooperative',
        optimized: true,
        clickableIcons: false,
        styles: MAP_STYLES,
        restriction: {
          latLngBounds: MAP_BOUNDS,
          strictBounds: false
        }
      });
      
      // Map click handler
      mapInstanceRef.current.addListener('click', (event) => {
        setShowLocationDropdown(false);
        if (!isDraggingRef.current) {
          const coords = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          if (validateCoordinates(coords)) {
            geocodeLocation(coords, 'clicked');
          }
        }
      });
      
      // Drag handlers - only geocode AFTER drag ends
      mapInstanceRef.current.addListener('dragstart', () => {
        isDraggingRef.current = true;
        setIsDragging(true);
        setGeocodingError(false);
        if (geocodeTimeoutRef.current) {
          clearTimeout(geocodeTimeoutRef.current);
          geocodeTimeoutRef.current = null;
        }
      });
      
      mapInstanceRef.current.addListener('dragend', () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        
        // Small delay to ensure map center is stable
        setTimeout(() => {
          if (mapInstanceRef.current && !isDraggingRef.current) {
            const mapCenter = mapInstanceRef.current.getCenter();
            if (mapCenter) {
              const coords = {
                lat: mapCenter.lat(),
                lng: mapCenter.lng()
              };
              if (validateCoordinates(coords)) {
                const coordsString = `${coords.lat.toFixed(COORDINATE_PRECISION)}, ${coords.lng.toFixed(COORDINATE_PRECISION)}`;
                setLocationInput(coordsString);
                setGpsCoords(coords);
                geocodeLocation(coords, 'dragged');
              }
            }
          }
        }, 50);
      });
      
      setMapInitialized(true);
      setMapError(false);
      logAnalyticsEvent('map_initialized');
    } catch (error) {
      errorTracker.logError({
        type: 'map_init_error',
        message: error.message,
        stack: error.stack
      });
      setMapError(true);
      toast.error('Failed to initialize map. Please refresh the page.', {
        duration: 4000,
        id: 'map-init-error'
      });
    }
  }, [mapInitialized, gpsCoords, geocodeLocation, setMapInitialized, setShowLocationDropdown, setGpsCoords, setLocationInput]);
  
  // Initialize autocomplete
  useEffect(() => {
    if (!autocompleteLoaded || !locationInputRef.current || !window.google?.maps?.places?.Autocomplete) return;
    
    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'name', 'geometry'],
        }
      );
      
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();
          
          if (place.formatted_address) {
            if (geocodeTimeoutRef.current) {
              clearTimeout(geocodeTimeoutRef.current);
            }
            setIsGeocoding(false);
            setGeocodingError(false);
            
            const displayLocation = place.name && place.name !== place.formatted_address
              ? `${place.name}, ${place.formatted_address}`
              : place.formatted_address;
            
            setLocationInput(displayLocation);
            addRecentSearch(displayLocation);
            setRecentSearches(getRecentSearches());
            
            if (place.geometry?.location && mapInstanceRef.current) {
              const location = place.geometry.location;
              const coords = {
                lat: location.lat(),
                lng: location.lng()
              };
              
              if (validateCoordinates(coords)) {
                mapInstanceRef.current.panTo(coords);
                mapInstanceRef.current.setZoom(PLACE_ZOOM);
                setGpsCoords(coords);
                
                // Pin animation
                if (pinAnimationRef.current) {
                  pinAnimationRef.current.classList.add('animate-pin-pulse');
                  setTimeout(() => {
                    if (pinAnimationRef.current) {
                      pinAnimationRef.current.classList.remove('animate-pin-pulse');
                    }
                  }, PIN_ANIMATION_DURATION_MS);
                }
                triggerHaptic([10]);
                logAnalyticsEvent('place_selected', { placeName: displayLocation });
              }
            }
          }
        } catch (error) {
          errorTracker.logError({
            type: 'place_selection_error',
            message: error.message,
            stack: error.stack
          });
          setSubtleError('Error selecting location. Please try again.');
        }
      });
      
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      errorTracker.logError({
        type: 'autocomplete_init_error',
        message: error.message,
        stack: error.stack
      });
      // Subtle error - autocomplete is optional, user can type manually
      setSubtleError('Could not initialize address search. Please type your location manually.');
    }
  }, [autocompleteLoaded, setLocationInput, setGpsCoords, setShowLocationDropdown]);
  
  // Simple GPS handler - just get location once
  const handleGetLocation = useCallback(() => {
    if (!isEnabled('gpsLocation')) {
      setSubtleError('GPS location is not enabled');
      return;
    }
    
    if (!navigator.geolocation) {
      setSubtleError('Geolocation not supported. Please search for your location manually.');
      return;
    }
    
    setLoading(true);
    setGeocodingError(false);
    toast.loading('Getting your location...', { id: 'gps-loading' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (!validateCoordinates(coords)) {
          toast.dismiss('gps-loading');
          setLoading(false);
          setSubtleError('Invalid location received. Please try again.');
          return;
        }
        
        toast.dismiss('gps-loading');
        setLoading(false);
        
        // Center map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords);
          mapInstanceRef.current.setZoom(GPS_ZOOM);
        }
        
        setGpsCoords(coords);
        geocodeLocation(coords, 'gps');
        toast.success('Location found!', { duration: 2000 });
        logAnalyticsEvent('gps_location_captured');
      },
      (error) => {
        toast.dismiss('gps-loading');
        setLoading(false);
        setSubtleError('Could not get your location. Please search manually.');
        errorTracker.logCustomError('GPS error', { code: error.code, message: error.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [setLoading, setGpsCoords, geocodeLocation]);
  
  // Handle favorite selection
  const handleFavoriteSelect = useCallback((favorite) => {
    setLocationInput(favorite.name);
    setShowLocationDropdown(false);
    
    // Try to geocode the favorite name
    if (mapInstanceRef.current && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: favorite.name }, (results, status) => {
        if (status === 'OK' && results[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };
          
          if (validateCoordinates(coords)) {
            mapInstanceRef.current.panTo(coords);
            mapInstanceRef.current.setZoom(PLACE_ZOOM);
            setGpsCoords(coords);
            
            // Pin animation
            if (pinAnimationRef.current) {
              pinAnimationRef.current.classList.add('animate-pin-pulse');
              setTimeout(() => {
                if (pinAnimationRef.current) {
                  pinAnimationRef.current.classList.remove('animate-pin-pulse');
                }
              }, PIN_ANIMATION_DURATION_MS);
            }
          }
        }
      });
    }
    
    logAnalyticsEvent('favorite_location_selected', { favoriteId: favorite.id });
  }, [setLocationInput, setGpsCoords, setShowLocationDropdown]);
  
  // Handle recent search selection
  const handleRecentSelect = useCallback((recent) => {
    setLocationInput(recent.location);
    setShowLocationDropdown(false);
    
    if (recent.coords && validateCoordinates(recent.coords) && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(recent.coords);
      mapInstanceRef.current.setZoom(PLACE_ZOOM);
      setGpsCoords(recent.coords);
    }
    
    logAnalyticsEvent('recent_search_selected');
  }, [setLocationInput, setGpsCoords, setShowLocationDropdown]);
  
  // Memoized favorites
  const favoritesWithDistance = favorites.map(fav => ({ ...fav, distance: null }));
  
  return (
    <div className="card p-0 overflow-hidden">
      <label className="block text-lg font-display text-text-primary p-6 pb-3 text-center">
        Create Check-In
      </label>

      {/* Map with overlays */}
      <div className="relative">
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-80 md:h-96"
          style={{ 
            minHeight: '320px',
            touchAction: 'pan-y pinch-zoom' // Allow vertical scrolling with one finger, prevent with two
          }}
          role="application"
          aria-label="Interactive map for location selection"
          aria-busy={!mapInitialized}
          onTouchStart={(e) => {
            // Only prevent default for multi-touch (pinch/zoom)
            if (e.touches.length > 1) {
              e.preventDefault();
            }
          }}
          onTouchMove={(e) => {
            // Only prevent default for multi-touch (pinch/zoom)
            if (e.touches.length > 1) {
              e.preventDefault();
            }
          }}
        ></div>
        
        {/* Map error state */}
        {mapError && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex items-center justify-center z-20">
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
              <p className="text-text-primary font-semibold mb-2">Map failed to load</p>
              <p className="text-sm text-text-secondary">Please refresh the page</p>
            </div>
          </div>
        )}

        {/* Search bar overlay */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="relative">
            <input
              ref={locationInputRef}
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                if (isGeocoding) {
                  setIsGeocoding(false);
                  if (geocodeTimeoutRef.current) {
                    clearTimeout(geocodeTimeoutRef.current);
                  }
                }
                setGeocodingError(false);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), DROPDOWN_CLOSE_DELAY_MS)}
              className={`input w-full shadow-soft-dreamy border-2 transition-all ${
                isGeocoding 
                  ? 'border-primary/50 bg-pink-50/50 dark:bg-pink-900/10' 
                  : geocodingError
                  ? 'border-orange-300 dark:border-orange-600 bg-orange-50/30 dark:bg-orange-900/10'
                  : 'border-pink-200/50 dark:border-gray-600 focus:border-primary'
              }`}
              placeholder="Search for a place or drag the map..."
              required
              autoComplete="off"
              aria-label="Location search"
              aria-busy={isGeocoding}
              aria-live="polite"
            />
            {isGeocoding && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-primary font-medium hidden sm:inline">Getting address...</span>
              </div>
            )}
            {geocodingError && !isGeocoding && (
              <button
                type="button"
                onClick={() => {
                  if (gpsCoords) {
                    geocodeLocation(gpsCoords, 'retry');
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                style={{ minWidth: MIN_TOUCH_TARGET_SIZE, minHeight: MIN_TOUCH_TARGET_SIZE }}
                title="Could not get address. Click to retry."
                aria-label="Retry getting address"
              >
                <span className="material-symbols-outlined text-orange-500 text-lg hover:text-orange-600">warning</span>
              </button>
            )}
          </div>
          
          {/* Location dropdown */}
          {showLocationDropdown && (
            <div className="mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-soft-dreamy border border-pink-200/50 dark:border-gray-600 overflow-hidden max-h-96 overflow-y-auto">
              {/* GPS Location */}
              {isEnabled('gpsLocation') && (
                <button
                  type="button"
                  onClick={() => {
                    handleGetLocation();
                    setShowLocationDropdown(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors text-left"
                  style={{ minHeight: MIN_TOUCH_TARGET_SIZE }}
                  aria-label="Use my current location"
                >
                  <span 
                    className="material-symbols-outlined icon-gradient-text text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    my_location
                  </span>
                  <span className="font-semibold text-text-primary">Your Location</span>
                </button>
              )}
              
              {/* Favorites */}
              {favoritesWithDistance.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase border-t border-pink-200/50 dark:border-gray-600">
                    Favorites
                  </div>
                  {favoritesWithDistance.map((favorite) => (
                    <button
                      key={favorite.id}
                      type="button"
                      onClick={() => handleFavoriteSelect(favorite)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors text-left"
                      style={{ minHeight: MIN_TOUCH_TARGET_SIZE }}
                    >
                      <span className="text-xl">{favorite.emoji}</span>
                      <span className="font-semibold text-text-primary flex-1">{favorite.name}</span>
                      {favorite.distance && (
                        <span className="text-xs text-text-secondary">{formatDistance(favorite.distance)}</span>
                      )}
                    </button>
                  ))}
                </>
              )}
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase border-t border-pink-200/50 dark:border-gray-600">
                    Recent
                  </div>
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRecentSelect(recent)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors text-left"
                      style={{ minHeight: MIN_TOUCH_TARGET_SIZE }}
                    >
                      <span className="material-symbols-outlined text-text-secondary">history</span>
                      <span className="text-text-primary flex-1">{recent.location}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fixed center pin */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none"
        >
          <span 
            ref={pinAnimationRef}
            className="material-symbols-outlined icon-gradient-text text-5xl drop-shadow-lg block"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            place
          </span>
        </div>

        {/* GPS button */}
        {isEnabled('gpsLocation') && (
          <button
            type="button"
            onClick={handleGetLocation}
            className="absolute right-3 top-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 p-3 rounded-lg shadow-soft-dreamy border border-pink-200/50 dark:border-gray-600 transition-all z-10 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            style={{ minWidth: MIN_TOUCH_TARGET_SIZE, minHeight: MIN_TOUCH_TARGET_SIZE }}
            disabled={loading}
            title="Use my current location"
            aria-label="Get my current location"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span 
                className="material-symbols-outlined icon-gradient-text text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                my_location
              </span>
            )}
          </button>
        )}
        
        {/* Subtle error notification */}
        {subtleError && (
          <SubtleNotification
            message={subtleError}
            type="warning"
            duration={5000}
            onDismiss={() => setSubtleError(null)}
          />
        )}
      </div>

      <p className="text-xs text-text-secondary p-3 px-6">
        💜 <strong className="text-primary">You are never alone.</strong> Your besties have your back
      </p>

      <style>{`
        @keyframes pin-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }
        .animate-pin-pulse {
          animation: pin-pulse ${PIN_ANIMATION_DURATION_MS}ms ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default CheckInMap;
