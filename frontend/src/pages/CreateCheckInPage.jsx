import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import CheckInLoader from '../components/checkin/CheckInLoader';
import CheckInMap from '../components/checkin/CheckInMap';
import MeetingInfoSection from '../components/checkin/MeetingInfoSection';
import DurationSelector from '../components/checkin/DurationSelector';
import BestieSelector from '../components/checkin/BestieSelector';
import MessengerContactSelector from '../components/checkin/MessengerContactSelector';
import NotesPhotosSection from '../components/checkin/NotesPhotosSection';
import { FEATURES } from '../config/features';

const CreateCheckInPage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [locationInput, setLocationInput] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedBesties, setSelectedBesties] = useState([]);
  const [notes, setNotes] = useState('');
  const [meetingWith, setMeetingWith] = useState('');
  const [socialMediaLinks, setSocialMediaLinks] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [besties, setBesties] = useState([]);
  const [messengerContacts, setMessengerContacts] = useState([]);
  const [selectedMessengerContacts, setSelectedMessengerContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showingLoader, setShowingLoader] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const { executeOptimistic } = useOptimisticUpdate();
  const [gpsCoords, setGpsCoords] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapLocked, setMapLocked] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [photosExpanded, setPhotosExpanded] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);

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
        setShouldAutoSubmit(true);
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

        // Fetch full user data for each bestie to get displayName, photoURL, requestAttention, and SMS settings
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
                  smsEnabled: userData.notificationPreferences?.sms || false,
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

        // Auto-select only besties who have phone numbers AND SMS enabled (required for emergency alerts)
        if (!location.state?.template && bestiesWithUserData.length > 0) {
          const bestiesWithPhoneAndSMS = bestiesWithUserData.filter(b => b.phone && b.smsEnabled);
          setSelectedBesties(bestiesWithPhoneAndSMS.map(b => b.id));

          // Warn if some besties can't receive alerts
          const cantReceiveAlerts = bestiesWithUserData.filter(b => !b.phone || !b.smsEnabled);
          if (cantReceiveAlerts.length > 0) {
            console.warn('⚠️ Some circle besties missing phone/SMS:', cantReceiveAlerts);
            const missingPhone = cantReceiveAlerts.filter(b => !b.phone).length;
            const missingSMS = cantReceiveAlerts.filter(b => b.phone && !b.smsEnabled).length;

            let message = '';
            if (missingPhone > 0 && missingSMS > 0) {
              message = `${missingPhone} bestie(s) need to add their phone number and ${missingSMS} need to enable SMS alerts`;
            } else if (missingPhone > 0) {
              message = `${missingPhone} bestie(s) need to add their phone number`;
            } else {
              message = `${missingSMS} bestie(s) need to enable SMS alerts in Settings`;
            }

            toast(message, {
              icon: 'ℹ️',
              duration: 5000
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

  // Load Messenger contacts when currentUser is available
  useEffect(() => {
    if (!currentUser || authLoading || !FEATURES.messengerAlerts) return;

    const messengerContactsRef = collection(db, 'messengerContacts');
    const q = query(messengerContactsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out expired contacts
      const now = Date.now();
      const activeContacts = contactsData.filter(
        contact => contact.expiresAt?.toMillis() > now
      );

      setMessengerContacts(activeContacts);

      // Auto-select all active messenger contacts (similar to bestie auto-selection)
      if (!location.state?.template && activeContacts.length > 0) {
        setSelectedMessengerContacts(activeContacts.map(c => c.id));
        console.log('Auto-selected messenger contacts:', activeContacts.length);
      }
    }, (error) => {
      console.error('Error loading messenger contacts:', error);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading, location.state?.template]);

  // Auto-submit quick check-ins after besties or messenger contacts are loaded
  useEffect(() => {
    if (shouldAutoSubmit && (selectedBesties.length > 0 || selectedMessengerContacts.length > 0) && !loading) {
      // Besties/contacts are loaded and auto-selected, now trigger submit IMMEDIATELY
      console.log('Auto-submitting quick check-in with:', {
        besties: selectedBesties,
        messengerContacts: selectedMessengerContacts
      });

      // Trigger submit immediately without delay
      const submitBtn = document.querySelector('#create-checkin-submit-btn');
      if (submitBtn && !submitBtn.disabled) {
        console.log('Clicking submit button');
        submitBtn.click();
        setShouldAutoSubmit(false); // Reset flag
      } else {
        console.warn('Submit button not ready:', { submitBtn, disabled: submitBtn?.disabled });
      }
    }
  }, [shouldAutoSubmit, selectedBesties, selectedMessengerContacts, loading]);

  // Handle case where auto-submit is enabled but user has no contacts
  useEffect(() => {
    if (shouldAutoSubmit && !loading) {
      // Wait 3 seconds for contacts to load
      const timeout = setTimeout(() => {
        if (selectedBesties.length === 0 && selectedMessengerContacts.length === 0) {
          console.warn('Auto-submit failed: No besties or messenger contacts available');
          toast.error('You need at least one bestie or messenger contact to start a check-in. Please add a contact first.', {
            duration: 6000
          });
          setShouldAutoSubmit(false); // Disable auto-submit so page becomes visible
          navigate('/'); // Navigate back to home
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [shouldAutoSubmit, selectedBesties, selectedMessengerContacts, loading, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user has at least one contact to notify (bestie or messenger contact)
    if (selectedBesties.length === 0 && selectedMessengerContacts.length === 0) {
      errorTracker.trackFunnelStep('checkin', 'error_no_contacts');
      toast.error('Please select at least one bestie or messenger contact to notify', { duration: 4000 });
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

    // Location is now optional - if not provided, use default
    const finalLocation = locationInput.trim() || 'Location not specified';

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

                if (downloadURL) {
                  photoURLs.push(downloadURL);
                } else {
                  console.warn(`Failed to get download URL for photo ${i}`);
                }
              } catch (photoError) {
                console.error(`Error uploading photo ${i}:`, photoError);
              }
            }
          }

          // Filter out any undefined/null/empty values before saving
          const validPhotoURLs = photoURLs.filter(url => url && url.trim() !== '');

          // Get current privacy setting and circle snapshot
          const privacyLevel = userData?.privacySettings?.checkInVisibility || 'all_besties';
          const circleSnapshot = userData?.featuredCircle || [];

          const checkInData = {
            userId: currentUser.uid,
            location: finalLocation,
            gpsCoords: gpsCoords || null,
            duration: duration,
            alertTime: Timestamp.fromDate(alertTime),
            bestieIds: selectedBesties,
            notes: notes || null,
            meetingWith: meetingWith || null,
            socialMediaLinks: socialMediaLinks || null,
            status: 'active',
            privacyLevel: privacyLevel,
            circleSnapshot: circleSnapshot,
            createdAt: Timestamp.now(),
            lastUpdate: Timestamp.now(),
          };

          // Add Messenger contact IDs if any are selected
          if (selectedMessengerContacts.length > 0) {
            checkInData.messengerContactIds = selectedMessengerContacts;
          }

          // Only add photoURLs field if there are valid photos
          if (validPhotoURLs.length > 0) {
            checkInData.photoURLs = validPhotoURLs;
          }

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

          // Verify besties were saved correctly (if any were selected)
          if (selectedBesties.length > 0) {
            if (!savedData.bestieIds || savedData.bestieIds.length !== selectedBesties.length) {
              throw new Error('Bestie list was not saved correctly. Please try again.');
            }

            // Verify all bestie IDs match exactly
            const bestiesMatch = selectedBesties.every(id => savedData.bestieIds.includes(id));
            if (!bestiesMatch) {
              throw new Error('Bestie list verification failed. Please try again.');
            }
          }

          // Verify messenger contacts were saved correctly (if any were selected)
          if (selectedMessengerContacts.length > 0) {
            if (!savedData.messengerContactIds || savedData.messengerContactIds.length !== selectedMessengerContacts.length) {
              throw new Error('Messenger contacts were not saved correctly. Please try again.');
            }

            // Verify all messenger contact IDs match exactly
            const messengerContactsMatch = selectedMessengerContacts.every(id => savedData.messengerContactIds.includes(id));
            if (!messengerContactsMatch) {
              throw new Error('Messenger contacts verification failed. Please try again.');
            }
          }

          errorTracker.trackFunnelStep('checkin', 'complete_checkin');

          // Track emergency contact selections for each bestie
          try {
            const { incrementEmergencyContactCount } = await import('../services/interactionTracking');
            selectedBesties.forEach(bestieId => {
              incrementEmergencyContactCount(bestieId);
            });
          } catch (trackingError) {
            console.error('Failed to track emergency contact selections:', trackingError);
          }

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
      showLoadingToast: false,
      loadingMessage: 'Creating your check-in...'
    });
  };

  // Show loader while creating check-in
  if (showingLoader) {
    return <CheckInLoader />;
  }

  return (
    <div className="min-h-screen bg-pattern">
      <div className={`max-w-2xl mx-auto p-4 pb-20 ${shouldAutoSubmit ? 'opacity-0 pointer-events-none' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location with Map */}
          <CheckInMap
            locationInput={locationInput}
            setLocationInput={setLocationInput}
            gpsCoords={gpsCoords}
            setGpsCoords={setGpsCoords}
            mapInitialized={mapInitialized}
            setMapInitialized={setMapInitialized}
            mapLocked={mapLocked}
            setMapLocked={setMapLocked}
            autocompleteLoaded={autocompleteLoaded}
            showLocationDropdown={showLocationDropdown}
            setShowLocationDropdown={setShowLocationDropdown}
            loading={loading}
            setLoading={setLoading}
          />

          {/* Who Meeting & Duration Combined */}
          <div className="card p-6">
            <MeetingInfoSection
              meetingWith={meetingWith}
              setMeetingWith={setMeetingWith}
              socialMediaLinks={socialMediaLinks}
              setSocialMediaLinks={setSocialMediaLinks}
              socialMediaExpanded={socialMediaExpanded}
              setSocialMediaExpanded={setSocialMediaExpanded}
            />

            <DurationSelector
              duration={duration}
              setDuration={setDuration}
            />
          </div>

          {/* Select Besties */}
          <BestieSelector
            besties={besties}
            selectedBesties={selectedBesties}
            setSelectedBesties={setSelectedBesties}
          />

          {/* Messenger Contacts (Optional) */}
          {FEATURES.messengerAlerts && (
            <MessengerContactSelector
              messengerContacts={messengerContacts}
              selectedContacts={selectedMessengerContacts}
              setSelectedContacts={setSelectedMessengerContacts}
              userId={currentUser?.uid}
            />
          )}

          {/* Notes and Photos */}
          <NotesPhotosSection
            notes={notes}
            setNotes={setNotes}
            photoFiles={photoFiles}
            setPhotoFiles={setPhotoFiles}
            photoPreviews={photoPreviews}
            setPhotoPreviews={setPhotoPreviews}
            notesExpanded={notesExpanded}
            setNotesExpanded={setNotesExpanded}
            photosExpanded={photosExpanded}
            setPhotosExpanded={setPhotosExpanded}
          />

          {/* Submit */}
          <button
            type="submit"
            id="create-checkin-submit-btn"
            disabled={loading || (selectedBesties.length === 0 && selectedMessengerContacts.length === 0)}
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
