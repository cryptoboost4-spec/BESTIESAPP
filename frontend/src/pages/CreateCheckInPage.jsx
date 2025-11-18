import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { isEnabled } from '../config/features';
import errorTracker from '../services/errorTracking';

const CreateCheckInPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [locationInput, setLocationInput] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedBesties, setSelectedBesties] = useState([]);
  const [notes, setNotes] = useState('');
  const [besties, setBesties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Common locations for suggestions
  const commonLocations = [
    '📍 Coffee Shop',
    '🍽️ Restaurant',
    '🎬 Cinema',
    '🏠 Their Place',
    '🎵 Concert/Event',
    '🍻 Bar/Pub',
    '🏃 Gym',
    '🛍️ Shopping Center',
  ];

  useEffect(() => {
    errorTracker.trackFunnelStep('checkin', 'view_create_page');
    loadBesties();

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

  // Load Google Places API
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured');
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
          setLocationInput(`GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setLoading(false);
          toast.success('Location captured!');
        },
        (error) => {
          setLoading(false);
          toast.error('Could not get location');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation not supported');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedBesties.length === 0) {
      errorTracker.trackFunnelStep('checkin', 'error_no_besties');
      toast.error('Please select at least one bestie');
      return;
    }

    if (!locationInput.trim()) {
      errorTracker.trackFunnelStep('checkin', 'error_no_location');
      toast.error('Please enter a location');
      return;
    }

    setLoading(true);
    errorTracker.trackFunnelStep('checkin', 'submit_checkin', {
      besties: selectedBesties.length,
      duration,
      hasNotes: !!notes,
    });

    try {
      const now = new Date();
      const alertTime = new Date(now.getTime() + duration * 60 * 1000);

      const checkInData = {
        userId: currentUser.uid,
        location: locationInput,
        duration: duration,
        alertTime: Timestamp.fromDate(alertTime),
        bestieIds: selectedBesties,
        notes: notes || null,
        status: 'active',
        createdAt: Timestamp.now(),
        lastUpdate: Timestamp.now(),
      };

      await addDoc(collection(db, 'checkins'), checkInData);

      errorTracker.trackFunnelStep('checkin', 'complete_checkin');
      toast.success('Check-in created! Stay safe! 💜');
      navigate('/');
    } catch (error) {
      console.error('Error creating check-in:', error);
      errorTracker.logCustomError('Failed to create check-in', { error: error.message });
      toast.error('Failed to create check-in');
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
          {/* Location */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-3">
              Where are you going? 📍
            </label>

            <div className="flex gap-2 mb-3">
              <input
                ref={locationInputRef}
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="input flex-1"
                placeholder="Type an address or place name..."
                required
                autoComplete="off"
              />
              {isEnabled('gpsLocation') && (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="btn btn-secondary px-4"
                  disabled={loading}
                >
                  📍 GPS
                </button>
              )}
            </div>

            {/* Location Suggestions */}
            <div className="flex flex-wrap gap-2">
              {commonLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationInput(loc)}
                  className="px-3 py-1 bg-accent/20 text-primary rounded-full text-sm hover:bg-accent/30 transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>
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
            <div className="text-center text-sm text-text-secondary mt-2">
              {duration} minutes
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
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedBesties.includes(bestie.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display">
                          {bestie.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{bestie.name}</div>
                          <div className="text-sm text-text-secondary">{bestie.phone}</div>
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
