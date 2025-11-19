import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { isEnabled } from '../config/features';
import errorTracker from '../services/errorTracking';

const CreateCheckInPage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [locationInput, setLocationInput] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedBesties, setSelectedBesties] = useState([]);
  const [notes, setNotes] = useState('');
  const [meetingWith, setMeetingWith] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [besties, setBesties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null); // Store GPS coordinates for map display
  const [mapInitialized, setMapInitialized] = useState(false);

  // Map default center (San Francisco)
  const mapCenter = { lat: 37.7749, lng: -122.4194 };

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Auto-redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (authLoading) return;

    if (userData && userData.onboardingCompleted === false) {
      navigate('/onboarding');
    }
  }, [userData, authLoading, navigate]);


  useEffect(() => {
    errorTracker.trackFunnelStep('checkin', 'view_create_page');

    // Load from quick button or template
    if (location.state?.quickMinutes) {
      errorTracker.trackFunnelStep('checkin', 'use_quick_button', { minutes: location.state.quickMinutes });
      setDuration(location.state.quickMinutes);
    }

    if (location.state?.template) {
      errorTracker.trackFunnelStep('checkin', 'use_template');
      const template = location.state.template;
      setLocationInput(template.location || '');
      setDuration(template.duration || 30);
      setSelectedBesties(template.bestieIds || []);
      setNotes(template.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Load besties when currentUser is available
  useEffect(() => {
    if (!currentUser || authLoading) return;

    console.group('🔍 Setting up Bestie Circle Listener');

    // Set up real-time listener for user's featuredCircle
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
      try {
        if (!userDoc.exists()) {
          console.error('❌ User document does not exist');
          console.groupEnd();
          setBesties([]);
          return;
        }

        const userData = userDoc.data();
        const featuredIds = userData.featuredCircle || [];

        console.log('🔄 Real-time update - featuredCircle:', featuredIds);
        console.log('featuredCircle length:', featuredIds.length);

        if (featuredIds.length === 0) {
          console.warn('⚠️ featuredCircle is empty - no besties to load');
          setBesties([]);
          return;
        }

        // Get all accepted besties to find the ones in the circle
        console.log('📡 Querying besties collection...');
        const [requesterQuery, recipientQuery] = await Promise.all([
          getDocs(
            query(
              collection(db, 'besties'),
              where('requesterId', '==', currentUser.uid),
              where('status', '==', 'accepted')
            )
          ),
          getDocs(
            query(
              collection(db, 'besties'),
              where('recipientId', '==', currentUser.uid),
              where('status', '==', 'accepted')
            )
          ),
        ]);

        console.log('Requester query results:', requesterQuery.size);
        console.log('Recipient query results:', recipientQuery.size);

        const allBestiesList = [];

        requesterQuery.forEach((doc) => {
          const data = doc.data();
          allBestiesList.push({
            id: data.recipientId,
            name: data.recipientName || 'Bestie',
            phone: data.recipientPhone,
          });
        });

        recipientQuery.forEach((doc) => {
          const data = doc.data();
          allBestiesList.push({
            id: data.requesterId,
            name: data.requesterName || 'Bestie',
            phone: data.requesterPhone,
          });
        });

        console.log('All besties found:', allBestiesList);
        console.log('Filtering for featuredCircle IDs:', featuredIds);

        // Filter to only show besties in the featured circle
        const circleBesties = allBestiesList.filter(b => {
          const inCircle = featuredIds.includes(b.id);
          console.log(`Bestie ${b.name} (${b.id}): ${inCircle ? 'IN' : 'NOT IN'} circle`);
          return inCircle;
        });

        console.log('✅ Circle besties after filtering:', circleBesties);

        setBesties(circleBesties);

        // Auto-select all besties in circle when they load (only if not loading from template)
        if (!location.state?.template && circleBesties.length > 0) {
          setSelectedBesties(circleBesties.map(b => b.id));
        }
      } catch (error) {
        console.error('Error loading besties:', error);
        toast.error('Failed to load besties');
      }
    }, (error) => {
      console.error('Error in featuredCircle listener:', error);
      toast.error('Failed to load besties');
    });

    console.groupEnd();

    // Cleanup listener on unmount
    return () => {
      console.log('🔌 Cleaning up featuredCircle listener');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

  // Load Google Places API
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      toast.error('Address autocomplete is not available. Please type your location manually.', {
        duration: 5000,
        id: 'maps-api-missing'
      });
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setAutocompleteLoaded(true);
      return;
    }

    // Load script
    // Note: Using legacy Autocomplete API (not PlaceAutocompleteElement)
    // Google will give 12+ months notice before deprecating this API
    // Migration to PlaceAutocompleteElement can be done in a future update
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setAutocompleteLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      toast.error('Failed to load address autocomplete', { duration: 2000 });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Map when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !mapRef.current || mapInitialized) return;

    try {
      // Initialize Google Map with draggable enabled
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: true, // Enable dragging
        gestureHandling: 'greedy', // Allow single-finger drag on mobile
      });

      // Update location when map is dragged
      mapInstanceRef.current.addListener('dragend', () => {
        const center = mapInstanceRef.current.getCenter();
        const coords = { lat: center.lat(), lng: center.lng() };
        setGpsCoords(coords);

        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setLocationInput(results[0].formatted_address);
          }
        });
      });

      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
    // mapCenter is a constant, not state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autocompleteLoaded, mapInitialized]);

  // Initialize Autocomplete when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !locationInputRef.current) return;

    try {
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
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }

    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [autocompleteLoaded]);

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

  const toggleBestie = (bestieId) => {
    if (selectedBesties.includes(bestieId)) {
      setSelectedBesties(selectedBesties.filter(id => id !== bestieId));
    } else {
      if (selectedBesties.length >= 5) {
        toast.error('Maximum 5 besties per check-in');
        return;
      }
      setSelectedBesties([...selectedBesties, bestieId]);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the 5 photo limit
    if (photoFiles.length + files.length > 5) {
      toast.error('You can only upload up to 5 photos per check-in');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Photos must be less than 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
    }

    // Add files and previews
    setPhotoFiles([...photoFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedBesties.length === 0) {
      errorTracker.trackFunnelStep('checkin', 'error_no_besties');
      toast.error('Please select at least one bestie from your circle to notify', { duration: 4000 });
      return;
    }

    // Check if selected besties have phone numbers
    const bestiesWithoutPhone = selectedBesties.filter(bestieId => {
      const bestie = besties.find(b => b.id === bestieId);
      return !bestie?.phone;
    }).map(bestieId => {
      const bestie = besties.find(b => b.id === bestieId);
      return bestie?.name || 'Unknown';
    });

    if (bestiesWithoutPhone.length > 0) {
      toast.error(`These besties need to add their phone number: ${bestiesWithoutPhone.join(', ')}`, {
        duration: 6000
      });
      return;
    }

    if (!locationInput.trim()) {
      errorTracker.trackFunnelStep('checkin', 'error_no_location');
      toast.error('Please enter a location');
      return;
    }

    if (duration < 15 || duration > 180) {
      toast.error('Duration must be between 15 and 180 minutes');
      return;
    }

    setLoading(true);
    errorTracker.trackFunnelStep('checkin', 'submit_checkin', {
      besties: selectedBesties.length,
      duration,
      hasNotes: !!notes,
    });

    // Show loading toast
    const loadingToast = toast.loading('Creating your check-in...');

    try {
      const now = new Date();
      const alertTime = new Date(now.getTime() + duration * 60 * 1000);

      // Upload photos if provided
      const photoURLs = [];
      if (photoFiles.length > 0) {
        const photoToast = toast.loading(`Uploading ${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''}...`);
        try {
          for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i];
            const storageRef = ref(storage, `checkin-photos/${currentUser.uid}/${Date.now()}_${i}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            photoURLs.push(downloadURL);
          }
          toast.success(`${photoURLs.length} photo${photoURLs.length > 1 ? 's' : ''} uploaded!`, { id: photoToast });
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          toast.error('Some photos failed to upload, continuing with uploaded photos', { id: photoToast });
        }
      }

      // Get current privacy setting and circle snapshot
      const privacyLevel = userData?.privacySettings?.checkInVisibility || 'all_besties';
      const circleSnapshot = userData?.featuredCircle || [];

      const checkInData = {
        userId: currentUser.uid,
        location: locationInput,
        duration: duration,
        alertTime: Timestamp.fromDate(alertTime),
        bestieIds: selectedBesties,
        notes: notes || null,
        meetingWith: meetingWith || null,
        photoURLs: photoURLs,
        status: 'active',
        privacyLevel: privacyLevel,
        circleSnapshot: circleSnapshot,
        createdAt: Timestamp.now(),
        lastUpdate: Timestamp.now(),
      };

      // Add document and get reference
      const docRef = await addDoc(collection(db, 'checkins'), checkInData);

      // Verify the document was created by reading it back
      const docSnap = await getDoc(doc(db, 'checkins', docRef.id));

      if (!docSnap.exists()) {
        throw new Error('Check-in was not saved properly. Please try again.');
      }

      // Verify critical data
      const savedData = docSnap.data();
      if (savedData.userId !== currentUser.uid || savedData.status !== 'active') {
        throw new Error('Check-in data verification failed. Please try again.');
      }

      // Verify besties were saved correctly
      if (!savedData.bestieIds || savedData.bestieIds.length !== selectedBesties.length) {
        throw new Error('Bestie list was not saved correctly. Please try again.');
      }

      // Verify all bestie IDs match exactly
      const bestiesMatch = selectedBesties.every(id => savedData.bestieIds.includes(id));
      if (!bestiesMatch) {
        throw new Error('Bestie list verification failed. Please try again.');
      }

      errorTracker.trackFunnelStep('checkin', 'complete_checkin');
      toast.success('Check-in created! Stay safe! 💜', { id: loadingToast });
      navigate('/');
    } catch (error) {
      console.error('Error creating check-in:', error);
      errorTracker.logCustomError('Failed to create check-in', { error: error.message });

      // Provide specific error messages
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your account settings.', { id: loadingToast });
      } else if (error.code === 'unavailable') {
        toast.error('Unable to connect to server. Please check your internet connection.', { id: loadingToast });
      } else if (error.message.includes('verification failed')) {
        toast.error(error.message, { id: loadingToast });
      } else {
        toast.error('Failed to create check-in. Please try again.', { id: loadingToast });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Create Check-In</h1>
          <p className="text-text-secondary">Set up your safety check-in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location with Map */}
          <div className="card p-0 overflow-hidden">
            <label className="block text-lg font-display text-text-primary p-6 pb-3">
              Where are you going? 📍
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
                  className="input w-full shadow-lg"
                  placeholder="Search for a place..."
                  required
                  autoComplete="off"
                />
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

              {/* Locate me button overlay - positioned above zoom controls (top-right) */}
              {isEnabled('gpsLocation') && (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="absolute right-3 top-16 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border border-gray-300 transition-all z-10"
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
              Drag the map to adjust pin location, search for a place, or click the crosshair to use GPS
            </p>
          </div>

          {/* Who You're Meeting */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Who are you meeting? 👥 (Optional)
            </label>
            <input
              type="text"
              value={meetingWith}
              onChange={(e) => setMeetingWith(e.target.value)}
              className="input"
              placeholder="e.g., Alex, Sarah, John..."
            />
          </div>

          {/* Duration */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              How long? ⏰
            </label>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    duration === mins
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                  }`}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center mt-3">
              <div className="text-sm text-text-secondary">
                {duration} minutes
              </div>
              <div className="text-sm font-semibold text-primary mt-1">
                Alert at: {new Date(Date.now() + duration * 60 * 1000).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          </div>

          {/* Select Besties */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Who should we alert? 💜 (1-5)
            </label>

            {besties.length === 0 ? (
              <div className="text-center py-8 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <p className="font-semibold text-text-primary mb-2">⚠️ No besties in your circle</p>
                <p className="text-text-secondary text-sm mb-4">Add besties to your bestie circle on the home page to create check-ins</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-primary"
                >
                  Go to Home Page
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {besties.map((bestie) => (
                  <button
                    key={bestie.id}
                    type="button"
                    onClick={() => toggleBestie(bestie.id)}
                    disabled={!bestie.phone}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      !bestie.phone
                        ? 'border-orange-300 bg-orange-50 opacity-60 cursor-not-allowed'
                        : selectedBesties.includes(bestie.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display">
                          {bestie.name?.[0] || bestie.phone?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{bestie.name || bestie.phone || 'Unknown'}</div>
                          <div className="text-sm text-text-secondary">
                            {bestie.phone || '⚠️ No phone number - ask them to add one'}
                          </div>
                        </div>
                      </div>
                      {selectedBesties.includes(bestie.id) && (
                        <div className="text-primary text-xl">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 text-sm text-text-secondary">
              Selected: {selectedBesties.length}/5
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Notes (Optional) 📝
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Any additional info for your besties..."
            />
          </div>

          {/* Photos */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Add Photos (Optional) 📸 ({photoFiles.length}/5)
            </label>

            {/* Photo grid */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold hover:bg-red-600 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add more photos button */}
            {photoFiles.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm text-text-secondary">
                    Click to add photos (up to 5, max 5MB each)
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {(locationInput || selectedBesties.length > 0) && (
            <div className="card p-6 bg-blue-50 border-2 border-blue-200">
              <h3 className="font-display text-lg text-text-primary mb-3">
                👀 Your besties will see:
              </h3>
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="text-sm text-text-secondary mb-1">🚨 Safety Alert</div>
                <div className="font-semibold text-text-primary mb-2">
                  {userData?.displayName || 'Your friend'} hasn't checked in!
                </div>
                {locationInput && (
                  <div className="text-sm mb-2">
                    <span className="font-semibold">Location:</span> {locationInput}
                  </div>
                )}
                {meetingWith && (
                  <div className="text-sm mb-2">
                    <span className="font-semibold">Meeting with:</span> {meetingWith}
                  </div>
                )}
                {notes && (
                  <div className="text-sm mb-2">
                    <span className="font-semibold">Notes:</span> {notes}
                  </div>
                )}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {photoPreviews.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full rounded-lg aspect-square object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="text-xs text-text-secondary mt-2">
                  Alert time: {new Date(Date.now() + duration * 60 * 1000).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || selectedBesties.length === 0}
            className="w-full btn btn-primary text-lg py-4"
          >
            {loading ? 'Creating...' : '🛡️ Start Check-In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCheckInPage;
