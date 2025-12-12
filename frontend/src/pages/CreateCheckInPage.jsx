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
          setBestiesLoading(false); // Set to false AFTER setting empty array
          return;
        }

        const userData = userDoc.data();
        const featuredIds = userData.featuredCircle || [];

        if (featuredIds.length === 0) {
          console.warn('⚠️ featuredCircle is empty - no besties to load');
          setBesties([]);
          setBestiesLoading(false); // Set to false AFTER setting empty array
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
          currentUser: currentUser.uid
        });
        
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
  }, [currentUser, authLoading, checkInTutorialComplete, hasCheckedForFirstCheckIn, setCheckInTutorialStep, bestiesLoading, bestiesLoadingTimeout, isTutorialStateLoaded, location.state?.quickType, location.state?.skipLocation]);

  // Scroll submit button into view on final step
  useEffect(() => {
    if (currentCheckInTutorialStep === 'final' && submitButtonRef.current) {
      // Small delay to ensure tooltip is rendered first
      setTimeout(() => {
        submitButtonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [currentCheckInTutorialStep]);

  // Get tutorial config for current step
  const getTutorialConfig = () => {
    if (!currentCheckInTutorialStep) {
      console.warn('[Tutorial] getTutorialConfig called but no step set');
      return null;
    }

    // Validate step
    const VALID_STEPS = ['location', 'whoMeeting', 'socialMedia', 'duration', 'bestieSelection', 'notesPhotos', 'final'];
    if (!VALID_STEPS.includes(currentCheckInTutorialStep)) {
      console.error('[Tutorial] Invalid step in getTutorialConfig:', currentCheckInTutorialStep);
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
        return {
          highlightedElementRef: mapRef,
          overlayOnElement: true,
          dismissible: true,
          tooltipConfig: {
            title: 'Where are you going?',
            body: `Tap the map or search for your location.\n\nThis is for your safety - your bestie will know where to find you if something feels off.`,
            overlayOnElement: true,
            dismissible: true,
            canDismiss: locationInput.trim() !== '', // Only allow dismiss when address is entered
          },
        };

      case 'whoMeeting':
        if (!whoMeetingRef?.current) {
          console.warn('[Tutorial] whoMeetingRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: whoMeetingRef,
          overlayOnElement: false,
          tooltipConfig: {
            body: `Add a name if you'd like. Examples: 'Sarah from Hinge', 'Mike - new friend', or 'Marketplace seller'.\n\nTotally optional - skip if you prefer privacy.`,
            buttons: [
              { text: 'Skip', action: 'skip', primary: false },
              { text: 'Continue', action: 'continue', primary: true },
            ],
          },
        };

      case 'socialMedia':
        if (!socialMediaRef?.current) {
          console.warn('[Tutorial] socialMediaRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: socialMediaRef,
          overlayOnElement: false,
          tooltipConfig: {
            body: `Want to add their Instagram or Facebook?\n\nThis gives your bestie more info if they need to verify who you're with.`,
            buttons: [
              { text: 'Skip', action: 'skip', primary: false },
              { text: 'Add Social', action: 'addSocial', primary: true },
            ],
          },
        };

      case 'duration':
        if (!durationRef?.current) {
          console.warn('[Tutorial] durationRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: durationRef,
          overlayOnElement: false,
          tooltipConfig: {
            body: `How long will you be gone?\n\nDefault is 30 minutes. Adjust if you need more time - your bestie will be notified if you don't check in by then.`,
            buttons: [
              { text: 'Use Default', action: 'useDefault', primary: false },
              { text: 'Set Custom Time', action: 'setCustom', primary: true },
            ],
          },
        };

      case 'bestieSelection':
        if (!bestieSelectorRef?.current) {
          console.warn('[Tutorial] bestieSelectorRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: bestieSelectorRef,
          overlayOnElement: false,
          tooltipConfig: {
            title: 'Who should know?',
            body: besties.length === 0 
              ? `You'll need to add besties first before creating check-ins.\n\nGo to your profile to add besties, then come back to create your first check-in!`
              : `Select at least one bestie who'll get notifications about this check-in.\n\nChoose whoever you trust and who's most likely to notice if something's wrong.`,
          },
        };

      case 'notesPhotos':
        if (!notesPhotosRef?.current) {
          console.warn('[Tutorial] notesPhotosRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: notesPhotosRef,
          overlayOnElement: false,
          tooltipConfig: {
            title: 'Any extra details?',
            body: `Want to add notes or photos? Completely optional.\n\nExamples: what they're wearing, car details, meeting spot specifics, or any other info your bestie might need.`,
            buttons: [
              { text: 'Skip to Submit', action: 'skip', primary: false },
              { text: 'Add Details', action: 'addDetails', primary: true },
            ],
          },
        };

      case 'final':
        if (!submitButtonRef?.current) {
          console.warn('[Tutorial] submitButtonRef is not ready');
          return null;
        }
        return {
          highlightedElementRef: submitButtonRef,
          overlayOnElement: false,
          tooltipConfig: {
            icon: '💜',
            title: "You're Ready!",
            body: `Everything looks good! Tap the '🛡️ Start Check-In' button below to create your check-in.\n\nYour bestie will get a notification and your timer starts. You're in control. You're prepared. We've got your back.`,
            buttons: [
              { text: 'Got it', action: 'continue', primary: true },
            ],
          },
        };

      default:
        console.error('[Tutorial] Unknown step in getTutorialConfig:', currentCheckInTutorialStep);
        return null;
    }
  };

  // Handle tutorial step completion
  const handleTutorialStepComplete = async (action) => {
    const stepOrder = ['location', 'whoMeeting', 'socialMedia', 'duration', 'bestieSelection', 'notesPhotos', 'final'];
    const currentIndex = stepOrder.indexOf(currentCheckInTutorialStep);

    if (action === 'skip' && currentCheckInTutorialStep === 'whoMeeting') {
      // Skip to social media
      setCheckInTutorialStep('socialMedia');
    } else if (action === 'skip' && currentCheckInTutorialStep === 'socialMedia') {
      // Skip to duration
      setCheckInTutorialStep('duration');
    } else if (action === 'useDefault' && currentCheckInTutorialStep === 'duration') {
      // Use default duration, move to bestie selection
      setCheckInTutorialStep('bestieSelection');
    } else if (action === 'setCustom' && currentCheckInTutorialStep === 'duration') {
      // Let them adjust, then move to bestie selection
      setCheckInTutorialStep('bestieSelection');
    } else if (action === 'skip' && currentCheckInTutorialStep === 'notesPhotos') {
      // Skip to final - but validate first
      const hasAddress = locationInput.trim() !== '' || location.state?.skipLocation;
      const hasBestie = selectedBesties.length > 0 || selectedMessengerContacts.length > 0;
      
      if (hasAddress && hasBestie) {
        setCheckInTutorialStep('final');
      } else {
        // Can't proceed to final without required fields
        toast.error('Please add a location and select at least one bestie before continuing.', {
          duration: 4000
        });
        return;
      }
    } else if (action === 'addDetails' && currentCheckInTutorialStep === 'notesPhotos') {
      // Expand notes/photos, then move to final - but validate first
      const hasAddress = locationInput.trim() !== '' || location.state?.skipLocation;
      const hasBestie = selectedBesties.length > 0 || selectedMessengerContacts.length > 0;
      
      if (hasAddress && hasBestie) {
        setNotesExpanded(true);
        setCheckInTutorialStep('final');
      } else {
        toast.error('Please add a location and select at least one bestie before continuing.', {
          duration: 4000
        });
        return;
      }
    } else if (action === 'addSocial' && currentCheckInTutorialStep === 'socialMedia') {
      // Expand social media, then move to duration
      setSocialMediaExpanded(true);
      setCheckInTutorialStep('duration');
    } else if (action === 'continue') {
      // Move to next step, but validate before final
      if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        
        // Validate before allowing final step
        if (nextStep === 'final') {
          const hasAddress = locationInput.trim() !== '' || location.state?.skipLocation;
          const hasBestie = selectedBesties.length > 0 || selectedMessengerContacts.length > 0;
          
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
          const hasBestie = selectedBesties.length > 0 || selectedMessengerContacts.length > 0;
          
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

    // Check if at least one contact method is selected (either regular bestie OR messenger contact)
    const hasRegularBesties = selectedBesties.length > 0;
    const hasMessengerContacts = selectedMessengerContacts.length > 0;
    
    if (!hasRegularBesties && !hasMessengerContacts) {
      errorTracker.trackFunnelStep('checkin', 'error_no_besties');
      setFormErrors(prev => ({ ...prev, besties: 'Please select at least one bestie or messenger contact to notify' }));
      return;
    } else {
      setFormErrors(prev => ({ ...prev, besties: '' }));
    }

    // For regular besties, check if they have contact methods (phone+SMS, telegram, or push)
    // But allow check-in even if they only have messenger contacts
    if (hasRegularBesties) {
      const bestiesWithoutContact = selectedBesties.filter(bestieId => {
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

          const checkInData = {
            userId: currentUser.uid,
            location: locationInput,
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
            isTest: userData?.testMode || false,
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
            besties_count: selectedBesties.length,
            messenger_contacts_count: selectedMessengerContacts.length,
            has_photos: validPhotoURLs.length > 0,
            has_notes: !!notes
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

          // Verify besties were saved correctly
          if (!savedData.bestieIds || savedData.bestieIds.length !== selectedBesties.length) {
            throw new Error('Your besties weren\'t saved correctly. Please try again.');
          }

          // Verify all bestie IDs match exactly
          const bestiesMatch = selectedBesties.every(id => savedData.bestieIds.includes(id));
          if (!bestiesMatch) {
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
            disabled={loading || (selectedBesties.length === 0 && selectedMessengerContacts.length === 0)}
            className={`w-full btn btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transform transition-all hover:scale-[1.02] active:scale-[0.98] ${
              currentCheckInTutorialStep === 'final' ? 'animate-pulse ring-4 ring-primary ring-opacity-50' : ''
            }`}
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
          const shouldRender = showTutorial && currentCheckInTutorialStep;
          console.log('[Tutorial] Render check:', {
            showTutorial,
            currentCheckInTutorialStep,
            shouldRender
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
    </div>
  );
};

export default CreateCheckInPage;
