import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { isEnabled } from '../../config/features';
import { useAuth } from '../../contexts/AuthContext';
import errorTracker from '../../services/errorTracking';
import { logAnalyticsEvent } from '../../services/firebase';
// ErrorBoundary is handled at App level, no need to wrap here
import {
  GEOCODE_DEBOUNCE_MS,
  GEOCODE_TIMEOUT_MS,
  GPS_WATCH_TIMEOUT_MS,
  GPS_INIT_TIMEOUT_MS,
  GPS_CACHE_MAX_AGE_MS,
  DROPDOWN_CLOSE_DELAY_MS,
  PIN_ANIMATION_DURATION_MS,
  GEOCODE_RATE_LIMIT_MS,
  DEFAULT_ZOOM,
  GPS_ZOOM_DEFAULT,
  PLACE_ZOOM,
  INIT_USER_LOCATION_ZOOM,
  ZOOM_VERY_ACCURATE,
  ZOOM_GOOD_ACCURATE,
  ZOOM_MODERATE_ACCURATE,
  ZOOM_POOR_ACCURATE,
  ACCURACY_VERY_GOOD,
  ACCURACY_GOOD,
  ACCURACY_MODERATE,
  GPS_RETRY_THRESHOLD,
  COORDINATE_PRECISION,
  DEFAULT_LOCATION,
  MAP_BOUNDS,
  STORAGE_KEYS,
  MAP_STYLES,
  MIN_TOUCH_TARGET_SIZE,
  API_RETRY_MAX_ATTEMPTS,
  API_RETRY_DELAY_MS,
  API_RETRY_BACKOFF_MULTIPLIER
} from './mapConstants';
import {
  validateCoordinates,
  roundCoordinates,
  getCachedGeocode,
  cacheGeocode,
  getRecentSearches,
  addRecentSearch,
  calculateDistance,
  formatDistance,
  triggerHaptic,
  isWithinBounds
} from './mapUtils';

