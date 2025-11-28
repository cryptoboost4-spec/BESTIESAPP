import React, { useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isEnabled } from '../../config/features';

const CheckInMap = ({
  locationInput,
  setLocationInput,
  gpsCoords,
  setGpsCoords,
  mapInitialized,
  setMapInitialized,
  mapLocked,
  setMapLocked,
  autocompleteLoaded,
  showLocationDropdown,
  setShowLocationDropdown,
  loading,
  setLoading
}) => {
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize Map when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !mapRef.current || mapInitialized) return;

    // Add extra validation that API is actually ready
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not fully ready yet, retrying...');
      return;
    }

    try {
      console.log('Initializing Google Map...');
      // Initialize Google Map - locked by default
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: false, // Start locked
        gestureHandling: 'none', // Disable all gestures initially
      });

      // Handle double-tap to unlock/place pin
      mapInstanceRef.current.addListener('dblclick', (event) => {
        if (mapLocked) {
          // Unlock the map
          setMapLocked(false);
          mapInstanceRef.current.setOptions({
            draggable: true,
            gestureHandling: 'greedy'
          });
          toast.success('🗺️ Map unlocked! Drag to explore', { duration: 2000 });
        } else {
          // Place pin at MAP CENTER (where the fixed pin is displayed)
          const mapCenter = mapInstanceRef.current.getCenter();
          const coords = { lat: mapCenter.lat(), lng: mapCenter.lng() };

          // Save the center coordinates
          setGpsCoords(coords);

          // Reverse geocode to get address from the center pin location
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              setLocationInput(address);
              console.log('Pin placed, location updated to:', address);
            } else {
              // Fallback to coordinates if geocoding fails
              const coordsString = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
              setLocationInput(coordsString);
              console.log('Pin placed, using coordinates:', coordsString);
            }
          });

          // Show success feedback
          toast.success('📍 Pin location saved!', { duration: 1500 });
        }
      });

      // Handle map drag - update location instantly when map is dragged
      mapInstanceRef.current.addListener('dragend', () => {
        if (!mapLocked) {
          // Get the center of the map (where the pin is)
          const mapCenter = mapInstanceRef.current.getCenter();
          const coords = { lat: mapCenter.lat(), lng: mapCenter.lng() };

          // Save the center coordinates
          setGpsCoords(coords);

          // Reverse geocode to get address and update search bar
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              setLocationInput(address);
              console.log('Map dragged, location updated to:', address);
            } else {
              // Fallback to coordinates if geocoding fails
              const coordsString = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
              setLocationInput(coordsString);
              console.log('Map dragged, using coordinates:', coordsString);
            }
          });
        }
      });

      // Show reminder on single click when locked
      mapInstanceRef.current.addListener('click', () => {
        if (mapLocked) {
          toast('💡 Double-tap to unlock map!', {
            duration: 2000,
            icon: '🔒',
            style: {
              background: '#fef3c7',
              color: '#92400e',
              fontWeight: 600,
            }
          });
        }
      });

      setMapInitialized(true);
      console.log('Google Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map. Please refresh the page.', {
        duration: 4000,
        id: 'map-init-error'
      });
    }
  }, [autocompleteLoaded, mapInitialized, mapLocked, setGpsCoords, setLocationInput, setMapInitialized, setMapLocked]);

  // Initialize Autocomplete when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !locationInputRef.current) return;

    // Add extra validation that Places API is actually ready
    if (!window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.places.Autocomplete) {
      console.warn('Google Places API not fully ready yet, retrying...');
      return;
    }

    try {
      console.log('Initializing Google Places Autocomplete...');

      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['establishment', 'geocode'], // Allow both businesses and addresses
          fields: ['formatted_address', 'name', 'geometry'], // Request only needed fields
        }
      );

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();

          if (place.formatted_address) {
            // Use business name if available, otherwise use formatted address
            const displayLocation = place.name && place.name !== place.formatted_address
              ? `${place.name}, ${place.formatted_address}`
              : place.formatted_address;

            setLocationInput(displayLocation);

            // Center map on selected place (no marker needed - fixed pin in center)
            if (place.geometry && place.geometry.location && mapInstanceRef.current) {
              const location = place.geometry.location;
              const coords = { lat: location.lat(), lng: location.lng() };
              mapInstanceRef.current.setCenter(coords);
              mapInstanceRef.current.setZoom(15);
              setGpsCoords(coords); // Store coordinates
            }
          }
        } catch (error) {
          console.error('Error handling place selection:', error);
          toast.error('Error selecting location. Please try again.', {
            duration: 3000
          });
        }
      });

      console.log('Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      toast.error('Could not initialize address search. Please type your location manually.', {
        duration: 4000,
        id: 'autocomplete-init-error'
      });
    }

    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [autocompleteLoaded, setGpsCoords, setLocationInput]);

  // Update map when GPS coordinates are available
  useEffect(() => {
    if (!gpsCoords || !mapInstanceRef.current) return;

    try {
      // Center map on GPS location (fixed pin shows the location)
      mapInstanceRef.current.setCenter(gpsCoords);
      mapInstanceRef.current.setZoom(16);
    } catch (error) {
      console.error('Error updating map with GPS:', error);
    }
  }, [gpsCoords]);

  const handleGetLocation = () => {
    if (!isEnabled('gpsLocation')) {
      toast.error('GPS location is not enabled');
      return;
    }

    if (navigator.geolocation) {
      setLoading(true);
      toast.loading('Getting your location...', { id: 'gps-loading' });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const gpsCoords = { lat, lng };

          // Use reverse geocoding to get address from coordinates
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: gpsCoords }, (results, status) => {
            toast.dismiss('gps-loading');
            setLoading(false);

            if (status === 'OK' && results[0]) {
              setLocationInput(results[0].formatted_address);
              toast.success('Location captured!', { duration: 2000 });
            } else {
              // Fallback to coordinates if geocoding fails
              setLocationInput(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              toast.success('Location captured (coordinates only)', { duration: 2000 });
            }

            setGpsCoords(gpsCoords); // Store coordinates for map
          });
        },
        (error) => {
          toast.dismiss('gps-loading');
          setLoading(false);
          console.error('Geolocation error:', error);

          // Provide specific error messages based on error code
          if (error.code === 1) {
            toast.error('Location permission denied. Please enable location access in your browser settings.', { duration: 6000 });
          } else if (error.code === 2) {
            toast.error('Location unavailable. Make sure location services are enabled on your device.', { duration: 5000 });
          } else if (error.code === 3) {
            toast.error('Location request timed out. Please try again or search for your location.', { duration: 5000 });
          } else {
            toast.error('Could not get location. Please search manually.', { duration: 4000 });
          }
        },
        {
          timeout: 30000, // 30 second timeout (increased from 10s)
          enableHighAccuracy: true, // Better accuracy
          maximumAge: 0 // Don't use cached location
        }
      );
    } else {
      toast.error('Geolocation not supported by your browser. Please search for your location manually.');
    }
  };

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
          className="w-full h-80"
          style={{ minHeight: '320px' }}
        ></div>

        {/* Search bar overlay */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <input
            ref={locationInputRef}
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onFocus={() => setShowLocationDropdown(true)}
            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            className="input w-full shadow-lg"
            placeholder="Where are you? (optional)"
            autoComplete="off"
          />
          {/* Location dropdown */}
          {showLocationDropdown && isEnabled('gpsLocation') && (
            <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  handleGetLocation();
                  setShowLocationDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
                <span className="font-semibold text-text-primary">Your Location</span>
              </button>
            </div>
          )}
        </div>

        {/* Fixed center pin - doesn't move, map moves underneath */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
          <svg
            className="w-12 h-12 text-primary drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>

        {/* Locate me button overlay - positioned below search bar */}
        {isEnabled('gpsLocation') && (
          <button
            type="button"
            onClick={handleGetLocation}
            className="absolute right-3 top-20 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 p-3 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 transition-all z-10"
            disabled={loading}
            title="Use my current location"
          >
            {loading ? (
              <div className="w-5 h-5 spinner-small"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary p-3 px-6">
        💡 <strong className="text-primary">Double-tap to unlock the map,</strong> then drag to move it and double-tap again to save
      </p>
    </div>
  );
};

export default CheckInMap;
