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
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import ProfileWithBubble from '../components/ProfileWithBubble';

// Luxury girly skeleton loader for check-in creation
const CheckInLoader = () => {
  const messages = [
    "Wrapping you in safety... Your besties will watch over you 💖",
    "Building your protection... We've got your back, always ✨",
    "Setting up your safety circle... You're never alone with us 🌸",
    "Preparing your safety net... Because you deserve to feel secure 💕",
  ];

  // Pick one random message for this check-in
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 via-purple-50 to-indigo-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-indigo-900/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elegant floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-elegant"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.3,
            }}
          >
            <span className="text-2xl">
              {['✨', '💎', '🌸', '🦋', '💫', '🌺', '🏵️', '🎀'][Math.floor(Math.random() * 8)]}
            </span>
          </div>
        ))}
      </div>

      {/* Luxury content card */}
      <div className="w-full max-w-lg text-center relative z-10">
        <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 dark:border-gray-600/50">
        {/* Message */}
        <h2 className="font-display text-3xl text-gradient mb-4">
          Creating your check-in!
        </h2>

        <p className="text-xl text-text-secondary font-semibold mb-8 animate-fade-in">
          {message}
        </p>

        {/* Cute loading animation */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>

          {/* Elegant loading animation */}
          <div className="flex justify-center items-center gap-2 mb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-wave"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>

          {/* Silk ribbon progress bar */}
          <div className="relative w-full h-2 bg-gradient-to-r from-pink-100 via-purple-100 to-fuchsia-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-fuchsia-900/50 rounded-full overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 via-fuchsia-400 to-pink-400 animate-silk-shimmer bg-[length:300%_100%] opacity-80"></div>
            <div className="absolute inset-0 bg-white/30 dark:bg-white/10 animate-silk-shine"></div>
          </div>

          {/* Gentle reminder */}
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-6 italic">
            Taking care of you, always 💕
          </p>
        </div>
      </div>
    </div>

      <style>{`
        @keyframes float-elegant {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(10px) rotate(5deg);
            opacity: 0.6;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes silk-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes silk-shine {
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
        }
        @keyframes draw-check {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        .animate-float-elegant {
          animation: float-elegant 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
        .animate-silk-shimmer {
          animation: silk-shimmer 3s linear infinite;
        }
        .animate-silk-shine {
          animation: silk-shine 3s ease-in-out infinite;
        }
        .animate-draw-check {
          animation: draw-check 2s ease-in-out infinite;
          stroke-dasharray: 100;
        }
      `}</style>
    </>
  );
};

