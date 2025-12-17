import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
import CheckInLoader from '../components/checkin/CheckInLoader';
import CheckInMap from '../components/checkin/CheckInMap';
import MeetingInfoSection from '../components/checkin/MeetingInfoSection';
import DurationSelector from '../components/checkin/DurationSelector';
import BestieSelector from '../components/checkin/BestieSelector';
import { MOCK_BESTIE, isMockBestie } from '../utils/mockBestie';
import NotesPhotosSection from '../components/checkin/NotesPhotosSection';
import InlineError from '../components/errors/InlineError';
import ContextualError from '../components/errors/ContextualError';
import CheckInTutorialOverlay from '../components/CheckInTutorialOverlay';
import { FEATURES } from '../config/features';

const CreateCheckInPage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submitButtonRef = useRef(null);

  // Tutorial refs for each section
  const mapRef = useRef(null);
  const checkInMapRef = useRef(null);
  const whoMeetingRef = useRef(null);
  const socialMediaRef = useRef(null);
  const durationRef = useRef(null);
  const bestieSelectorRef = useRef(null);
  const notesPhotosRef = useRef(null);

  const [locationInput, setLocationInput] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedBesties, setSelectedBesties] = useState([]);
  const [notes, setNotes] = useState('');
  const [meetingWith, setMeetingWith] = useState('');
  const [socialMediaLinks, setSocialMediaLinks] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [besties, setBesties] = useState([]);
  const [bestiesLoading, setBestiesLoading] = useState(true);
  const [messengerContacts, setMessengerContacts] = useState(null); // null = not loaded yet, [] = loaded but empty
  const [messengerLoading, setMessengerLoading] = useState(true);
  const [selectedMessengerContacts, setSelectedMessengerContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showingLoader, setShowingLoader] = useState(false);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const { executeOptimistic } = useOptimisticUpdate();
  const [gpsCoords, setGpsCoords] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [photosExpanded, setPhotosExpanded] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);
  const [showNoChannelModal, setShowNoChannelModal] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    besties: '',
    location: '',
    duration: '',
    bestiesWithoutContact: ''
  });

  // Component-level errors
  const [bestiesLoadError, setBestiesLoadError] = useState(null);

  // Tutorial state
  const {
    checkInTutorialComplete,
    currentCheckInTutorialStep,
    markCheckInTutorialComplete,
    setCheckInTutorialStep,
    isTutorialStateLoaded,
  } = useCheckInTutorialState();

  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedForFirstCheckIn, setHasCheckedForFirstCheckIn] = useState(false);
  const [bestiesLoadingTimeout, setBestiesLoadingTimeout] = useState(false);
  const [locationStepCompleted, setLocationStepCompleted] = useState(false);
  const [locationTooltipDismissed, setLocationTooltipDismissed] = useState(false);

  // Log showTutorial changes
  useEffect(() => {
    console.log('[Tutorial] showTutorial changed:', showTutorial);
  }, [showTutorial]);

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
        // DON'T set loading to false yet - wait until data is actually loaded
        
        if (!userDoc.exists()) {
          console.error('❌ User document does not exist');
          console.groupEnd();
          setBesties([]);
          setBestiesLoading(false); // Set to false AFTER setting array
          return;
        }

        const userData = userDoc.data();
        const featuredIds = userData.featuredCircle || [];

        if (featuredIds.length === 0) {
          console.warn('⚠️ featuredCircle is empty - no besties to load');
          setBesties([]);
          setBestiesLoading(false); // Set to false AFTER setting array
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

        // Fetch full user data for each bestie to get displayName, photoURL, requestAttention, SMS settings, and Telegram settings
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
                  telegramChatId: userData.telegramChatId || null,
                  notificationPreferences: userData.notificationPreferences || {},
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

        // Don't add mock bestie here - let the separate useEffect handle it
        setBesties(bestiesWithUserData);
        // CRITICAL: Set loading to false AFTER data is set
        setBestiesLoading(false);

        // Auto-select besties who have any contact method (phone+SMS, telegram, or push)
        // Allow messenger-only check-ins - no SMS requirement
        // For quick check-ins, always auto-select all besties with contact info
        if (!location.state?.template && bestiesWithUserData.length > 0) {
          // Prefer besties with phone+SMS, but also include those with telegram or push
          const bestiesWithContact = bestiesWithUserData.filter(b => 
            (b.phone && b.smsEnabled) || 
            b.telegramChatId || 
            b.notificationPreferences?.telegram ||
            b.notificationPreferences?.push
          );
          setSelectedBesties(bestiesWithContact.map(b => b.id));
          
          if (location.state?.quickType) {
            console.log('Quick check-in detected, besties auto-selected:', bestiesWithContact.length);
          }

          // Only warn if we're NOT using messenger contacts (which can receive alerts)
          // If messenger contacts are available, they can receive alerts even if regular besties don't have contact methods
          if (messengerContacts === null || (messengerContacts && messengerContacts.length === 0)) {
            // Warn if some besties can't receive alerts (no contact method at all)
            const cantReceiveAlerts = bestiesWithUserData.filter(b => {
              // Check if bestie has ANY contact method
              const hasPhoneSMS = b.phone && b.smsEnabled;
              const hasTelegram = b.telegramChatId || b.notificationPreferences?.telegram;
              const hasPush = b.notificationPreferences?.push;
              return !hasPhoneSMS && !hasTelegram && !hasPush;
            });
            
            if (cantReceiveAlerts.length > 0) {
              console.warn('⚠️ Some circle besties have no contact method enabled:', cantReceiveAlerts);
              const bestieNames = cantReceiveAlerts.map(b => b.name || 'Unknown').join(', ');
              toast(`⚠️ ${cantReceiveAlerts.length} bestie(s) need to enable notifications (SMS, Telegram, or Push): ${bestieNames}`, {
                icon: 'ℹ️',
                duration: 6000
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading besties:', error);
        setBestiesLoadError('Unable to load your besties. Please refresh the page and try again.');
        setBesties([]);
        setBestiesLoading(false); // Set to false even on error
      }
    }, (error) => {
      console.error('Error in featuredCircle listener:', error);
      setBestiesLoadError('Unable to load your besties. Please refresh the page and try again.');
      setBesties([]);
      setBestiesLoading(false); // Set to false even on error
    });

    console.groupEnd();

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);
  
  // Add mock bestie during tutorial if user has no real besties
  useEffect(() => {
    if (!bestiesLoading && showTutorial) {
      const hasMockBestie = besties.some(b => isMockBestie(b));
      const hasRealBesties = besties.some(b => !isMockBestie(b));
      
      if (!hasRealBesties && !hasMockBestie) {
        // Add mock bestie for tutorial
        console.log('[Tutorial] Adding mock bestie for tutorial');
        setBesties(prev => [...prev, MOCK_BESTIE]);
      }
    } else if (!showTutorial) {
      // Remove mock bestie when tutorial ends
      const filteredBesties = besties.filter(b => !isMockBestie(b));
      if (filteredBesties.length !== besties.length) {
        setBesties(filteredBesties);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial, bestiesLoading]);

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

      // Debug logging: Log all contacts loaded from Firestore
      console.log('📥 Messenger contacts loaded from Firestore:', {
        totalCount: contactsData.length,
        contacts: contactsData.map(c => ({
          id: c.id,
          name: c.name,
          psid: c.messengerPSID,
          expiresAt: c.expiresAt?.toMillis(),
          expiresAtDate: c.expiresAt?.toDate?.()?.toISOString(),
          connectedAt: c.connectedAt?.toMillis(),
          photoURL: c.photoURL ? 'has photo' : 'no photo'
        }))
      });

      // Filter out expired contacts and pending contacts (those without names)
      const now = Date.now();
      const activeContacts = contactsData.filter(
        contact => {
          const isActive = contact.expiresAt?.toMillis() > now;
          const hasName = contact.name && contact.name.trim() !== '';
          return isActive && hasName; // Only show contacts that are active AND have a real name
        }
      );

      // Debug logging: Log filtered active contacts
      const pendingCount = contactsData.filter(c => {
        const isActive = c.expiresAt?.toMillis() > now;
        const hasName = c.name && c.name.trim() !== '';
        return isActive && !hasName; // Active but no name = pending
      }).length;
      
      console.log('✅ Active messenger contacts (after filtering):', {
        activeCount: activeContacts.length,
        expiredCount: contactsData.length - activeContacts.length - pendingCount,
        pendingCount: pendingCount,
        activeContacts: activeContacts.map(c => ({
          id: c.id,
          name: c.name,
          timeRemaining: `${Math.floor((c.expiresAt?.toMillis() - now) / (1000 * 60 * 60))}h ${Math.floor(((c.expiresAt?.toMillis() - now) % (1000 * 60 * 60)) / (1000 * 60))}m`
        }))
      });

      setMessengerContacts(activeContacts);
      setMessengerLoading(false);

      // Auto-select all active messenger contacts for quick check-ins only
      if (location.state?.quickType && activeContacts.length > 0) {
        const allContactIds = activeContacts.map(c => c.id);
        setSelectedMessengerContacts(allContactIds);
        console.log('Quick check-in: Auto-selected messenger contacts:', allContactIds.length);
      }
    }, (error) => {
      console.error('❌ Error loading messenger contacts:', error);
      setMessengerContacts([]); // Set to empty array on error
      setMessengerLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading, location.state]);

  // Auto-submit quick check-ins after besties are loaded
  useEffect(() => {
    // CRITICAL: Check loading states FIRST - if still loading, do nothing
    if (bestiesLoading || messengerLoading) {
      return; // Still loading, wait
    }
    
    // Only proceed if:
    // 1. shouldAutoSubmit is true
    // 2. Not currently submitting (loading === false)
    if (!shouldAutoSubmit || loading) {
      return;
    }
    
    // Check if we have at least one contact method (regular besties OR messenger contacts)
    const hasRegularBesties = selectedBesties.length > 0;
    const hasMessengerContacts = selectedMessengerContacts.length > 0;
    
    if (hasRegularBesties || hasMessengerContacts) {
        // Besties are loaded and auto-selected, now trigger submit IMMEDIATELY
        console.log('Auto-submitting quick check-in with besties:', selectedBesties, 'messenger:', selectedMessengerContacts);

        // Use ref instead of querySelector - more React-idiomatic and reliable
        if (submitButtonRef.current && !submitButtonRef.current.disabled) {
          console.log('Clicking submit button');
          submitButtonRef.current.click();
          setShouldAutoSubmit(false); // Reset flag
        } else {
          console.warn('Submit button not ready:', { 
            exists: !!submitButtonRef.current, 
            disabled: submitButtonRef.current?.disabled 
          });
        }
      } else {
        // No besties or messenger contacts available - show error and stop auto-submit
        console.warn('No besties or messenger contacts available for quick check-in');
        toast.error('You need at least one bestie or messenger contact to create a check-in. Please add besties first.', {
          duration: 6000
        });
        setShouldAutoSubmit(false);
        // Navigate back to home with cleanup
        const navigateTimer = setTimeout(() => {
          navigate('/');
        }, 2000);
        
        // Cleanup on unmount
        return () => clearTimeout(navigateTimer);
      }
  }, [shouldAutoSubmit, selectedBesties, selectedMessengerContacts, loading, bestiesLoading, messengerLoading, messengerContacts, navigate]);

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

    let checkInterval = null;
    let readyTimeout = null;

    script.onload = () => {
      clearTimeout(loadTimeout);
      // Double check that the API is fully loaded
      checkInterval = setInterval(() => {
        if (checkGoogleLoaded()) {
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
          // Ensure autocompleteLoaded is set
          setAutocompleteLoaded(true);
        }
      }, 100);

      // Set a short timeout to ensure API is ready
      readyTimeout = setTimeout(() => {
        if (checkGoogleLoaded()) {
          console.log('Google Maps API loaded successfully');
          setAutocompleteLoaded(true);
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

    // Cleanup timeouts and intervals on unmount
    return () => {
      clearTimeout(loadTimeout);
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (readyTimeout) {
        clearTimeout(readyTimeout);
      }
    };
  }, []);

  // Handle besties loading timeout (10 seconds)
  useEffect(() => {
    if (!bestiesLoading) return;

    const timeout = setTimeout(() => {
      console.warn('[Tutorial] Besties loading timeout (10s) - allowing tutorial to proceed');
      setBestiesLoadingTimeout(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [bestiesLoading]);

  // Check if this is user's first check-in and show tutorial
  // Wait for besties to load before showing tutorial (so bestie selection step works)
  // Also wait for tutorial state sync to complete
  useEffect(() => {
    // Allow tutorial if besties loading timed out (for location step, besties aren't required)
    const canProceedWithoutBesties = bestiesLoadingTimeout;
    const shouldWaitForBesties = bestiesLoading && !canProceedWithoutBesties;

    if (!currentUser || authLoading || hasCheckedForFirstCheckIn || shouldWaitForBesties || !isTutorialStateLoaded) {
      console.log('[Tutorial] Conditions not met:', {
        currentUser: !!currentUser,
        authLoading,
        hasCheckedForFirstCheckIn,
        bestiesLoading,
        bestiesLoadingTimeout,
        isTutorialStateLoaded
      });
      return;
    }

    const checkFirstCheckIn = async () => {
      try {
        console.log('[Tutorial] Checking first check-in:', {
          checkInTutorialComplete,
          currentCheckInTutorialStep,
          currentUser: currentUser.uid
        });

        // If tutorial step is already set (e.g., from homepage tutorial), show tutorial
        if (currentCheckInTutorialStep && !checkInTutorialComplete) {
          console.log('[Tutorial] Tutorial step already set from homepage, showing tutorial');
          setShowTutorial(true);
          setHasCheckedForFirstCheckIn(true);
          return;
        }

        // If tutorial is already complete, don't show it
        if (checkInTutorialComplete) {
          console.log('[Tutorial] Tutorial already complete, skipping');
          setHasCheckedForFirstCheckIn(true);
          return;
        }

        // Check if user has any previous check-ins
        const checkInsQuery = query(
          collection(db, 'checkins'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(checkInsQuery);

        console.log('[Tutorial] Check-ins found:', querySnapshot.empty ? 'none' : querySnapshot.size);

        // If no previous check-ins and tutorial not complete, show tutorial
        if (querySnapshot.empty && !checkInTutorialComplete) {
          console.log('[Tutorial] No check-ins found, showing tutorial');
          setShowTutorial(true);
          // Skip location step for quick check-ins (location already set)
          const isQuickCheckIn = location.state?.skipLocation || location.state?.quickType;
          const initialStep = isQuickCheckIn ? 'whoMeeting' : 'location';
          console.log('[Tutorial] Setting initial step:', initialStep);
          setCheckInTutorialStep(initialStep);
        } else {
          console.log('[Tutorial] User has previous check-ins or tutorial complete, not showing');
        }

        setHasCheckedForFirstCheckIn(true);
      } catch (error) {
        console.error('[Tutorial] Error checking for first check-in:', error);

        // If permission error, show tutorial anyway (assume first check-in)
        // This handles cases where Firestore rules prevent checking check-ins
        if (error.code === 'permission-denied' && !checkInTutorialComplete) {
          console.warn('[Tutorial] Permission denied checking check-ins - showing tutorial anyway');
          setShowTutorial(true);
          setCheckInTutorialStep('location');
        }

        setHasCheckedForFirstCheckIn(true);
      }
    };

    checkFirstCheckIn();
  }, [currentUser, authLoading, checkInTutorialComplete, currentCheckInTutorialStep, hasCheckedForFirstCheckIn, setCheckInTutorialStep, bestiesLoading, bestiesLoadingTimeout, isTutorialStateLoaded, location.state?.quickType, location.state?.skipLocation]);

  // Reset location step state when leaving location step
  useEffect(() => {
    if (currentCheckInTutorialStep !== 'location') {
      setLocationStepCompleted(false);
      setLocationTooltipDismissed(false);
    }
  }, [currentCheckInTutorialStep]);

  // Show tooltip again if location is not set after dismissing
  useEffect(() => {
    if (locationTooltipDismissed && currentCheckInTutorialStep === 'location' && locationInput.trim() === '') {
      // If tooltip was dismissed but location not set, show it again after a delay
      const timer = setTimeout(() => {
        setLocationTooltipDismissed(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [locationTooltipDismissed, currentCheckInTutorialStep, locationInput]);

  // Get tutorial config for current step
  const getTutorialConfig = () => {
    if (!currentCheckInTutorialStep) {
      console.warn('[Tutorial] getTutorialConfig called but no step set');
      return null;
    }

    // Validate step (checkedIn and afterSafe are handled in other components)
    // Removed steps: whoMeeting, socialMedia, duration, bestieSelection, notesPhotos (form sections still functional, just no tooltips)
    const VALID_STEPS = ['location', 'final', 'checkedIn', 'afterSafe'];
    if (!VALID_STEPS.includes(currentCheckInTutorialStep)) {
      console.error('[Tutorial] Invalid step in getTutorialConfig:', currentCheckInTutorialStep);
      return null;
    }
    
    // checkedIn and afterSafe steps are handled in CheckInCard and HomePage respectively
    if (currentCheckInTutorialStep === 'checkedIn' || currentCheckInTutorialStep === 'afterSafe') {
      return null;
    }

    console.log('[Tutorial] getTutorialConfig called for step:', currentCheckInTutorialStep);

    switch (currentCheckInTutorialStep) {
      case 'location':
        // Check if ref is ready
        if (!mapRef?.current) {
          console.warn('[Tutorial] mapRef is not ready for location step');
          return null;
        }
        
        // Initial location explanation
        return {
          highlightedElementRef: mapRef,
          overlayOnElement: true,
          dismissible: true,
          tooltipConfig: {
            title: 'Set Your Location',
            body: `Web browser location isn't very accurate. The mobile app will have precise location that works even when your phone is locked.\n\nYou can use your location now (optional) or enter it manually.`,
            overlayOnElement: true,
            dismissible: true,
            canDismiss: false, // Can't dismiss until location is entered
            buttons: [
              {
                text: 'Use My Location',
                action: 'useLocation',
                primary: true,
              },
              {
                text: 'Enter Manually',
                action: 'enterManually',
                primary: false,
              },
            ],
          },
        };

      case 'final':
        // No tooltip for final step - user can just click the button
          return null;

      default:
        console.error('[Tutorial] Unknown step in getTutorialConfig:', currentCheckInTutorialStep);
        return null;
    }
  };

  // Note: We no longer auto-advance when location is set
  // The user clicks "Use My Location" or "Enter Manually" to advance to final step

  // Scroll sections into view for each tutorial step
  useEffect(() => {
    if (!currentCheckInTutorialStep || !showTutorial) return;

    const scrollToElement = (ref, delay = 300) => {
      setTimeout(() => {
        if (!ref?.current) return;
        
        const element = ref.current;
        const safeZone = 100; // Space above bottom nav

        // Scroll element into view with offset for bottom nav
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Adjust for bottom nav after scroll
        setTimeout(() => {
          window.scrollBy({
            top: -safeZone,
            behavior: 'smooth',
          });
        }, 100);
      }, delay);
    };

    // Scroll based on current step
    switch (currentCheckInTutorialStep) {
      case 'location':
        scrollToElement(mapRef, 500); // Longer delay for map to load
        break;
      default:
        // No scroll needed for other steps
        break;
    }
  }, [currentCheckInTutorialStep, showTutorial]);

  // Handle tutorial step completion
  const handleTutorialStepComplete = async (action) => {
    const stepOrder = ['location', 'final'];
    const currentIndex = stepOrder.indexOf(currentCheckInTutorialStep);

    // Handle location step actions
    if (currentCheckInTutorialStep === 'location') {
      if (action === 'useLocation') {
        // Hide location tooltip and advance to final step (show Create Check-In button tooltip)
        setLocationTooltipDismissed(true);
        setCheckInTutorialStep('final');
        
        // Trigger location request using exposed method from CheckInMap
        // This is more reliable than trying to find and click the button
        const triggerGPS = () => {
          if (checkInMapRef.current?.triggerGPS) {
            const success = checkInMapRef.current.triggerGPS();
            if (success) {
              return true;
            }
          }
          return false;
        };
        
        // Try immediately, then retry if map isn't ready
        setTimeout(() => {
          if (!triggerGPS()) {
            // Map might not be initialized yet, retry with delays
            const retries = [100, 300, 500, 1000];
            let attempt = 0;
            
            const retry = () => {
              if (attempt < retries.length) {
                setTimeout(() => {
                  if (triggerGPS()) {
                    return; // Success
                  }
                  attempt++;
                  retry();
                }, retries[attempt] - (attempt > 0 ? retries[attempt - 1] : 0));
      } else {
                // All retries failed - fallback to finding button manually
                console.warn('[Tutorial] Could not trigger GPS via ref. Falling back to button click.');
                const mapGPSButton = document.querySelector('button[aria-label="Get my current location"]');
                if (mapGPSButton) {
                  const icon = mapGPSButton.querySelector('.material-symbols-outlined');
                  if (icon && icon.textContent.trim() === 'my_location') {
                    mapGPSButton.click();
                  } else {
                    toast.error('Location button not ready. Please try again in a moment.', {
                      duration: 3000
                    });
                  }
      } else {
                  toast.error('Location button not found. Please try clicking it manually.', {
                    duration: 3000
        });
                }
              }
            };
            
            retry();
      }
        }, 100); // Small initial delay to ensure DOM is ready
        return; // Don't continue with normal flow
      } else if (action === 'enterManually') {
        // Hide location tooltip and advance to final step (show Create Check-In button tooltip)
        setLocationTooltipDismissed(true);
        setCheckInTutorialStep('final');
        
        // Focus and highlight the location input field
        setTimeout(() => {
          const locationInput = mapRef.current?.querySelector('input[placeholder*="Search for a place" i]');
          if (locationInput) {
            // Ensure input is visible and focusable
            locationInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Small delay to ensure scroll completes before focus
            setTimeout(() => {
              locationInput.focus();
              // On mobile, ensure keyboard opens by clicking the input
              if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                locationInput.click();
              }
              // Add highlight class temporarily
              locationInput.classList.add('ring-4', 'ring-primary', 'ring-opacity-50');
              setTimeout(() => {
                locationInput.classList.remove('ring-4', 'ring-primary', 'ring-opacity-50');
              }, 2000);
            }, 300);
          }
        }, 50);
        return; // Don't continue with normal flow
      }
    }

    if (action === 'continue') {
      // Move to next step, but validate before final
      if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        
        // Validate before allowing final step
        if (nextStep === 'final') {
          const hasAddress = locationInput.trim() !== '' || location.state?.skipLocation;
          // Allow mock bestie during tutorial
          const hasRealBestie = selectedBesties.some(bestieId => {
            const bestie = besties.find(b => b.id === bestieId);
            return !isMockBestie(bestie);
          });
          const hasMockBestie = selectedBesties.some(bestieId => {
            const bestie = besties.find(b => b.id === bestieId);
            return isMockBestie(bestie);
          });
          const hasBestie = hasRealBestie || hasMockBestie || selectedMessengerContacts.length > 0;
          
          if (!hasAddress || !hasBestie) {
            toast.error('Please add a location and select at least one bestie before continuing.', {
              duration: 4000
            });
            return;
          }
        }
        
        setCheckInTutorialStep(nextStep);
      } else {
        // Finished tutorial
        await markCheckInTutorialComplete();
        setShowTutorial(false);
      }
    } else {
      // Default: move to next step (shouldn't happen with continue buttons)
      if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        
        // Validate before allowing final step
        if (nextStep === 'final') {
          const hasAddress = locationInput.trim() !== '' || location.state?.skipLocation;
          // Allow mock bestie during tutorial
          const hasRealBestie = selectedBesties.some(bestieId => {
            const bestie = besties.find(b => b.id === bestieId);
            return !isMockBestie(bestie);
          });
          const hasMockBestie = selectedBesties.some(bestieId => {
            const bestie = besties.find(b => b.id === bestieId);
            return isMockBestie(bestie);
          });
          const hasBestie = hasRealBestie || hasMockBestie || selectedMessengerContacts.length > 0;
          
          if (!hasAddress || !hasBestie) {
            toast.error('Please add a location and select at least one bestie before continuing.', {
              duration: 4000
            });
            return;
          }
        }
        
        setCheckInTutorialStep(nextStep);
      } else {
        // Finished tutorial
        await markCheckInTutorialComplete();
        setShowTutorial(false);
      }
    }
  };

  // Handle skip tutorial
  const handleSkipTutorial = async () => {
    await markCheckInTutorialComplete();
    setShowTutorial(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter out mock besties and tutorial fake bestie before validation and submission
    const realSelectedBesties = selectedBesties.filter(bestieId => {
      if (bestieId === 'TUTORIAL_FAKE_BESTIE') return false; // Filter out fake tutorial bestie
      const bestie = besties.find(b => b.id === bestieId);
      return !isMockBestie(bestie);
    });
    
    // Check if at least one contact method is selected (either regular bestie OR messenger contact)
    const hasRegularBesties = realSelectedBesties.length > 0;
    const hasMessengerContacts = selectedMessengerContacts.length > 0;
    
    // During tutorial, allow mock bestie or fake bestie selection
    const hasMockBestieSelected = selectedBesties.some(bestieId => {
      if (bestieId === 'TUTORIAL_FAKE_BESTIE') return true; // Fake bestie counts as mock
      const bestie = besties.find(b => b.id === bestieId);
      return isMockBestie(bestie);
    });
    
    // During tutorial, allow check-ins without besties
    const isTutorialMode = showTutorial && !!currentCheckInTutorialStep;
    
    if (!hasRegularBesties && !hasMessengerContacts && !hasMockBestieSelected && !isTutorialMode) {
      errorTracker.trackFunnelStep('checkin', 'error_no_besties');
      setFormErrors(prev => ({ ...prev, besties: 'Please select at least one bestie or messenger contact to notify' }));
      return;
    } else {
      setFormErrors(prev => ({ ...prev, besties: '' }));
    }

    // For regular besties (not mock), check if they have contact methods
    // But allow check-in even if they only have messenger contacts or mock bestie (during tutorial)
    if (hasRegularBesties) {
      const bestiesWithoutContact = realSelectedBesties.filter(bestieId => {
        const bestie = besties.find(b => b.id === bestieId);
        // Check if bestie has any contact method
        return !bestie?.phone && !bestie?.telegramChatId && !bestie?.notificationPreferences?.telegram && !bestie?.notificationPreferences?.push;
      }).map(bestieId => {
        const bestie = besties.find(b => b.id === bestieId);
        return bestie?.name || 'Unknown';
      });

      if (bestiesWithoutContact.length > 0) {
        setFormErrors(prev => ({ 
          ...prev, 
          bestiesWithoutContact: `These besties need to enable notifications: ${bestiesWithoutContact.join(', ')}` 
        }));
        return;
      } else {
        setFormErrors(prev => ({ ...prev, bestiesWithoutContact: '' }));
      }
    }
    
    // Show tutorial message if using mock bestie
    if (hasMockBestieSelected && showTutorial) {
      toast.success('This is a practice check-in! After the tutorial, add real besties to keep you safe. 💜', {
        duration: 5000,
        icon: '🎓'
      });
    }

    // Validate notification channels - check if user has credits if all besties only have SMS
    const validateNotificationChannels = async () => {
      // Skip validation during tutorial mode (for fake bestie or mock bestie)
      const isTutorialMode = showTutorial && !!currentCheckInTutorialStep;
      const hasFakeBestie = selectedBesties.includes('TUTORIAL_FAKE_BESTIE');
      
      if (isTutorialMode && (hasFakeBestie || hasMockBestieSelected)) {
        // Skip SMS credit validation during tutorial
        return true;
      }

      // Get selected besties' notification preferences
      const bestieRefs = realSelectedBesties.map(id => doc(db, 'users', id));
      const bestieSnaps = await Promise.all(bestieRefs.map(ref => getDoc(ref)));

      let hasValidChannel = false;
      let allOnlySMS = true;

      for (const snap of bestieSnaps) {
        if (!snap.exists()) continue;

        const bestieData = snap.data();
        const prefs = bestieData.notificationPreferences || {};

        // Check if bestie has any free channel enabled
        if (prefs.telegram || prefs.email || prefs.facebook || prefs.push) {
          hasValidChannel = true;
          allOnlySMS = false;
          break;
        }

        // If bestie has SMS enabled, check if we have credits
        if (prefs.sms) {
          // Check user's credit balance
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const smsCredits = userDoc.data()?.smsCredits || {};
          const balance = (smsCredits.freeCredits || 0) +
                         (smsCredits.subscriptionCredits || 0) +
                         (smsCredits.extraCredits || 0);

          if (balance >= realSelectedBesties.length) {
            hasValidChannel = true;
          }
        }
      }

      // If all besties only have SMS and user has no credits, block
      if (allOnlySMS && !hasValidChannel) {
        // Show detailed error modal
        setShowNoChannelModal(true);
        return false;
      }

      return true;
    };

    const isValid = await validateNotificationChannels();
    if (!isValid) return;

    // Location is only required for custom check-ins (not quick check-ins)
    const isQuickCheckIn = location.state?.skipLocation || location.state?.quickType;
    if (!isQuickCheckIn && !locationInput.trim()) {
      errorTracker.trackFunnelStep('checkin', 'error_no_location');
      setFormErrors(prev => ({ ...prev, location: 'Please enter a location' }));
      return;
    } else {
      setFormErrors(prev => ({ ...prev, location: '' }));
    }

    if (duration < 10 || duration > 180) {
      setFormErrors(prev => ({ ...prev, duration: 'Duration must be between 10 and 180 minutes' }));
      return;
    } else {
      setFormErrors(prev => ({ ...prev, duration: '' }));
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

          // Filter out mock besties, but keep fake tutorial bestie as placeholder to satisfy Firestore rules
          // We'll filter it out later in cloud functions/backend processing
          const finalBestieIds = selectedBesties.filter(bestieId => {
            // Keep TUTORIAL_FAKE_BESTIE as placeholder if no real besties (satisfies Firestore rules)
            if (bestieId === 'TUTORIAL_FAKE_BESTIE') {
              // Only keep it if we have no other real besties
              const hasRealBesties = selectedBesties.some(id => {
                if (id === 'TUTORIAL_FAKE_BESTIE') return false;
                const bestie = besties.find(b => b.id === id);
                return bestie && !isMockBestie(bestie);
              });
              return !hasRealBesties; // Keep fake bestie only if no real ones
            }
            const bestie = besties.find(b => b.id === bestieId);
            return !isMockBestie(bestie);
          });
          
          const checkInData = {
            userId: currentUser.uid,
            location: locationInput,
            gpsCoords: gpsCoords || null,
            duration: duration,
            alertTime: Timestamp.fromDate(alertTime),
            bestieIds: finalBestieIds, // May include TUTORIAL_FAKE_BESTIE as placeholder
            notes: notes || null,
            meetingWith: meetingWith || null,
            socialMediaLinks: socialMediaLinks || null,
            status: 'active',
            privacyLevel: privacyLevel,
            circleSnapshot: circleSnapshot,
            createdAt: Timestamp.now(),
            lastUpdate: Timestamp.now(),
            isTest: userData?.testMode || false,
            isTutorial: (hasMockBestieSelected || selectedBesties.includes('TUTORIAL_FAKE_BESTIE')) && showTutorial, // Mark as tutorial check-in
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

          // Track analytics
          const { logAnalyticsEvent } = require('../services/firebase');
          logAnalyticsEvent('checkin_created', {
            duration: duration,
            besties_count: finalBestieIds.length,
            messenger_contacts_count: selectedMessengerContacts.length,
            has_photos: validPhotoURLs.length > 0,
            has_notes: !!notes,
            is_tutorial: hasMockBestieSelected && showTutorial
          });

          // Verify the document was created by reading it back
          const docSnap = await getDoc(doc(db, 'checkins', docRef.id));

          if (!docSnap.exists()) {
            throw new Error('Your check-in wasn\'t saved. Please try creating it again.');
          }

          // Verify critical data
          const savedData = docSnap.data();
          if (savedData.userId !== currentUser.uid || savedData.status !== 'active') {
            throw new Error('There was a problem saving your check-in. Please try again.');
          }

          // Verify besties were saved correctly (filter out fake tutorial bestie for comparison)
          const savedBestieIds = (savedData.bestieIds || []).filter(id => id !== 'TUTORIAL_FAKE_BESTIE');
          const expectedBestieIds = finalBestieIds.filter(id => id !== 'TUTORIAL_FAKE_BESTIE');
          
          if (savedBestieIds.length !== expectedBestieIds.length) {
            throw new Error('Your besties weren\'t saved correctly. Please try again.');
          }

          // Verify all bestie IDs match exactly (excluding fake tutorial bestie)
          const bestiesMatch = expectedBestieIds.every(id => savedBestieIds.includes(id));
          if (!bestiesMatch && expectedBestieIds.length > 0) {
            throw new Error('There was a problem saving your bestie list. Please try again.');
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
          // Note: setTimeout is acceptable here as component will unmount on navigation
          // The navigation itself will cancel any pending operations
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
      errorMessage: 'Unable to create your check-in. Please check your connection and try again.',
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
        {/* Test Mode Banner */}
        {userData?.testMode && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧪</span>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">Test Mode Active</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">Your check-ins won't affect stats or analytics</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location with Map */}
          <div ref={mapRef}>
            <CheckInMap
              ref={checkInMapRef}
              locationInput={locationInput}
              setLocationInput={(value) => {
                setLocationInput(value);
                if (value.trim()) {
                  setFormErrors(prev => ({ ...prev, location: '' }));
                }
              }}
              gpsCoords={gpsCoords}
              setGpsCoords={setGpsCoords}
              mapInitialized={mapInitialized}
              setMapInitialized={setMapInitialized}
              autocompleteLoaded={autocompleteLoaded}
              showLocationDropdown={showLocationDropdown}
              setShowLocationDropdown={setShowLocationDropdown}
              loading={loading}
              setLoading={setLoading}
              onLocationSet={(value) => {
                // When location is set via GPS, update locationInput
                // Tutorial will automatically advance when locationInput is set
              }}
            />
          </div>
          {formErrors.location && <InlineError message={formErrors.location} className="px-6 -mt-4" />}

          {/* Who Meeting & Duration Combined */}
          <div className="card p-6">
            <div ref={whoMeetingRef}>
              <MeetingInfoSection
                meetingWith={meetingWith}
                setMeetingWith={setMeetingWith}
                socialMediaLinks={socialMediaLinks}
                setSocialMediaLinks={setSocialMediaLinks}
                socialMediaExpanded={socialMediaExpanded}
                setSocialMediaExpanded={setSocialMediaExpanded}
              />
            </div>

            {/* Social Media Section Ref */}
            <div ref={socialMediaRef} className={socialMediaExpanded ? 'mt-4' : ''} />

            <div ref={durationRef}>
              <DurationSelector
                duration={duration}
                setDuration={(value) => {
                  setDuration(value);
                  if (value >= 10 && value <= 180) {
                    setFormErrors(prev => ({ ...prev, duration: '' }));
                  }
                }}
              />
            </div>
            {formErrors.duration && <InlineError message={formErrors.duration} className="mt-2" />}
          </div>

          {/* Who Should We Alert - Combined Section */}
          {bestiesLoadError && (
            <ContextualError
              message={bestiesLoadError}
              title="Unable to Load Besties"
              onRetry={() => window.location.reload()}
              className="mb-6"
            />
          )}
          <div ref={bestieSelectorRef}>
            <BestieSelector
              isTutorial={showTutorial && !!currentCheckInTutorialStep}
              besties={besties}
              selectedBesties={selectedBesties}
              setSelectedBesties={(besties) => {
                setSelectedBesties(besties);
                if (besties.length > 0 || selectedMessengerContacts.length > 0) {
                  setFormErrors(prev => ({ ...prev, besties: '' }));
                }
              }}
              messengerContacts={messengerContacts}
              selectedMessengerContacts={selectedMessengerContacts}
              setSelectedMessengerContacts={(contacts) => {
                setSelectedMessengerContacts(contacts);
                if (contacts.length > 0 || selectedBesties.length > 0) {
                  setFormErrors(prev => ({ ...prev, besties: '' }));
                }
              }}
              userId={currentUser?.uid}
              showMessenger={FEATURES.messengerAlerts}
            />
          </div>
          {formErrors.besties && <InlineError message={formErrors.besties} className="px-6 -mt-4" />}
          {formErrors.bestiesWithoutContact && (
            <ContextualError
              message={formErrors.bestiesWithoutContact}
              title="Notification Settings Required"
              className="mt-4"
            />
          )}

          {/* Notes and Photos */}
          <div ref={notesPhotosRef}>
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
          </div>

          {/* Submit */}
          <button
            ref={submitButtonRef}
            type="submit"
            id="create-checkin-submit-btn"
            disabled={loading || (!showTutorial && selectedBesties.length === 0 && selectedMessengerContacts.length === 0)}
            className="w-full btn btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Start safety check-in"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating...
              </span>
            ) : (
              '🛡️ Start Check-In'
            )}
          </button>
        </form>

        {/* Tutorial Overlay */}
        {(() => {
          // Don't show tooltip if it was dismissed for location step
          const shouldHideTooltip = currentCheckInTutorialStep === 'location' && locationTooltipDismissed && locationInput.trim() === '';
          const shouldRender = showTutorial && currentCheckInTutorialStep && !shouldHideTooltip;
          console.log('[Tutorial] Render check:', {
            showTutorial,
            currentCheckInTutorialStep,
            shouldRender,
            locationTooltipDismissed,
            locationInput: locationInput.trim()
          });

          if (!shouldRender) {
            return null;
          }

          const config = getTutorialConfig();
          console.log('[Tutorial] Config result:', config ? 'exists' : 'null', {
            step: currentCheckInTutorialStep,
            hasRef: config?.highlightedElementRef?.current ? 'yes' : 'no'
          });

          if (!config) {
            console.error('[Tutorial] Config is null for step:', currentCheckInTutorialStep, {
              step: currentCheckInTutorialStep,
              refStatus: {
                mapRef: mapRef?.current ? 'ready' : 'null',
                whoMeetingRef: whoMeetingRef?.current ? 'ready' : 'null',
                socialMediaRef: socialMediaRef?.current ? 'ready' : 'null',
                durationRef: durationRef?.current ? 'ready' : 'null',
                bestieSelectorRef: bestieSelectorRef?.current ? 'ready' : 'null',
                notesPhotosRef: notesPhotosRef?.current ? 'ready' : 'null',
                submitButtonRef: submitButtonRef?.current ? 'ready' : 'null',
              }
            });
            return null;
          }

          return (
            <CheckInTutorialOverlay
              currentStep={currentCheckInTutorialStep}
              onStepComplete={handleTutorialStepComplete}
              onSkipTutorial={handleSkipTutorial}
              highlightedElementRef={config.highlightedElementRef}
              tooltipConfig={config.tooltipConfig}
              isFirstStep={currentCheckInTutorialStep === 'location'}
            />
          );
        })()}
        
      </div>

      {/* Cannot Create Check-In Modal */}
      {showNoChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-3">
              🚫 Cannot Create Check-In
            </h3>
            <p className="text-text-secondary mb-4">
              Your selected besties only have SMS notifications enabled, but you have no SMS credits remaining.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                Choose one of these options:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <li>• Purchase SMS credits ($2/month for 15 credits)</li>
                <li>• Ask your besties to enable free channels (Telegram, Email)</li>
                <li>• Add a bestie who has Telegram or Email enabled</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNoChannelModal(false);
                  navigate('/settings');
                }}
                className="btn btn-primary flex-1"
              >
                Buy SMS Credits
              </button>
              <button
                onClick={() => setShowNoChannelModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCheckInPage;
