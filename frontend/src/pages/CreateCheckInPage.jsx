import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, Timestamp } from 'firebase/firestore';
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
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [besties, setBesties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null); // Store GPS coordinates for map display
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // Default: San Francisco
  const [mapInitialized, setMapInitialized] = useState(false);

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

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
    if (currentUser && !authLoading) {
      loadBesties();
    }
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
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
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
      // Initialize Google Map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [autocompleteLoaded, mapCenter, mapInitialized]);

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

          // Center map on selected place
          if (place.geometry && place.geometry.location && mapInstanceRef.current) {
            const location = place.geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            mapInstanceRef.current.setCenter(coords);
            mapInstanceRef.current.setZoom(15);

            // Update or create marker
            if (markerRef.current) {
              markerRef.current.setPosition(coords);
            } else {
              markerRef.current = new window.google.maps.Marker({
                position: coords,
                map: mapInstanceRef.current,
                title: displayLocation,
                animation: window.google.maps.Animation.DROP,
              });
            }
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
      // Center map on GPS location
      mapInstanceRef.current.setCenter(gpsCoords);
      mapInstanceRef.current.setZoom(15);

      // Update or create marker at GPS location
      if (markerRef.current) {
        markerRef.current.setPosition(gpsCoords);
        markerRef.current.setTitle('Your Location');
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: gpsCoords,
          map: mapInstanceRef.current,
          title: 'Your Location',
          animation: window.google.maps.Animation.DROP,
        });
      }
    } catch (error) {
      console.error('Error updating map with GPS:', error);
    }
  }, [gpsCoords]);

  const loadBesties = async () => {
    if (!currentUser) return;

    try {
      // Get accepted besties where user is either requester or recipient
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

      const bestiesList = [];

      requesterQuery.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: data.recipientId,
          name: data.recipientName || 'Bestie',
          phone: data.recipientPhone,
        });
      });

      recipientQuery.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: data.requesterId,
          name: data.requesterName || 'Bestie',
          phone: data.requesterPhone,
        });
      });

      setBesties(bestiesList);

      // Auto-select all besties when they load (only if not loading from template)
      if (!location.state?.template && bestiesList.length > 0) {
        setSelectedBesties(bestiesList.map(b => b.id));
      }
    } catch (error) {
      console.error('Error loading besties:', error);
      toast.error('Failed to load besties');
    }
  };

  const handleGetLocation = () => {
    if (!isEnabled('gpsLocation')) {
      toast.error('GPS location is not enabled');
      return;
    }

    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationInput(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setGpsCoords({ lat, lng }); // Store coordinates for map
          setLoading(false);
          toast.success('Location captured!');
        },
        (error) => {
          setLoading(false);
          console.error('Geolocation error:', error);

          // Provide specific error messages based on error code
          if (error.code === 1) {
            toast.error('Location permission denied. Please enable location access in your browser settings.', { duration: 5000 });
          } else if (error.code === 2) {
            toast.error('Location unavailable. Please enter your location manually.', { duration: 4000 });
          } else if (error.code === 3) {
            toast.error('Location request timed out. Please try again or enter manually.', { duration: 4000 });
          } else {
            toast.error('Could not get location. Please enter manually.');
          }
        },
        {
          timeout: 10000, // 10 second timeout
          enableHighAccuracy: false // Faster, less battery drain
        }
      );
    } else {
      toast.error('Geolocation not supported by your browser. Please enter location manually.');
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
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedBesties.length === 0) {
      errorTracker.trackFunnelStep('checkin', 'error_no_besties');
      toast.error('Please select at least one bestie');
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

      // Upload photo if provided
      let photoURL = null;
      if (photoFile) {
        const photoToast = toast.loading('Uploading photo...');
        try {
          const storageRef = ref(storage, `checkin-photos/${currentUser.uid}/${Date.now()}_${photoFile.name}`);
          await uploadBytes(storageRef, photoFile);
          photoURL = await getDownloadURL(storageRef);
          toast.success('Photo uploaded!', { id: photoToast });
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          toast.error('Photo upload failed, continuing without photo', { id: photoToast });
        }
      }

      const checkInData = {
        userId: currentUser.uid,
        location: locationInput,
        duration: duration,
        alertTime: Timestamp.fromDate(alertTime),
        bestieIds: selectedBesties,
        notes: notes || null,
        meetingWith: meetingWith || null,
        photoURL: photoURL,
        status: 'active',
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
              <div className="absolute top-3 left-3 right-3">
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

              {/* Locate me button overlay */}
              {isEnabled('gpsLocation') && (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="absolute right-3 bottom-3 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border border-gray-300 transition-all"
                  disabled={loading}
                  title="Use my current location"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
            </div>

            <p className="text-xs text-text-secondary p-3 px-6">
              Search for a place or click the location button to use your current GPS location
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
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">You don't have any besties yet!</p>
                <button
                  type="button"
                  onClick={() => navigate('/besties')}
                  className="btn btn-primary"
                >
                  Add Your First Bestie
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

          {/* Photo */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Add a Photo (Optional) 📸
            </label>

            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Check-in preview"
                  className="w-full rounded-xl max-h-64 object-cover mb-3"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-600"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
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
                    Click to add a photo (max 5MB)
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
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full rounded-lg mt-2 max-h-32 object-cover"
                  />
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