const CreateCheckInPage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [locationInput, setLocationInput] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedBesties, setSelectedBesties] = useState([]);
  const [notes, setNotes] = useState('');
  const [meetingWith, setMeetingWith] = useState('');
  const [socialMediaLinks, setSocialMediaLinks] = useState(''); // Social media links of person meeting
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [besties, setBesties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showingLoader, setShowingLoader] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const { executeOptimistic } = useOptimisticUpdate();
  const [gpsCoords, setGpsCoords] = useState(null); // Store GPS coordinates for map display
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapLocked, setMapLocked] = useState(true); // Map starts locked
  const [expandedBestieShare, setExpandedBestieShare] = useState(null); // Track which bestie's share menu is open
  const [notesExpanded, setNotesExpanded] = useState(false); // Track if notes section is expanded
  const [photosExpanded, setPhotosExpanded] = useState(false); // Track if photos section is expanded
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false); // Flag for auto-submit after besties load

  // Map default center (San Francisco)
  const mapCenter = { lat: 37.7749, lng: -122.4194 };

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Get supportive, girl-best-friend message
  const getSupportiveMessage = () => {
    const messages = [
      "Let's make sure you're safe out there, babe! 💕",
      "Your safety is everything to us! Let's set this up together 🤗",
      "We've got your back, bestie! Let's get you protected ✨",
      "Setting up your safety net - because you matter so much! 💜",
      "Let's make sure you can have fun worry-free, love! 🌟",
      "Your besties are here to watch over you! Let's do this 💪",
      "Keep yourself safe while living your best life! 🦋",
      "We're all about keeping our girl protected! Let's go 💝",
    ];
    // Use hour of day to get consistent but varied messages
    const hour = new Date().getHours();
    return messages[hour % messages.length];
  };

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

    // Load from new quick check-in types
    if (location.state?.quickType) {
      const { quickType, duration: quickDuration, rego, meetingWith: meetingWithParam, skipLocation } = location.state;

      errorTracker.trackFunnelStep('checkin', `use_quick_${quickType}`, { duration: quickDuration });

      if (quickDuration) {
        setDuration(quickDuration);
      }

      // If skipLocation is true, set location and flag for auto-submit
      if (skipLocation) {
        setLocationInput('No location set');
        setShouldAutoSubmit(true); // Flag to auto-submit once besties are loaded
      }

      // Handle rideshare - add rego to notes
      if (quickType === 'rideshare' && rego) {
        setNotes(`🚗 Rideshare - Vehicle: ${rego}`);
      }

      // Handle quick meet - set meeting with
      if (quickType === 'quickmeet' && meetingWithParam) {
        setMeetingWith(meetingWithParam);
      }

      // Handle walking - add note
      if (quickType === 'walking') {
        setNotes('🚶‍♀️ Walking alone');
      }
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

        if (featuredIds.length === 0) {
          console.warn('⚠️ featuredCircle is empty - no besties to load');
          setBesties([]);
          return;
        }

        // Get all accepted besties to find the ones in the circle
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

        const allBestiesList = [];

        requesterQuery.forEach((doc) => {
          const data = doc.data();
          allBestiesList.push({
            id: data.recipientId,
            name: data.recipientName || 'Bestie',
            phone: data.recipientPhone,
            email: data.recipientEmail,
          });
        });

        recipientQuery.forEach((doc) => {
          const data = doc.data();
          allBestiesList.push({
            id: data.requesterId,
            name: data.requesterName || 'Bestie',
            phone: data.requesterPhone,
            email: data.requesterEmail,
          });
        });

        // Filter to only show besties in the featured circle
        const circleBesties = allBestiesList.filter(b => featuredIds.includes(b.id));

        // Fetch full user data for each bestie to get displayName, photoURL, and requestAttention
        const bestiesWithUserData = await Promise.all(
          circleBesties.map(async (bestie) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', bestie.id));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...bestie,
                  name: userData.displayName || bestie.name || bestie.email || 'Bestie',
                  photoURL: userData.photoURL || null,
                  email: userData.email || bestie.email,
                  phone: userData.phoneNumber || bestie.phone,
                  requestAttention: userData.requestAttention || null,
                };
              }
              return bestie;
            } catch (error) {
              console.error(`Error fetching user data for ${bestie.id}:`, error);
              return bestie;
            }
          })
        );

        setBesties(bestiesWithUserData);

        // Auto-select only besties who have phone numbers (required for notifications)
        if (!location.state?.template && bestiesWithUserData.length > 0) {
          const bestiesWithPhone = bestiesWithUserData.filter(b => b.phone);
          setSelectedBesties(bestiesWithPhone.map(b => b.id));

          // Warn if some besties don't have phone numbers
          const withoutPhone = bestiesWithUserData.filter(b => !b.phone);
          if (withoutPhone.length > 0) {
            console.warn('⚠️ Some circle besties missing phone numbers:', withoutPhone);
            toast('Some besties need to add their phone number before they can be alerted', {
              icon: 'ℹ️',
              duration: 4000
            });
          }
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
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

  // Auto-submit quick check-ins after besties are loaded
  useEffect(() => {
    if (shouldAutoSubmit && selectedBesties.length > 0 && !loading) {
      // Besties are loaded and auto-selected, now trigger submit
      console.log('Auto-submitting quick check-in with besties:', selectedBesties);

      // Small delay to ensure all state is ready
      setTimeout(() => {
        const submitBtn = document.querySelector('#create-checkin-submit-btn');
        if (submitBtn && !submitBtn.disabled) {
          console.log('Clicking submit button');
          submitBtn.click();
          setShouldAutoSubmit(false); // Reset flag
        } else {
          console.warn('Submit button not ready:', { submitBtn, disabled: submitBtn?.disabled });
        }
      }, 200);
    }
  }, [shouldAutoSubmit, selectedBesties, loading]);

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

    // Check if Google Maps is already loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setAutocompleteLoaded(true);
        return true;
      }
      return false;
    };

    // If already loaded, set state immediately
    if (checkGoogleLoaded()) {
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists, wait for it to load with timeout
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds timeout
      const interval = setInterval(() => {
        attempts++;
        if (checkGoogleLoaded()) {
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.error('Google Maps API loading timeout');
          toast.error('Map is taking too long to load. Please refresh the page.', {
            duration: 5000,
            id: 'maps-timeout'
          });
        }
      }, 100);

      return () => clearInterval(interval);
    }

    // Load script with loading=async
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    // Add timeout for script loading
    const loadTimeout = setTimeout(() => {
      if (!checkGoogleLoaded()) {
        console.error('Google Maps API script load timeout');
        toast.error('Map failed to load. Please check your internet connection and refresh.', {
          duration: 5000,
          id: 'maps-load-timeout'
        });
      }
    }, 15000); // 15 second timeout

    script.onload = () => {
      clearTimeout(loadTimeout);
      // Double check that the API is fully loaded
      const checkInterval = setInterval(() => {
        if (checkGoogleLoaded()) {
          clearInterval(checkInterval);
        }
      }, 100);

      // Set a short timeout to ensure API is ready
      setTimeout(() => {
        if (checkGoogleLoaded()) {
          console.log('Google Maps API loaded successfully');
        }
      }, 500);
    };

    script.onerror = (error) => {
      clearTimeout(loadTimeout);
      console.error('Failed to load Google Maps API:', error);
      toast.error('Failed to load address autocomplete. Please refresh the page.', {
        duration: 5000,
        id: 'maps-error'
      });
    };

    document.head.appendChild(script);

    // Cleanup timeout on unmount
    return () => clearTimeout(loadTimeout);
  }, []);

  // Initialize Map when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !mapRef.current || mapInitialized) return;

    // Add extra validation that API is actually ready
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not fully ready yet, retrying...');
      // Retry after a short delay
      const retryTimeout = setTimeout(() => {
        setAutocompleteLoaded(false);
        setTimeout(() => setAutocompleteLoaded(true), 100);
      }, 500);
      return () => clearTimeout(retryTimeout);
    }

    try {
      console.log('Initializing Google Map...');
      // Initialize Google Map - locked by default
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
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
              setLocationInput(results[0].formatted_address);
            }
          });

          // Show success feedback
          toast.success('📍 Pin location saved!', { duration: 1500 });
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
    // mapCenter is a constant, not state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autocompleteLoaded, mapInitialized, mapLocked]);

  // Initialize Autocomplete when API is loaded
  useEffect(() => {
    if (!autocompleteLoaded || !locationInputRef.current) return;

    // Add extra validation that Places API is actually ready
    if (!window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.places.Autocomplete) {
      console.warn('Google Places API not fully ready yet, retrying...');
      // Retry after a short delay
      const retryTimeout = setTimeout(() => {
        setAutocompleteLoaded(false);
        setTimeout(() => setAutocompleteLoaded(true), 100);
      }, 500);
      return () => clearTimeout(retryTimeout);
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

  const handleShareToAddPhone = (platform, bestieName) => {
    const message = `Hey! You haven't added your phone number on Besties yet. I can't use you as my emergency contact until you do. Can you add it please? ❤️\n\nDownload Besties: ${window.location.origin}`;
    const encoded = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    switch (platform) {
      case 'whatsapp':
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${encoded}`;
        } else {
          window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }
        break;
      case 'messenger':
        if (isMobile) {
          window.location.href = `fb-messenger://share?link=${encodeURIComponent(window.location.origin)}`;
          setTimeout(() => {
            window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.origin)}&app_id=&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank');
          }, 1500);
        } else {
          window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.origin)}&app_id=&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank', 'width=600,height=400');
        }
        break;
      case 'instagram':
        navigator.clipboard.writeText(message).then(() => {
          toast.success('Message copied! Opening Instagram DMs...');
          if (isMobile) {
            window.location.href = 'instagram://direct/inbox';
            setTimeout(() => {
              window.open('https://www.instagram.com/direct/inbox/', '_blank');
            }, 1500);
          } else {
            window.open('https://www.instagram.com/direct/inbox/', '_blank');
          }
        }).catch(() => {
          toast.error('Failed to copy message');
        });
        break;
      case 'sms':
        window.location.href = `sms:?body=${encoded}`;
        break;
      case 'facebook':
        const textEncoded = encodeURIComponent('Hey! Please add your phone number on Besties ❤️');
        const urlEncoded = encodeURIComponent(window.location.origin);
        if (isMobile) {
          window.location.href = `fb://profile`;
          setTimeout(() => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${textEncoded}`, '_blank');
          }, 1500);
        } else {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${textEncoded}`, '_blank', 'width=600,height=400');
        }
        break;
      default:
        break;
    }

    toast.success(`Opening ${platform}...`);
    setExpandedBestieShare(null); // Close the menu
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

    if (duration < 10 || duration > 180) {
      toast.error('Duration must be between 10 and 180 minutes');
      return;
    }

    errorTracker.trackFunnelStep('checkin', 'submit_checkin', {
      besties: selectedBesties.length,
      duration,
      hasNotes: !!notes,
    });

    // Show cute loader immediately
    setShowingLoader(true);

    // Use optimistic update - show loader and process in background
    await executeOptimistic({
      optimisticUpdate: () => {
        // Loader is already showing - no immediate navigation
      },
      serverUpdate: async () => {
        setLoading(true);
        try {
          const now = new Date();
          const alertTime = new Date(now.getTime() + duration * 60 * 1000);

          // Upload photos if provided
          const photoURLs = [];
          if (photoFiles.length > 0) {
            for (let i = 0; i < photoFiles.length; i++) {
              const file = photoFiles[i];
              try {
                const storageRef = ref(storage, `checkin-photos/${currentUser.uid}/${Date.now()}_${i}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Only add to array if we got a valid URL
                if (downloadURL) {
                  photoURLs.push(downloadURL);
                } else {
                  console.warn(`Failed to get download URL for photo ${i}`);
                }
              } catch (photoError) {
                console.error(`Error uploading photo ${i}:`, photoError);
                // Continue with other photos even if one fails
              }
            }
          }

          // Get current privacy setting and circle snapshot
          const privacyLevel = userData?.privacySettings?.checkInVisibility || 'all_besties';
          const circleSnapshot = userData?.featuredCircle || [];

          const checkInData = {
            userId: currentUser.uid,
            location: locationInput,
            gpsCoords: gpsCoords || null, // Save GPS coordinates from map pin
            duration: duration,
            alertTime: Timestamp.fromDate(alertTime),
            bestieIds: selectedBesties,
            notes: notes || null,
            meetingWith: meetingWith || null,
            socialMediaLinks: socialMediaLinks || null, // Save social media links
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

          // Navigate after successful creation
          setTimeout(() => {
            navigate('/');
          }, 1000); // Small delay to show success message

          return docRef;
        } finally {
          setLoading(false);
        }
      },
      rollback: () => {
        // Hide loader and stay on page on error
        setShowingLoader(false);
      },
      onError: (error) => {
        console.error('Error creating check-in:', error);
        errorTracker.logCustomError('Failed to create check-in', { error: error.message });
        setShowingLoader(false);
      },
      successMessage: 'Check-in created! Stay safe! 💜',
      errorMessage: 'Failed to create check-in. Please try creating it again.',
      showLoadingToast: false, // We're showing the loader instead
      loadingMessage: 'Creating your check-in...'
    });
  };

  // Show loader while creating check-in
  if (showingLoader) {
    return <CheckInLoader />;
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Create Check-In</h1>
          <p className="text-text-secondary">{getSupportiveMessage()}</p>
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
              💡 <strong className="text-primary">Double-tap to unlock the map,</strong> then drag to move it and double-tap again to save the pin location, or search for a place, or click the crosshair to use GPS
            </p>
          </div>

          {/* Who Meeting & Duration Combined */}
          <div className="card p-6">
            {/* Who You're Meeting */}
            <div className="mb-6">
              <label className="block text-lg font-display text-text-primary mb-3">
                Who are you meeting? 👥 (Optional)
              </label>
              <input
                type="text"
                value={meetingWith}
                onChange={(e) => setMeetingWith(e.target.value)}
                className="input mb-3"
                placeholder="e.g., Alex, Sarah, John..."
              />
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Their Social Media (Optional)
              </label>
              <input
                type="text"
                value={socialMediaLinks}
                onChange={(e) => setSocialMediaLinks(e.target.value)}
                className="input"
                placeholder="e.g., @username on Instagram, facebook.com/profile..."
              />
            </div>

            {/* Duration */}
            <div>
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
                        : 'bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600'
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
          </div>

          {/* Select Besties */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Who should we alert? 💜
            </label>

            {besties.length === 0 ? (
              <div className="text-center py-8 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
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
                {besties.map((bestie) => {
                  const selectionIndex = selectedBesties.indexOf(bestie.id);
                  const isSelected = selectionIndex !== -1;
                  const selectionNumber = isSelected ? selectionIndex + 1 : null;
                  const isShareExpanded = expandedBestieShare === bestie.id;

                  return (
                    <div key={bestie.id} className="w-full">
                      <button
                        type="button"
                        onClick={() => bestie.phone && toggleBestie(bestie.id)}
                        disabled={!bestie.phone}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          !bestie.phone
                            ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <ProfileWithBubble
                              photoURL={bestie.photoURL}
                              name={bestie.name || bestie.email || 'Unknown'}
                              requestAttention={bestie.requestAttention}
                              size="md"
                              showBubble={true}
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-text-primary">{bestie.name || bestie.email || 'Unknown'}</div>
                              <div className="text-sm text-text-secondary">
                                {bestie.phone ? bestie.email || bestie.phone : '⚠️ No phone number'}
                              </div>
                            </div>
                          </div>
                          {bestie.phone ? (
                            isSelected && (
                              <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                                {selectionNumber}/5
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBestieShare(isShareExpanded ? null : bestie.id);
                              }}
                              className="btn btn-sm btn-primary"
                            >
                              Ask to Add
                            </button>
                          )}
                        </div>
                      </button>

                      {/* Social Share Menu for No Phone */}
                      {!bestie.phone && isShareExpanded && (
                        <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3">
                            📱 Ask {bestie.name} to add their phone number
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleShareToAddPhone('whatsapp', bestie.name)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white transition-colors"
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              <span className="text-xs">WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareToAddPhone('messenger', bestie.name)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#0084FF] hover:bg-[#0073E6] text-white transition-colors"
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                              </svg>
                              <span className="text-xs">Messenger</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareToAddPhone('instagram', bestie.name)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white transition-opacity"
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span className="text-xs">Instagram</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareToAddPhone('sms', bestie.name)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-success hover:bg-green-600 text-white transition-colors"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              <span className="text-xs">SMS</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareToAddPhone('facebook', bestie.name)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white transition-colors"
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              <span className="text-xs">Facebook</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 text-sm text-primary font-semibold">
              Selected: {selectedBesties.length}/5
            </div>
          </div>

          {/* Notes and Photos - Side by side expandable buttons */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Notes & Photos (Optional)
            </label>

            {/* Side-by-side buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setNotesExpanded(!notesExpanded);
                  if (!notesExpanded) setPhotosExpanded(false);
                }}
                className={`py-4 px-4 rounded-xl font-semibold transition-all border-2 ${
                  notesExpanded
                    ? 'bg-gradient-primary text-white border-primary shadow-lg scale-105'
                    : notes
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-text-primary hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm">Add Notes</div>
                {notes && !notesExpanded && <div className="text-xs mt-1 opacity-75">✓ Added</div>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhotosExpanded(!photosExpanded);
                  if (!photosExpanded) setNotesExpanded(false);
                }}
                className={`py-4 px-4 rounded-xl font-semibold transition-all border-2 ${
                  photosExpanded
                    ? 'bg-gradient-primary text-white border-primary shadow-lg scale-105'
                    : photoFiles.length > 0
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-text-primary hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-sm">Add Photos</div>
                {photoFiles.length > 0 && !photosExpanded && (
                  <div className="text-xs mt-1 opacity-75">✓ {photoFiles.length}/5</div>
                )}
              </button>
            </div>

            {/* Expandable Notes Section */}
            {notesExpanded && (
              <div className="mb-4 animate-fade-in">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => {
                    // Mobile keyboard "Done" or "Go" button (Enter without shift)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setNotesExpanded(false);
                      e.target.blur(); // Dismiss keyboard
                    }
                  }}
                  className="input min-h-[120px] resize-none"
                  placeholder="Any additional info for your besties..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setNotesExpanded(false)}
                  className="mt-2 w-full btn btn-secondary text-sm py-2"
                >
                  Done
                </button>
              </div>
            )}

            {/* Expandable Photos Section */}
            {photosExpanded && (
              <div className="animate-fade-in">
                <div className="text-sm font-semibold text-text-primary mb-2">
                  Add Photos ({photoFiles.length}/5)
                </div>

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
                  <div className="mb-3">
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
                      className="block w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="text-4xl mb-2">📷</div>
                      <div className="text-sm text-text-secondary">
                        Click to add photos (up to 5, max 5MB each)
                      </div>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPhotosExpanded(false)}
                  className="w-full btn btn-secondary text-sm py-2"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="create-checkin-submit-btn"
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