/**
 * Enhanced CheckInMap component with all improvements
 * 
 * Features:
 * - Geocoding cache
 * - Coordinate validation
 * - Rate limiting
 * - Error handling
 * - Accessibility
 * - Recent searches
 * - Favorite locations
 * - Map type toggle
 * - Smooth transitions
 * - Keyboard navigation
 * - And more...
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
  // Refs
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isDraggingRef = useRef(false);
  const geocodeTimeoutRef = useRef(null);
  const pinAnimationRef = useRef(null);
  const geocoderRef = useRef(null);
  const pendingGeocodeRef = useRef(null);
  const lastAccuracyRef = useRef(null);
  const mapListenersRef = useRef([]);
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastGeocodeTimeRef = useRef(0);
  const mapTypeRef = useRef('roadmap');
  const retryCountRef = useRef(0);
  const pinAnimationTimeoutsRef = useRef([]);
  const gpsWatchTimeoutRef = useRef(null);
  
  // Refs for callback functions to avoid dependency issues
  const getDefaultLocationRef = useRef(null);
  const geocodeLocationRef = useRef(null);
  const smoothPanToRef = useRef(null);
  const gpsCoordsRef = useRef(gpsCoords);
  
  // Update refs when values change
  useEffect(() => {
    gpsCoordsRef.current = gpsCoords;
  }, [gpsCoords]);
  
  // State
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Auth
  const { currentUser, userData } = useAuth();
  
  // Load favorites from user data
  useEffect(() => {
    if (userData?.favoriteLocations) {
      setFavorites(userData.favoriteLocations);
    }
  }, [userData]);
  
  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);
  
  // Get current location for distance calculations
  useEffect(() => {
    if (gpsCoords) {
      setCurrentLocation(gpsCoords);
    }
  }, [gpsCoords]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup all timeouts
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      if (gpsWatchTimeoutRef.current) {
        clearTimeout(gpsWatchTimeoutRef.current);
      }
      // Cleanup pin animation timeouts
      pinAnimationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      pinAnimationTimeoutsRef.current = [];
      // Cleanup geocoding
      pendingGeocodeRef.current = null;
      // Cleanup GPS watch
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // Cleanup map listeners
      if (mapInstanceRef.current && mapListenersRef.current.length > 0) {
        mapListenersRef.current.forEach(listener => {
          window.google?.maps?.event?.removeListener(listener);
        });
        mapListenersRef.current = [];
      }
    };
  }, []);
  
  // Helper: Get zoom level based on accuracy
  const getZoomForAccuracy = useCallback((accuracy) => {
    if (!accuracy || accuracy < 0) return GPS_ZOOM_DEFAULT;
    if (accuracy < ACCURACY_VERY_GOOD) return ZOOM_VERY_ACCURATE;
    if (accuracy < ACCURACY_GOOD) return ZOOM_GOOD_ACCURATE;
    if (accuracy < ACCURACY_MODERATE) return ZOOM_MODERATE_ACCURATE;
    return ZOOM_POOR_ACCURATE;
  }, []);
  
  // Helper: Get default location
  const getDefaultLocation = useCallback(() => {
    const currentGpsCoords = gpsCoordsRef.current;
    if (currentGpsCoords && validateCoordinates(currentGpsCoords)) {
      return currentGpsCoords;
    }
    return DEFAULT_LOCATION;
  }, []);
  
  // Store in ref for useEffect access
  useEffect(() => {
    getDefaultLocationRef.current = getDefaultLocation;
  }, [getDefaultLocation]);
  
  // Helper: Perform geocoding with cache, timeout, and rate limiting
  const performGeocoding = useCallback((coords, onSuccess, onError) => {
    // Validate coordinates
    if (!validateCoordinates(coords)) {
      onError('INVALID_COORDINATES');
      return;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastGeocodeTimeRef.current < GEOCODE_RATE_LIMIT_MS) {
      onError('RATE_LIMITED');
      return;
    }
    lastGeocodeTimeRef.current = now;
    
    // Check cache first
    const cached = getCachedGeocode(coords);
    if (cached) {
      onSuccess(cached);
      return;
    }
    
    // Create geocoder if needed
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    
    const requestId = Date.now();
    pendingGeocodeRef.current = requestId;
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (pendingGeocodeRef.current === requestId) {
        pendingGeocodeRef.current = null;
        onError('TIMEOUT');
      }
    }, GEOCODE_TIMEOUT_MS);
    
    // Perform geocoding
    geocoderRef.current.geocode({ location: coords }, (results, status) => {
      clearTimeout(timeoutId);
      
      // Ignore if not latest request
      if (pendingGeocodeRef.current !== requestId) {
        return;
      }
      pendingGeocodeRef.current = null;
      
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        // Cache result
        cacheGeocode(coords, address);
        onSuccess(address);
      } else {
        onError(status);
      }
    });
  }, []);
  
  // Helper: Geocode location with debouncing (optimized for cache hits)
  const geocodeLocation = useCallback((coords, source = 'click', retry = false) => {
    // Validate coordinates
    if (!validateCoordinates(coords)) {
      errorTracker.logCustomError('Invalid coordinates in geocodeLocation', { coords, source });
      return;
    }
    
    // Round coordinates
    const rounded = roundCoordinates(coords);
    
    // Clear pending geocoding
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    // Cancel in-flight requests
    if (pendingGeocodeRef.current) {
      pendingGeocodeRef.current = null;
    }
    
    // Show coordinates immediately
    const coordsString = `${rounded.lat.toFixed(COORDINATE_PRECISION)}, ${rounded.lng.toFixed(COORDINATE_PRECISION)}`;
    if (isMountedRef.current) {
      setLocationInput(coordsString);
      setGpsCoords(rounded);
      if (!retry) {
        setGeocodingError(false);
      }
    }
    
    // Check cache first - if cache hit, skip debounce for instant response
    const cached = getCachedGeocode(rounded);
    if (cached) {
      // Cache hit - update immediately, no debounce
      if (isMountedRef.current) {
        setLocationInput(cached);
        setGeocodingError(false);
        
        // Add to recent searches
        addRecentSearch(cached, rounded);
        setRecentSearches(getRecentSearches());
        
        // Trigger pin animation
        if (pinAnimationRef.current) {
          pinAnimationRef.current.classList.add('animate-pin-pulse');
          const timeoutId = setTimeout(() => {
            if (pinAnimationRef.current) {
              pinAnimationRef.current.classList.remove('animate-pin-pulse');
            }
            pinAnimationTimeoutsRef.current = pinAnimationTimeoutsRef.current.filter(id => id !== timeoutId);
          }, PIN_ANIMATION_DURATION_MS);
          pinAnimationTimeoutsRef.current.push(timeoutId);
        }
        
        // Haptic feedback
        triggerHaptic([10]);
        
        // Analytics
        logAnalyticsEvent('map_location_geocoded', { source, cached: true });
      }
      return;
    }
    
    // Cache miss - debounce geocoding request
    geocodeTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      setIsGeocoding(true);
      
      performGeocoding(
        rounded,
        (address) => {
          if (!isMountedRef.current) return;
          setIsGeocoding(false);
          setLocationInput(address);
          setGeocodingError(false);
          
          // Add to recent searches
          addRecentSearch(address, rounded);
          setRecentSearches(getRecentSearches());
          
          // Trigger pin animation
          if (pinAnimationRef.current) {
            pinAnimationRef.current.classList.add('animate-pin-pulse');
            const timeoutId = setTimeout(() => {
              if (pinAnimationRef.current) {
                pinAnimationRef.current.classList.remove('animate-pin-pulse');
              }
              pinAnimationTimeoutsRef.current = pinAnimationTimeoutsRef.current.filter(id => id !== timeoutId);
            }, PIN_ANIMATION_DURATION_MS);
            pinAnimationTimeoutsRef.current.push(timeoutId);
          }
          
          // Haptic feedback
          triggerHaptic([10]);
          
          // Analytics
          logAnalyticsEvent('map_location_geocoded', { source, cached: false });
        },
        (status) => {
          if (!isMountedRef.current) return;
          setIsGeocoding(false);
          setLocationInput(coordsString);
          setGeocodingError(true);
          
          // Log error
          errorTracker.logCustomError('Geocoding failed', { status, source, coords: rounded });
        }
      );
    }, GEOCODE_DEBOUNCE_MS);
  }, [setLocationInput, setGpsCoords, performGeocoding]);
  
  // Store in ref for useEffect access
  useEffect(() => {
    geocodeLocationRef.current = geocodeLocation;
  }, [geocodeLocation]);
  
  // Helper: Smooth map transition
  const smoothPanTo = useCallback((coords, zoom = null) => {
    if (!mapInstanceRef.current || !validateCoordinates(coords)) return;
    
    if (zoom !== null) {
      mapInstanceRef.current.setZoom(zoom);
    }
    
    mapInstanceRef.current.panTo(coords);
  }, []);
  
  // Store in ref for useEffect access
  useEffect(() => {
    smoothPanToRef.current = smoothPanTo;
  }, [smoothPanTo]);
  
  // Pre-initialize geocoder for faster geocoding
  useEffect(() => {
    if (window.google?.maps?.Geocoder && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);
  
  // Track when mapRef becomes available
  const [mapRefReady, setMapRefReady] = useState(false);
  
  // Use callback ref to detect when map div is mounted
  const mapRefCallback = useCallback((node) => {
    mapRef.current = node;
    if (node) {
      setMapRefReady(true);
    }
  }, []);
  
  // Initialize map with retry logic
  useEffect(() => {
    // Map can initialize as soon as Maps API is ready, doesn't need Places API
    if (!mapRef.current || mapInitialized) return;
    
    let keyboardCleanup = null;
    let isCleanedUp = false;
    
    const initializeMap = () => {
      // Validate API is ready
      if (!window.google?.maps?.Map) {
        retryCountRef.current++;
        if (retryCountRef.current < API_RETRY_MAX_ATTEMPTS) {
          setTimeout(() => {
            if (isMountedRef.current && !mapInitialized && !isCleanedUp) {
              initializeMap();
            }
          }, API_RETRY_DELAY_MS * Math.pow(API_RETRY_BACKOFF_MULTIPLIER, retryCountRef.current - 1));
        } else {
          errorTracker.logCustomError('Google Maps API failed to load after retries', { attempts: retryCountRef.current });
          if (!isCleanedUp) {
            setMapLoading(false);
            toast.error('Map failed to load. Please refresh the page.', {
              duration: 5000,
              id: 'map-init-error'
            });
          }
        }
        return;
      }
      
      try {
        retryCountRef.current = 0;
        const defaultLocation = getDefaultLocationRef.current ? getDefaultLocationRef.current() : DEFAULT_LOCATION;
        
        // Initialize map
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
          gestureHandling: 'cooperative', // Cooperative mode prevents page zoom on pinch
          disableDoubleClickZoom: false,
          scrollwheel: true,
          styles: MAP_STYLES,
          restriction: {
            latLngBounds: MAP_BOUNDS,
            strictBounds: false
          }
        });
        
        // Restore map type
        const savedMapType = localStorage.getItem(STORAGE_KEYS.MAP_TYPE) || 'roadmap';
        mapTypeRef.current = savedMapType;
        mapInstanceRef.current.setMapTypeId(savedMapType);
        
        // Try to get user location (non-blocking)
        if (navigator.geolocation && !gpsCoordsRef.current) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isMountedRef.current || !mapInstanceRef.current || isDraggingRef.current) return;
              
              const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              
              if (validateCoordinates(coords) && isWithinBounds(coords, MAP_BOUNDS)) {
                if (smoothPanToRef.current) {
                  smoothPanToRef.current(coords, INIT_USER_LOCATION_ZOOM);
                }
              }
            },
            () => {
              // Silent fail
            },
            {
              timeout: GPS_INIT_TIMEOUT_MS,
              maximumAge: GPS_CACHE_MAX_AGE_MS
            }
          );
        }
        
        // Map click handler
        const clickListener = mapInstanceRef.current.addListener('click', (event) => {
          setShowLocationDropdown(false);
          
          if (!isDraggingRef.current) {
            const coords = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            };
            
            if (validateCoordinates(coords) && geocodeLocationRef.current) {
              geocodeLocationRef.current(coords, 'clicked');
            }
          }
        });
        mapListenersRef.current.push(clickListener);
        
        // Drag start handler
        const dragStartListener = mapInstanceRef.current.addListener('dragstart', () => {
          isDraggingRef.current = true;
          setIsDragging(true);
          setGeocodingError(false);
        });
        mapListenersRef.current.push(dragStartListener);
        
        // Drag end handler
        const dragEndListener = mapInstanceRef.current.addListener('dragend', () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          
          if (mapInstanceRef.current) {
            const mapCenter = mapInstanceRef.current.getCenter();
            const coords = {
              lat: mapCenter.lat(),
              lng: mapCenter.lng()
            };
            
            if (validateCoordinates(coords) && geocodeLocationRef.current) {
              geocodeLocationRef.current(coords, 'dragged');
            }
          }
        });
        mapListenersRef.current.push(dragEndListener);
        
        // Keyboard navigation
        const handleKeyDown = (e) => {
          if (!mapInstanceRef.current) return;
          
          const center = mapInstanceRef.current.getCenter();
          if (!center) return;
          
          const step = 0.001; // Small step for arrow keys
          let newCoords = { lat: center.lat(), lng: center.lng() };
          
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              newCoords.lat += step;
              break;
            case 'ArrowDown':
              e.preventDefault();
              newCoords.lat -= step;
              break;
            case 'ArrowLeft':
              e.preventDefault();
              newCoords.lng -= step;
              break;
            case 'ArrowRight':
              e.preventDefault();
              newCoords.lng += step;
              break;
            case '+':
            case '=':
              e.preventDefault();
              mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
              return;
            case '-':
            case '_':
              e.preventDefault();
              mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
              return;
            default:
              return;
          }
          
          if (validateCoordinates(newCoords) && isWithinBounds(newCoords, MAP_BOUNDS)) {
            if (smoothPanToRef.current) {
              smoothPanToRef.current(newCoords);
            }
            if (geocodeLocationRef.current) {
              geocodeLocationRef.current(newCoords, 'keyboard');
            }
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        // Store cleanup function
        keyboardCleanup = () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
        
        if (!isCleanedUp) {
          setMapInitialized(true);
          setMapLoading(false);
          logAnalyticsEvent('map_initialized');
        }
      } catch (error) {
        errorTracker.logError({
          type: 'map_init_error',
          message: error.message,
          stack: error.stack
        });
        
        toast.error('Failed to initialize map. Please refresh the page.', {
          duration: 4000,
          id: 'map-init-error'
        });
        if (!isCleanedUp) {
          setMapLoading(false);
        }
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      isCleanedUp = true;
      if (keyboardCleanup) {
        keyboardCleanup();
      }
      // Cleanup map listeners
      if (mapInstanceRef.current && mapListenersRef.current.length > 0) {
        mapListenersRef.current.forEach(listener => {
          try {
            window.google?.maps?.event?.removeListener(listener);
          } catch (e) {
            // Ignore cleanup errors
          }
        });
        mapListenersRef.current = [];
      }
    };
  }, [mapInitialized, mapRefReady]); // Only depend on initialization state and mapRef availability
  
  // Initialize autocomplete
  useEffect(() => {
    if (!autocompleteLoaded || !locationInputRef.current) return;
    
    if (!window.google?.maps?.places?.Autocomplete) {
      return;
    }
    
    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'name', 'geometry'],
        }
      );
      
      const placeChangedListener = autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();
          
          if (place.formatted_address) {
            // Cancel pending geocoding
            if (geocodeTimeoutRef.current) {
              clearTimeout(geocodeTimeoutRef.current);
            }
            setIsGeocoding(false);
            setGeocodingError(false);
            
            // Use business name if available
            const displayLocation = place.name && place.name !== place.formatted_address
              ? `${place.name}, ${place.formatted_address}`
              : place.formatted_address;
            
            setLocationInput(displayLocation);
            
            // Add to recent searches
            addRecentSearch(displayLocation);
            setRecentSearches(getRecentSearches());
            
            // Center map on place
            if (place.geometry?.location && mapInstanceRef.current) {
              const location = place.geometry.location;
              const coords = {
                lat: location.lat(),
                lng: location.lng()
              };
              
              if (validateCoordinates(coords) && smoothPanToRef.current) {
                smoothPanToRef.current(coords, PLACE_ZOOM);
                setGpsCoords(coords);
                
                // Pin animation
                if (pinAnimationRef.current) {
                  pinAnimationRef.current.classList.add('animate-pin-pulse');
                  const timeoutId = setTimeout(() => {
                    if (pinAnimationRef.current) {
                      pinAnimationRef.current.classList.remove('animate-pin-pulse');
                    }
                    pinAnimationTimeoutsRef.current = pinAnimationTimeoutsRef.current.filter(id => id !== timeoutId);
                  }, PIN_ANIMATION_DURATION_MS);
                  pinAnimationTimeoutsRef.current.push(timeoutId);
                }
                
                // Haptic feedback
                triggerHaptic([10]);
                
                // Analytics
                logAnalyticsEvent('map_place_selected', { hasName: !!place.name });
              }
            }
          }
        } catch (error) {
          errorTracker.logError({
            type: 'place_selection_error',
            message: error.message,
            stack: error.stack
          });
          
          toast.error('Error selecting location. Please try again.', {
            duration: 3000
          });
        }
      });
      
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.removeListener(placeChangedListener);
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      errorTracker.logError({
        type: 'autocomplete_init_error',
        message: error.message,
        stack: error.stack
      });
      
      toast.error('Could not initialize address search. Please type your location manually.', {
        duration: 4000,
        id: 'autocomplete-init-error'
      });
    }
  }, [autocompleteLoaded, setGpsCoords, setLocationInput, smoothPanTo]);
  
  // Update map when GPS coordinates change
  useEffect(() => {
    if (!gpsCoords || !mapInstanceRef.current || isDraggingRef.current) return;
    
    if (!validateCoordinates(gpsCoords)) return;
    
    try {
      const zoom = lastAccuracyRef.current
        ? getZoomForAccuracy(lastAccuracyRef.current)
        : GPS_ZOOM_DEFAULT;
      
      if (smoothPanToRef.current) {
        smoothPanToRef.current(gpsCoords, zoom);
      }
    } catch (error) {
      errorTracker.logCustomError('Error updating map with GPS', { error: error.message });
    }
  }, [gpsCoords, getZoomForAccuracy]); // Removed smoothPanTo from dependencies
  
  // Process GPS location (defined before handleGetLocation)
  const processGPSLocation = useCallback((coords, accuracy) => {
    if (!isMountedRef.current) return;
    
    performGeocoding(
      coords,
      (address) => {
        if (!isMountedRef.current) return;
        toast.dismiss('gps-loading');
        setLoading(false);
        setLocationInput(address);
        setGeocodingError(false);
        toast.success(`Location captured! (Accuracy: ${Math.round(accuracy)}m)`, { duration: 2000 });
        setGpsCoords(coords);
        
        // Add to recent searches
        addRecentSearch(address, coords);
        setRecentSearches(getRecentSearches());
        
        // Analytics
        logAnalyticsEvent('gps_location_captured', { accuracy: Math.round(accuracy) });
      },
      (status) => {
        if (!isMountedRef.current) return;
        toast.dismiss('gps-loading');
        setLoading(false);
        const coordsString = `${coords.lat.toFixed(COORDINATE_PRECISION)}, ${coords.lng.toFixed(COORDINATE_PRECISION)}`;
        setLocationInput(coordsString);
        setGeocodingError(true);
        toast.success(`Location captured (Accuracy: ${Math.round(accuracy)}m)`, { duration: 2000 });
        setGpsCoords(coords);
      }
    );
  }, [performGeocoding, setLocationInput, setGpsCoords, setLoading]);
  
  // GPS location handler
  const handleGetLocation = useCallback(() => {
    if (!isEnabled('gpsLocation')) {
      toast.error('GPS location is not enabled');
      return;
    }
    
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser. Please search for your location manually.');
      return;
    }
    
    setLoading(true);
    setGeocodingError(false);
    toast.loading('Getting your location...', { id: 'gps-loading' });
    
    // Use watchPosition for better accuracy
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        // Validate coordinates
        const coords = { lat, lng };
        if (!validateCoordinates(coords)) {
          navigator.geolocation.clearWatch(watchId);
          toast.dismiss('gps-loading');
          setLoading(false);
          toast.error('Invalid location received. Please try again.');
          return;
        }
        
        // Stop watching
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
        
        // If accuracy is poor, try getCurrentPosition
        if (accuracy > GPS_RETRY_THRESHOLD) {
          navigator.geolocation.getCurrentPosition(
            (betterPosition) => {
              const betterCoords = {
                lat: betterPosition.coords.latitude,
                lng: betterPosition.coords.longitude
              };
              const betterAccuracy = betterPosition.coords.accuracy;
              
              if (validateCoordinates(betterCoords)) {
                lastAccuracyRef.current = betterAccuracy;
                processGPSLocation(betterCoords, betterAccuracy);
              } else {
                processGPSLocation(coords, accuracy);
              }
            },
            () => {
              // Fallback to first reading
              processGPSLocation(coords, accuracy);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          // Good accuracy
          lastAccuracyRef.current = accuracy;
          processGPSLocation(coords, accuracy);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
        toast.dismiss('gps-loading');
        setLoading(false);
        
        let errorMessage = 'Could not get your location. Please search manually.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location unavailable. Please check your GPS settings.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        toast.error(errorMessage, { duration: 5000 });
        
        errorTracker.logCustomError('GPS location error', {
          code: error.code,
          message: errorMessage
        });
        
        // Fallback to getCurrentPosition
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            const accuracy = position.coords.accuracy;
            
            if (validateCoordinates(coords)) {
              lastAccuracyRef.current = accuracy;
              processGPSLocation(coords, accuracy);
            }
          },
          () => {
            // Final failure
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    
    watchIdRef.current = watchId;
    
    // Stop watching after timeout
    if (gpsWatchTimeoutRef.current) {
      clearTimeout(gpsWatchTimeoutRef.current);
    }
    gpsWatchTimeoutRef.current = setTimeout(() => {
      if (watchIdRef.current === watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
      }
      gpsWatchTimeoutRef.current = null;
    }, GPS_WATCH_TIMEOUT_MS);
  }, [processGPSLocation]);
  
  // Toggle map type
  
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
          
          if (validateCoordinates(coords) && smoothPanToRef.current) {
            smoothPanToRef.current(coords, PLACE_ZOOM);
            setGpsCoords(coords);
            
            // Pin animation
            if (pinAnimationRef.current) {
              pinAnimationRef.current.classList.add('animate-pin-pulse');
              const timeoutId = setTimeout(() => {
                if (pinAnimationRef.current) {
                  pinAnimationRef.current.classList.remove('animate-pin-pulse');
                }
                pinAnimationTimeoutsRef.current = pinAnimationTimeoutsRef.current.filter(id => id !== timeoutId);
              }, PIN_ANIMATION_DURATION_MS);
              pinAnimationTimeoutsRef.current.push(timeoutId);
            }
          }
        }
      });
    }
    
    logAnalyticsEvent('favorite_location_selected', { favoriteId: favorite.id });
  }, [smoothPanTo, setGpsCoords, setLocationInput, setShowLocationDropdown]);
  
  // Handle recent search selection
  const handleRecentSelect = useCallback((recent) => {
    setLocationInput(recent.location);
    setShowLocationDropdown(false);
    
    if (recent.coords && validateCoordinates(recent.coords) && smoothPanToRef.current) {
      smoothPanToRef.current(recent.coords, PLACE_ZOOM);
      setGpsCoords(recent.coords);
    }
    
    logAnalyticsEvent('recent_search_selected');
  }, [smoothPanTo, setGpsCoords, setLocationInput, setShowLocationDropdown]);
  
  // Memoized favorites with distance
  const favoritesWithDistance = useMemo(() => {
    if (!currentLocation || favorites.length === 0) return favorites;
    
    return favorites.map(fav => {
      // Try to get coords from cache or calculate
      const distance = null; // Would need to geocode favorite name first
      return { ...fav, distance };
    });
  }, [favorites, currentLocation]);
  
  // Always render map div immediately - no skeleton blocking
  return (
    <div className="card p-0 overflow-hidden">
        <label className="block text-lg font-display text-text-primary p-6 pb-3 text-center">
          Create Check-In
        </label>

        {/* Map with overlays */}
        <div className="relative">
          {/* Map Container */}
          <div
            ref={mapRefCallback}
            className="w-full h-80 md:h-96"
            style={{ minHeight: '320px' }}
            role="application"
            aria-label="Interactive map for location selection"
            aria-busy={!mapInitialized}
          ></div>

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
                aria-atomic="true"
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
                      geocodeLocation(gpsCoords, 'retry', true);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{ minWidth: MIN_TOUCH_TARGET_SIZE, minHeight: MIN_TOUCH_TARGET_SIZE }}
                  title="Could not get address. Click to retry."
                  aria-label="Retry getting address for this location"
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
          
          {/* Drag indicator */}
          {isDragging && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium z-20 pointer-events-none">
              Release to update location
            </div>
          )}
        </div>

        <p className="text-xs text-text-secondary p-3 px-6">
          💜 <strong className="text-primary">Your safety matters.</strong> Add as much location detail as you'd like to share
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
