import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, limit } from 'firebase/firestore';
import CheckInCard from '../components/CheckInCard';
import QuickCheckInButtons from '../components/QuickCheckInButtons';
import LivingCircle from '../components/LivingCircle';
import DonationCard from '../components/DonationCard';
import WeeklySummary from '../components/profile/WeeklySummary';
import { getFunctions, httpsCallable } from 'firebase/functions';
import OfflineBanner from '../components/OfflineBanner';
import InviteFriendsModal from '../components/InviteFriendsModal';
import ActiveAlertBanner from '../components/alerts/ActiveAlertBanner';
import { useTutorialState } from '../hooks/useTutorialState';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
// FloatingNotificationBell removed per user request
import { logAlertResponse } from '../services/interactionTracking';
import toast from 'react-hot-toast';


const HomePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // SOS state
  const [sosLoading, setSosLoading] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const handleSOS = async () => {
    if (sosLoading || sosTriggered) return;
    // Check besties exist before confirming
    const bestieCount = userData?.stats?.totalBesties || 0;
    if (bestieCount === 0) {
      toast.error('Add at least one bestie before using SOS — they need to know who to alert!', { duration: 5000 });
      return;
    }
    const confirmed = window.confirm('🆘 TRIGGER SOS?\n\nThis will immediately alert all your besties that you need help. Only use in a real emergency.');
    if (!confirmed) return;
    setSosLoading(true);
    try {
      const fns = getFunctions();
      const triggerSOS = httpsCallable(fns, 'triggerEmergencySOS');
      await triggerSOS({ location: 'Unknown' });
      setSosTriggered(true);
      toast.success('🆘 SOS sent! Your besties have been alerted.', { duration: 6000 });
    } catch (err) {
      toast.error(err.message || 'Failed to send SOS. Please call 911.');
    } finally {
      setSosLoading(false);
    }
  };

  // 60-second alarm when a check-in expires client-side
  const alarmRef = useRef(null);
  const [alarmActive, setAlarmActive] = useState(false);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* browser may block audio before user interaction */ }
  }, []);

  const startAlarm = useCallback(() => {
    if (alarmRef.current) return;
    setAlarmActive(true);
    playBeep();
    const interval = setInterval(playBeep, 1200);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setAlarmActive(false);
      alarmRef.current = null;
    }, 60000);
    alarmRef.current = { interval, timeout };
  }, [playBeep]);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      clearInterval(alarmRef.current.interval);
      clearTimeout(alarmRef.current.timeout);
      alarmRef.current = null;
    }
    setAlarmActive(false);
  }, []);

  // Detect expired non-test check-ins and trigger alarm
  useEffect(() => {
    if (activeCheckIns.length === 0) return;
    const check = () => {
      const now = Date.now();
      const expired = activeCheckIns.find(
        c => !c.isTest && c.alertTime && c.alertTime.toMillis() <= now
      );
      if (expired) startAlarm();
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [activeCheckIns, startAlarm]);

  // Stop alarm if all check-ins are resolved
  useEffect(() => {
    if (activeCheckIns.length === 0) stopAlarm();
  }, [activeCheckIns, stopAlarm]);

  // Cleanup alarm on unmount
  useEffect(() => {
    return () => {
      if (alarmRef.current) {
        clearInterval(alarmRef.current.interval);
        clearTimeout(alarmRef.current.timeout);
      }
    };
  }, []);

  // Invite Friends modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Track if tutorial modal is open (to hide tutorial overlay)
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  // Tutorial state - NEW FLOW: welcome, allButtons, quickCheckIns, afterQuickCheckIn, custom
  const { tutorialComplete, currentTutorialStep, tutorialStateLoaded, firestoreSynced, markTutorialComplete, setTutorialStep } = useTutorialState();
  // eslint-disable-next-line no-unused-vars
  const { currentCheckInTutorialStep, setCheckInTutorialStep, markCheckInTutorialComplete } = useCheckInTutorialState();
  const quickCheckInButtonsRef = useRef(null);
  const livingCircleRef = useRef(null);
  const activeCheckInCardRef = useRef(null);
  const [previousCheckInCount, setPreviousCheckInCount] = useState(0);
  // Use ref for previousCheckInIds to avoid re-subscribing Firestore listeners
  // Sets are compared by reference, causing useEffect to re-run 
  const previousCheckInIdsRef = useRef(new Set());
  // Use refs for tutorial steps to avoid re-subscribing when they change
  const currentTutorialStepRef = useRef(currentTutorialStep);
  const currentCheckInTutorialStepRef = useRef(currentCheckInTutorialStep);
  const [showBestieCircleTutorial] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [checkedInTooltipDismissed, setCheckedInTooltipDismissed] = useState(false);

  // Scroll to bestie circle when tutorial starts
  useEffect(() => {
    if (showBestieCircleTutorial && livingCircleRef.current) {
      setTimeout(() => {
        livingCircleRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500); // Small delay to ensure overlay is rendered
    }
  }, [showBestieCircleTutorial]);

  // Keep refs in sync with state values
  useEffect(() => {
    currentTutorialStepRef.current = currentTutorialStep;
  }, [currentTutorialStep]);

  useEffect(() => {
    currentCheckInTutorialStepRef.current = currentCheckInTutorialStep;
  }, [currentCheckInTutorialStep]);

  useEffect(() => {
    if (currentCheckInTutorialStep !== 'checkedIn') {
      tutorialMockLoggedRef.current = false;
    }
  }, [currentCheckInTutorialStep]);

  // Debug logging removed for production

  // Track when tutorial step was last set to prevent premature clearing
  const tutorialStepSetTimeRef = useRef(null);
  const onboardingJustCompletedRef = useRef(false);
  const tutorialAutoStartAttemptedRef = useRef(false); // Track if we've already tried to auto-start
  /** Avoid console spam: mock merge runs on every Firestore snapshot but isn't "new" each time */
  const tutorialMockLoggedRef = useRef(false);

  // Track when onboarding is completed to prevent clearing tutorial step
  useEffect(() => {
    if (userData?.onboardingCompleted && !tutorialComplete && !currentTutorialStep) {
      onboardingJustCompletedRef.current = true;
      // Reset flag after 2 seconds (enough time for tutorial to start)
      setTimeout(() => {
        onboardingJustCompletedRef.current = false;
      }, 2000);
    }
  }, [userData?.onboardingCompleted, tutorialComplete, currentTutorialStep]);

  // Validate tutorial state and clean up invalid states
  useEffect(() => {
    // Don't validate until tutorial state has finished loading
    if (!tutorialStateLoaded) {
      console.log('[HomePage] Validation effect: Waiting for tutorial state to load');
      return;
    }

    const validSteps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    // Check-in tutorial steps that use the same state but should not be validated here
    const checkInTutorialSteps = ['rideshare', 'walking', 'quickmeet'];

    // If tutorial is marked complete but has a step, clear the step
    // But don't clear if onboarding just completed (tutorial is about to start)
    if (tutorialComplete && currentTutorialStep && !onboardingJustCompletedRef.current) {
      console.log('[HomePage] Validation: Tutorial complete but has step, clearing step');
      setTutorialStep(null);
      return;
    }

    // Skip validation for check-in tutorial steps (they're managed by check-in tutorial system)
    if (currentTutorialStep && checkInTutorialSteps.includes(currentTutorialStep)) {
      return;
    }

    // If we have an invalid step, reset to null
    // But don't clear if it was just set (within last 500ms) or onboarding just completed - prevents race condition
    if (currentTutorialStep && !validSteps.includes(currentTutorialStep)) {
      const timeSinceSet = tutorialStepSetTimeRef.current
        ? Date.now() - tutorialStepSetTimeRef.current
        : Infinity;

      if (timeSinceSet > 500 && !onboardingJustCompletedRef.current) {
        console.warn('[HomePage] Validation: Invalid tutorial step detected:', currentTutorialStep, '- resetting');
        setTutorialStep(null);
      } else {
        console.log('[HomePage] Validation: Step was just set or onboarding just completed, skipping validation to prevent race condition');
      }
      return;
    }
  }, [currentTutorialStep, tutorialComplete, tutorialStateLoaded, setTutorialStep]);

  // Besties state for weekly summary
  const [besties, setBesties] = useState([]);

  // Alerted check-ins from besties (where current user is a selected bestie)
  const [alertedBestieCheckIns, setAlertedBestieCheckIns] = useState([]);

  // Analytics stats
  // eslint-disable-next-line no-unused-vars
  const [emergencyContactCount, setEmergencyContactCount] = useState(0);

  // Auto-redirect to onboarding if user hasn't completed it
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (userData && userData.onboardingCompleted === false) {
      navigate('/onboarding');
    }
  }, [userData, authLoading, navigate]);

  // Auto-start tutorial when user first lands after onboarding
  // Simple rule: If onboarding is completed and tutorial is not complete, start it
  useEffect(() => {
    if (authLoading) return;
    if (!userData) return;
    if (!tutorialStateLoaded) return; // Wait for tutorial state to finish loading
    if (!firestoreSynced) return; // Wait for Firestore sync to complete
    if (tutorialAutoStartAttemptedRef.current) return; // Already attempted, don't try again
    if (currentTutorialStep) return; // Tutorial step already set, don't override

    // Only check: onboarding completed AND tutorial not complete
    // Disabled for MVP - users now run through the interactive 5-step tutorial during onboarding
    const shouldAutoStart = false; // userData.onboardingCompleted && !tutorialComplete;

    if (shouldAutoStart) {
      tutorialAutoStartAttemptedRef.current = true; // Mark as attempted immediately
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        // Double-check we still need to set it (might have been set by another effect)
        if (!currentTutorialStep) {
          tutorialStepSetTimeRef.current = Date.now();
          setTutorialStep('welcome');
        }
      }, 300);
    }
  }, [userData, authLoading, tutorialComplete, currentTutorialStep, tutorialStateLoaded, firestoreSynced, setTutorialStep]);

  // Redirect to login if there's a pending invite and user is not logged in
  useEffect(() => {
    if (authLoading) return;

    const pendingInvite = sessionStorage.getItem('pending_invite') || localStorage.getItem('pending_invite');
    if (pendingInvite && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);


  useEffect(() => {
    if (!currentUser) return;

    // Listen to active check-ins from current user
    const checkInsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['active', 'alerted']),
      limit(50) // Reasonable limit for active check-ins
    );

    const unsubscribeCheckIns = onSnapshot(
      checkInsQuery,
      (snapshot) => {
        const checkIns = [];
        snapshot.forEach((doc) => {
          checkIns.push({ id: doc.id, ...doc.data() });
        });

        // Add mock check-in from localStorage during tutorial
        const mockCheckInStr = localStorage.getItem('tutorial_mock_checkin');
        if (mockCheckInStr && currentCheckInTutorialStep === 'checkedIn') {
          try {
            const mockCheckIn = JSON.parse(mockCheckInStr);

            // Only add if not already in the array (prevent infinite loop)
            const mockExists = checkIns.some(c => c.id === 'tutorial-mock-checkin');
            if (!mockExists) {
              // Convert ISO string dates to Timestamp-like objects
              // CheckInCard expects .toDate() method on these fields
              if (mockCheckIn.createdAt && typeof mockCheckIn.createdAt === 'string') {
                const createdDate = new Date(mockCheckIn.createdAt);
                mockCheckIn.createdAt = {
                  toDate: () => createdDate,
                  seconds: Math.floor(createdDate.getTime() / 1000),
                  nanoseconds: 0
                };
              }
              if (mockCheckIn.lastUpdate && typeof mockCheckIn.lastUpdate === 'string') {
                const updateDate = new Date(mockCheckIn.lastUpdate);
                mockCheckIn.lastUpdate = {
                  toDate: () => updateDate,
                  seconds: Math.floor(updateDate.getTime() / 1000),
                  nanoseconds: 0
                };
              }
              if (mockCheckIn.alertTime && typeof mockCheckIn.alertTime === 'string') {
                const alertDate = new Date(mockCheckIn.alertTime);
                mockCheckIn.alertTime = {
                  toDate: () => alertDate,
                  seconds: Math.floor(alertDate.getTime() / 1000),
                  nanoseconds: 0
                };
              }

              if (!tutorialMockLoggedRef.current) {
                console.log('[Tutorial] Loading mock check-in from localStorage:', mockCheckIn);
                tutorialMockLoggedRef.current = true;
              }
              checkIns.unshift(mockCheckIn); // Add to beginning of array
            }
          } catch (e) {
            console.error('[Tutorial] Error parsing mock check-in:', e);
          }
        }

        // Detect check-in creation during tutorial - use ref to get current step
        if (currentTutorialStepRef.current === 'quickCheckIns' && checkIns.length > previousCheckInCount) {
          // Check-in was just created - advance tutorial
          setTimeout(() => {
            setTutorialStep('afterQuickCheckIn');
          }, 1000); // Small delay to let user see their check-in
        }

        // Detect check-in completion (check-in disappeared from active list)
        const currentCheckInIds = new Set(checkIns.map(c => c.id));
        const completedCheckInId = Array.from(previousCheckInIdsRef.current).find(id => !currentCheckInIds.has(id));

        // Use ref to get current check-in tutorial step
        if (completedCheckInId && currentCheckInTutorialStepRef.current === 'checkedIn') {
          // Check-in was just completed - show afterSafe tutorial step
          console.log('[Tutorial] Check-in completed, showing afterSafe tooltip');
          // Remove mock check-in from localStorage
          localStorage.removeItem('tutorial_mock_checkin');
          tutorialMockLoggedRef.current = false;
          setTimeout(() => {
            setCheckInTutorialStep('afterSafe');
          }, 1000); // Increased from 500ms to ensure navigation completes
        }

        setPreviousCheckInCount(checkIns.length);
        previousCheckInIdsRef.current = currentCheckInIds;
        setActiveCheckIns(checkIns);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading check-ins:', error);
        // Don't show toast for permission errors (might be race condition)
        if (error.code !== 'permission-denied') {
          toast.error('Unable to load your check-ins. Please refresh the page.', { duration: 4000 });
        }
        setActiveCheckIns([]);
        setLoading(false);
      }
    );

    // ALSO listen to alerted check-ins where current user is a selected bestie
    const alertedBestieQuery = query(
      collection(db, 'checkins'),
      where('bestieIds', 'array-contains', currentUser.uid),
      where('status', '==', 'alerted'),
      limit(20) // Reasonable limit for alerted check-ins
    );

    const unsubscribeAlerted = onSnapshot(
      alertedBestieQuery,
      async (snapshot) => {
        const alertedCheckIns = [];
        const userIds = new Set();

        // Collect all unique user IDs first
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId) {
            userIds.add(data.userId);
          }
        });

        // Batch fetch all user documents at once (fixes N+1 query)
        const userDocs = new Map();
        if (userIds.size > 0) {
          const userPromises = Array.from(userIds).map(async (userId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', userId));
              return { userId, userDoc };
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              return { userId, userDoc: null };
            }
          });

          const userResults = await Promise.all(userPromises);
          userResults.forEach(({ userId, userDoc }) => {
            if (userDoc?.exists()) {
              userDocs.set(userId, userDoc.data().displayName || 'Bestie');
            } else {
              userDocs.set(userId, 'Bestie');
            }
          });
        }

        // Now build the alerted check-ins array with user names
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const userName = userDocs.get(data.userId) || 'Bestie';

          alertedCheckIns.push({
            id: docSnap.id,
            ...data,
            userName
          });
        });

        setAlertedBestieCheckIns(alertedCheckIns);
      },
      (error) => {
        console.error('Error loading alerted check-ins:', error);
        setAlertedBestieCheckIns([]);
      }
    );

    return () => {
      unsubscribeCheckIns();
      unsubscribeAlerted();
    };
    // Note: Tutorial step refs are used inside callbacks to avoid re-subscriptions
    // previousCheckInCount is still needed because it's used for comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, previousCheckInCount, setTutorialStep, setCheckInTutorialStep]);

  // Listen for tutorial check-in completion
  useEffect(() => {
    const handleTutorialCheckInCompleted = (event) => {
      if (event.detail.checkInId === 'tutorial-mock-checkin' && currentCheckInTutorialStep === 'checkedIn') {
        console.log('[Tutorial] Tutorial check-in completed, advancing to afterSafe step');
        setTimeout(() => {
          setCheckInTutorialStep('afterSafe');
        }, 100); // Small delay to ensure state is updated
      }
    };

    window.addEventListener('tutorial_checkin_completed', handleTutorialCheckInCompleted);

    return () => {
      window.removeEventListener('tutorial_checkin_completed', handleTutorialCheckInCompleted);
    };
  }, [currentCheckInTutorialStep, setCheckInTutorialStep]);

  // Load alerts for featured circle besties
  useEffect(() => {
    if (!currentUser || !userData) return;

    const loadBesties = async () => {
      try {
        // Get user's featured circle
        const featuredCircle = userData.featuredCircle || [];
        if (featuredCircle.length === 0) {
          setBesties([]);
          return;
        }

        // Load bestie names/info for weekly summary
        const bestiesData = [];
        for (const bestieId of featuredCircle) {
          const userDoc = await getDoc(doc(db, 'users', bestieId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            bestiesData.push({
              userId: bestieId,
              name: data.displayName || 'Bestie',
              phone: data.phone
            });
          }
        }
        setBesties(bestiesData);
      } catch (error) {
        console.error('Error loading besties:', error);
      }
    };

    loadBesties();
  }, [currentUser, userData]);

  // Load analytics stats
  useEffect(() => {
    if (!currentUser) return;

    const loadAnalytics = async () => {
      try {
        // Count emergency contact selections
        // Use bestieUserIds for better security rule compatibility
        const emergencyQuery = query(
          collection(db, 'checkins'),
          where('bestieUserIds', 'array-contains', currentUser.uid),
          limit(1000) // Limit for analytics count (reasonable upper bound)
        );
        const emergencySnapshot = await getDocs(emergencyQuery);
        setEmergencyContactCount(emergencySnapshot.size);

        // Days active calculation removed - not used in HomePage
        // (ProfilePage handles this calculation for user stats display)

      } catch (error) {
        console.error('Error loading analytics:', error);
        // If permission error, it might be a race condition - set to 0 instead of crashing
        if (error.code === 'permission-denied') {
          console.warn('Permission denied loading analytics - may be race condition. Setting count to 0.');
          setEmergencyContactCount(0);
        }
      }
    };

    loadAnalytics();
  }, [currentUser, userData]);

  // Weekly Summary Logic
  const hasWeekOfActivity = () => {
    const firstCheckIn = userData?.stats?.firstCheckInDate?.toDate?.() || userData?.stats?.firstCheckInDate;
    if (!firstCheckIn) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return firstCheckIn <= weekAgo;
  };

  const getWeeklySummary = () => {
    if (!hasWeekOfActivity()) {
      return {
        status: 'new',
        emoji: '🌱',
        message: 'Building your safety journey',
        tip: 'You\'ll get your weekly summary after you have one week of activity!'
      };
    }

    const checkIns = userData?.stats?.totalCheckIns || 0;
    const totalBesties = besties.length || 0;

    if (checkIns >= 7 && totalBesties >= 3) {
      return {
        status: 'excellent',
        emoji: '🌟',
        message: 'You\'re absolutely crushing it this week!',
        tip: 'Keep up the amazing safety habits!'
      };
    } else if (checkIns >= 3 || totalBesties >= 3) {
      return {
        status: 'good',
        emoji: '💪',
        message: 'You\'re doing great! Keep it up!',
        tip: 'Try to check in regularly and add more besties.'
      };
    } else {
      return {
        status: 'needsWork',
        emoji: '💜',
        message: 'Let\'s build your safety network!',
        tip: 'Start by adding your closest friends as besties.'
      };
    }
  };

  const weeklySummary = getWeeklySummary();

  const handleTutorialNext = () => {
    const steps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    const currentIndex = steps.indexOf(currentTutorialStep);

    if (currentIndex < steps.length - 1) {
      haptic.success();
      setTutorialStep(steps[currentIndex + 1]);
    } else {
      // Tutorial complete - celebrate!
      haptic.success();
      markTutorialComplete();
      toast.success("You're all set! Your besties are ready to keep you safe. 💜", {
        duration: 4000,
        icon: '🎉'
      });
    }
  };

  const handleSkipTutorial = () => {
    markTutorialComplete();
  };

  const handleTutorialAction = (action) => {
    // This function is no longer needed in the new flow
    // Buttons handle their own clicks now
    haptic.light();
  };

  const handleTutorialModalComplete = () => {
    // Called when user completes a quick check-in in tutorial mode
    if (currentTutorialStep === 'quickCheckIns') {
      setTutorialStep('afterQuickCheckIn');
    }
  };

  const handleCustomButtonClick = () => {
    // Called when user clicks custom button during tutorial
    if (currentTutorialStep === 'custom') {
      // Complete the homepage tutorial
      markTutorialComplete();
      // Start the check-in tutorial at the location step
      setCheckInTutorialStep('location');
    }
  };

  // Get highlighted element ref based on current step (tutorial hidden in MVP)
  // eslint-disable-next-line no-unused-vars
  const getHighlightedElementRef = () => {
    // Always return consistent structure: { current: element | null }
    if (!quickCheckInButtonsRef.current) {
      return { current: null };
    }

    try {
      let element = null;
      switch (currentTutorialStep) {
        case 'welcome':
          // DON'T highlight the buttons during welcome step
          element = null;
          break;
        case 'allButtons':
          // Highlight entire container
          element = quickCheckInButtonsRef.current.containerRef || null;
          break;
        case 'quickCheckIns':
          // Highlight only the 3-button grid (not the custom button)
          element = quickCheckInButtonsRef.current.threeButtonsContainer || null;
          break;
        case 'afterQuickCheckIn':
          // No element highlighted - show message
          element = null;
          break;
        case 'custom':
          element = quickCheckInButtonsRef.current.customButton || null;
          break;
        default:
          element = null;
      }
      return { current: element };
    } catch (error) {
      console.error('Error getting highlighted element ref:', error);
      return { current: null };
    }
  };

  // Get tooltip config based on current step - NEW FLOW
  const getTooltipConfig = () => {
    // If no step or invalid step, return null
    if (!currentTutorialStep) return null;

    // If tutorial is marked complete, don't show tooltip
    if (tutorialComplete) return null;

    const steps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    const stepIndex = steps.indexOf(currentTutorialStep);

    // If step is not in valid steps, return null and reset
    if (stepIndex === -1) {
      console.warn('Invalid tutorial step in getTooltipConfig:', currentTutorialStep);
      setTutorialStep(null);
      return null;
    }

    const stepNumber = stepIndex + 1;
    const totalSteps = steps.length;

    switch (currentTutorialStep) {
      case 'welcome':
        return {
          title: 'Let\'s Learn Check-Ins! 📍',
          body: "We're going to teach you how to use check-ins to keep yourself safe.",
          buttonText: 'Let\'s Go',
          onNext: () => handleTutorialNext(),
          onSkip: handleSkipTutorial,
          position: 'below',
          stepNumber,
          totalSteps
        };
      case 'allButtons':
        return {
          title: 'Your Check-In Hub',
          body: "Check-ins are safety timers that alert your besties if you don't check back in on time. Perfect for dates, rideshares, walking alone, or any time you want someone watching your back. 💜",
          buttonText: 'Got It',
          onNext: () => handleTutorialNext(),
          position: 'below',
          stepNumber,
          totalSteps
        };
      case 'quickCheckIns':
        return {
          title: 'Quick Check-Ins',
          body: "Pick one and try it out! We'll guide you through it.",
          buttonText: null, // No button - user must click a quick check-in
          onNext: () => { }, // No-op - they must click a button
          position: 'below', // Show below buttons
          stepNumber,
          totalSteps
        };
      case 'afterQuickCheckIn':
        return {
          title: 'Great Job! 🎉',
          body: "You just created your first check-in! That's how easy it is to stay safe. Ready to see what else you can do?",
          buttonText: 'What\'s Next?',
          onNext: () => handleTutorialNext(),
          position: 'auto',
          stepNumber,
          totalSteps
        };
      case 'custom':
        return {
          title: 'Custom Check-In',
          body: "This is the custom check-in button! Use it when you need full control - set your own location, duration, notes, and more. Perfect for unique situations.",
          buttonText: null, // No button - user must click the custom button itself
          onNext: null,
          position: 'below',
          stepNumber,
          totalSteps
        };
      default:
        return null;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleTutorialBack = () => {
    const steps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    const currentIndex = steps.indexOf(currentTutorialStep);

    if (currentIndex > 0) {
      setTutorialStep(steps[currentIndex - 1]);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getStepNumber = () => {
    const steps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    const index = steps.indexOf(currentTutorialStep);
    return index >= 0 ? index + 1 : 1; // Default to 1 if step not found
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* Elegant spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-primary opacity-20 animate-pulse-slow"></div>
          </div>
          <p className="text-lg font-display text-gradient mb-2 animate-pulse-slow">
            Loading your safety network...
          </p>
          <p className="text-sm text-text-secondary">💜</p>
        </div>
      </div>
    );
  }

  // Calculate tutorial overlay visibility before return
  const validSteps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
  const isValidStep = currentTutorialStep && validSteps.includes(currentTutorialStep);
  const shouldShowTutorial = isValidStep && !tutorialComplete;
  // eslint-disable-next-line no-unused-vars
  const tooltipConfig = shouldShowTutorial ? getTooltipConfig() : null;

  return (
    <div className="min-h-screen bg-pattern">
      <OfflineBanner />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Active Alert Banner - Only thing that shows above check-in buttons */}
        <ActiveAlertBanner />

        {/* Circle Check-In Prompt - Hidden for MVP (circle check-ins removed from nav) */}
        {/* {activeCheckIns.length === 0 && <CircleCheckInPrompt />} */}

        {/* =================================================================
            ⚠️  AI PROTECTION: DO NOT EDIT THIS SECTION ⚠️
            Quick Check-In Section - Do not modify unless explicitly told by the user
            ================================================================= */}
        {/* Quick Check-In Buttons - Moved to middle */}
        {activeCheckIns.length === 0 && (
          <>
            <QuickCheckInButtons
              currentTutorialStep={currentTutorialStep}
              ref={quickCheckInButtonsRef}
              isTutorialMode={!!currentTutorialStep}
              onTutorialAction={handleTutorialAction}
              allowQuickCheckInClick={currentTutorialStep === 'quickCheckIns'}
              onTutorialModalComplete={handleTutorialModalComplete}
              onModalStateChange={setIsTutorialModalOpen}
              onCustomButtonClick={handleCustomButtonClick}
            />

            {/* Living Circle - DO NOT REMOVE */}
            <div ref={livingCircleRef} id="living-circle-origin">
              <LivingCircle
                userId={currentUser?.uid}
                shouldPlayTutorial={currentCheckInTutorialStep === 'sacredTransition' || currentCheckInTutorialStep === 'bestieCircle'}
                isModalOpen={isTutorialModalOpen}
                onTutorialComplete={() => {
                  // Clear the tutorial state completely
                  setCheckInTutorialStep(null);
                  toast.success("Welcome to your Bestie Circle! 💜", { icon: "✨" });
                }}
              />
            </div>

            {/* Weekly Summary */}
            <WeeklySummary
              weeklySummary={weeklySummary}
              hasWeekOfActivity={hasWeekOfActivity()}
              userData={userData}
              bestiesCount={besties.length}
            />

          </>
        )}

        {/* Alerted Bestie Check-Ins - URGENT! */}
        {alertedBestieCheckIns.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display text-text-primary">⚠️ Urgent Alerts</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                {alertedBestieCheckIns.length}
              </span>
            </div>
            {alertedBestieCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="card p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🚨</div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-red-900 dark:text-red-100 mb-2">
                      {checkIn.userName} Missed Check-In!
                    </h3>
                    <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                      <div><strong>Location:</strong> {checkIn.location || 'Unknown'}</div>
                      <div><strong>Expected back:</strong> {checkIn.alertTime?.toDate().toLocaleString()}</div>
                      {checkIn.notes && <div><strong>Notes:</strong> {checkIn.notes}</div>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {checkIn.phone && (
                        <a
                          href={`tel:${checkIn.phone}`}
                          onClick={() => logAlertResponse(checkIn.id, checkIn.userId, currentUser.uid)}
                          className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                        >
                          📞 Call Now
                        </a>
                      )}
                      <button
                        onClick={() => {
                          haptic.medium();
                          logAlertResponse(checkIn.id, checkIn.userId, currentUser.uid);
                          // Acknowledge - navigate to home (alert will clear when resolved)
                        }}
                        className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        ✅ Acknowledge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Check-Ins */}
        {activeCheckIns.length > 0 && (
          <>
            <div className="mb-6 space-y-4">
              <h2 className="text-xl font-display text-text-primary">Active Check-Ins</h2>
              {activeCheckIns.map((checkIn, index) => (
                <div key={checkIn.id} ref={index === 0 ? activeCheckInCardRef : null}>
                  <CheckInCard checkIn={checkIn} />
                </div>
              ))}
            </div>

            {/* Emergency SOS Button */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-300 dark:border-red-700">
              <h3 className="text-lg font-display text-red-900 dark:text-red-100 mb-2 text-center">
                Need help right now?
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4 text-center">
                Press SOS to instantly alert all your besties.
              </p>
              <div className="text-center">
                {sosTriggered ? (
                  <div className="inline-block px-6 py-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full font-bold text-lg">
                    ✅ Besties Alerted
                  </div>
                ) : (
                  <button
                    onClick={handleSOS}
                    disabled={sosLoading}
                    className="px-10 py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full font-bold text-xl shadow-lg transition-all disabled:opacity-60"
                  >
                    {sosLoading ? '...' : '🆘 SOS'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Templates - Hidden for now */}
        {/* {templates.length > 0 && activeCheckIns.length === 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4">Your Templates</h2>
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
            />
          </div>
        )} */}

        {/* You're Part of Something Special - Appreciation Card */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-100 dark:border-purple-700">
          <div className="text-center">
            <div className="text-4xl mb-3">💜</div>
            <h3 className="font-display text-2xl text-gradient mb-3">
              You're Part of Something Special
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Hey bestie! We just wanted to say—you being here means everything.
              Every check-in you create, every friend you add, every safe moment you share...
              you're part of a community that's got each other's backs.
              We're building this together, and we couldn't do it without amazing people like you.
              You're not just using an app—you're one of the besties. 💕
            </p>
          </div>
        </div>

        {/* Want to help us out? Section */}
        {!userData?.donationStats?.isActive && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-display text-gradient mb-2">
                Want to help us out? 💜
              </h2>
              <p className="text-text-secondary text-sm">
                Here are all the ways you can support Besties and keep safety accessible for everyone
              </p>
            </div>

            {/* Donation Card */}
            <DonationCard />

            {/* OR Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-text-secondary font-semibold">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Invite Friends Card */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-100 dark:border-blue-700">
              <div className="text-center">
                <div className="text-4xl mb-3">👯‍♀️</div>
                <h3 className="font-display text-2xl text-gradient mb-3">
                  Grow the Squad!
                </h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Love Besties? Invite your friends! The more people who join,
                  the stronger our safety network becomes. Plus, it helps us keep
                  the app free for everyone. Share the love! 💖
                </p>
                <button
                  onClick={() => {
                    haptic.light();
                    setShowInviteModal(true);
                  }}
                  className="btn btn-secondary w-full text-lg py-3"
                >
                  🎉 Invite Friends
                </button>
                <p className="text-xs text-text-secondary mt-3">
                  Every new friend makes Besties better for everyone!
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Emergency SOS Button - Removed per user request */}

      {/* Add to Home Screen Prompt - Disabled per user request */}
      {/* <AddToHomeScreenPrompt currentUser={currentUser} userData={userData} /> */}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}


      {/* Tutorial Overlay - NEW FLOW (Commented out for MVP - onboarding loop replaces this) */}
      {/* Hide HomePage tutorial when check-in tutorial is active */}
      {/* 
      {shouldShowTutorial && tooltipConfig && !isTutorialModalOpen && (currentCheckInTutorialStep === null || currentCheckInTutorialStep === undefined) && (
        <TutorialOverlay
          currentStep={currentTutorialStep}
          onStepComplete={handleTutorialNext}
          onTutorialComplete={handleSkipTutorial}
          onStepBack={handleTutorialBack}
          highlightedElementRef={getHighlightedElementRef()}
          tooltipConfig={tooltipConfig}
          stepNumber={getStepNumber()}
          totalSteps={5}
        />
      )}
      */}

      {/* Check-In Tutorial - checkedIn step (moved from CheckInCard for reliable rendering) */}
      {/*
      {currentCheckInTutorialStep === 'checkedIn' && !checkedInTooltipDismissed && (
        <CheckInTutorialOverlay
          currentStep="checkedIn"
          onStepComplete={(action) => {
            if (action === 'continue') {
              // Dismiss tooltip - user can now complete check-in
              // When check-in completes, afterSafe will show
              setCheckedInTooltipDismissed(true);
            }
          }}
          onSkipTutorial={() => {
            markCheckInTutorialComplete();
          }}
          highlightedElementRef={null}
          tooltipConfig={{
            icon: '✅',
            title: 'Your Active Check-In',
            body: \`Great job! Your check-in is now active.\\n\\nHere you can:\\n• Add notes about your situation\\n• Add photos for your besties\\n• Add more time if needed\\n\\nWhen you're safe, click the "I'm Safe" button. This lets your besties know you're okay! 💜\`,
            overlayOnElement: false,
            buttons: [
              { text: 'Got it!', action: 'continue', primary: true }
            ]
          }}
        />
      )}
      */}

      {/* Check-In Tutorial - afterSafe step */}
      {/*
      {currentCheckInTutorialStep === 'afterSafe' && (
        <>
          <CheckInTutorialOverlay
            currentStep="afterSafe"
            onStepComplete={(action) => {
              if (action === 'continueTutorial') {
                // User wants to continue tutorial - scroll to Bestie Circle
                const circleElement = document.getElementById('living-circle-origin');
                if (circleElement) {
                  // Position Living Circle at top of screen, cutting off buttons above
                  const headerHeight = 80; // Account for fixed header
                  const y = circleElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
                // Small delay to let scroll complete before starting tutorial
                setTimeout(() => {
                  setCheckInTutorialStep('sacredTransition');
                }, 800);
              } else if (action === 'skip') {
                // User wants to skip - clear ALL tutorial state
                clearAllTutorialState();
                markCheckInTutorialComplete();
                toast.success("You can replay tutorials anytime from Settings! 💜", {
                  duration: 4000,
                  icon: '✨'
                });
              }
            }}
            onSkipTutorial={() => {
              // User skipped - clear ALL tutorial state
              clearAllTutorialState();
              markCheckInTutorialComplete();
              toast.success("You can replay tutorials anytime from Settings! 💜", {
                duration: 4000,
                icon: '✨'
              });
            }}
            highlightedElementRef={null}
            tooltipConfig={{
              icon: '🎉',
              title: 'Amazing Work!',
              body: \`Congratulations! You've learned how to create a check-in and keep yourself safe.\\n\\nReady to learn about your Bestie Circle? It's where you build your safety network with the people you trust most.\`,
              overlayOnElement: false,
              dismissible: false,
              canDismiss: false,
              showSkipText: true,
              skipText: 'Skip tutorial',
              onSkipClick: () => {
                // User skipped - clear ALL tutorial state
                clearAllTutorialState();
                markCheckInTutorialComplete();
                toast.success("You can replay tutorials anytime from Settings! 💜", {
                  duration: 4000,
                  icon: '✨'
                });
              },
              buttons: [
                { text: 'Learn About Bestie Circle', action: 'continueTutorial', primary: true }
              ]
            }}
          />
        </>
      )}
      */}

      {/* Step 1: Bestie Circle Tutorial (NEW) - Moved to embedded LivingCircle */}

      {/* 60-Second Alarm Overlay */}
      {alarmActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-900/85 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl border-4 border-red-500">
            <div className="text-7xl mb-4" style={{ animation: 'pulse 0.6s ease-in-out infinite' }}>🚨</div>
            <h2 className="text-2xl font-display text-red-700 dark:text-red-400 mb-2">Check-In Expired!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Your timer has run out. Your besties are being alerted right now.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">If you're safe, mark yourself safe on your check-in card.</p>
            <button
              onClick={stopAlarm}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg mb-3 transition-colors"
            >
              Stop Alarm
            </button>
            <p className="text-xs text-gray-400">Alarm stops automatically after 60 seconds</p>
          </div>
        </div>
      )}

      {/* Tutorial Debug Panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 z-50">
          <details className="bg-gray-900 text-white p-2 rounded text-xs">
            <summary className="cursor-pointer">Debug</summary>
            <div className="mt-2 space-y-1">
              <div>Tutorial: {currentTutorialStep || 'none'}</div>
              <div>CheckIn Tutorial: {currentCheckInTutorialStep || 'none'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default HomePage;
