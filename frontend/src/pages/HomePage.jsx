import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, limit } from 'firebase/firestore';
import CheckInCard from '../components/CheckInCard';
import QuickCheckInButtons from '../components/QuickCheckInButtons';
import RideshareModal from '../components/checkin/RideshareModal';
import WalkingModal from '../components/checkin/WalkingModal';
import QuickMeetModal from '../components/checkin/QuickMeetModal';
import LivingCircle from '../components/LivingCircle';
import DonationCard from '../components/DonationCard';
import WeeklySummary from '../components/profile/WeeklySummary';
// EmergencySOSButton removed per user request
import OfflineBanner from '../components/OfflineBanner';
import InviteFriendsModal from '../components/InviteFriendsModal';
import InfoButton from '../components/InfoButton';
import ActiveAlertBanner from '../components/alerts/ActiveAlertBanner';
import AddBestieCard from '../components/AddBestieCard';
import TutorialPromptCard from '../components/TutorialPromptCard';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
import TutorialOverlay from '../components/TutorialOverlay';
import { useTutorialState } from '../hooks/useTutorialState';
// FloatingNotificationBell removed per user request
import { logAlertResponse } from '../services/interactionTracking';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Friends modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  

  // Tutorial state - NEW FLOW: welcome, allButtons, quickCheckIns, afterQuickCheckIn, custom
  const { tutorialComplete, currentTutorialStep, markTutorialComplete, setTutorialStep, resetTutorial } = useTutorialState();
  const { checkInTutorialComplete } = useCheckInTutorialState();
  const quickCheckInButtonsRef = useRef(null);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [tutorialFormStep, setTutorialFormStep] = useState(null);
  const [previousCheckInCount, setPreviousCheckInCount] = useState(0);

  // Validate tutorial state and clean up invalid states
  useEffect(() => {
    const validSteps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    
    // If tutorial is marked complete but has a step, clear the step
    if (tutorialComplete && currentTutorialStep) {
      setTutorialStep(null);
      return;
    }
    
    // If we have an invalid step, reset to null
    if (currentTutorialStep && !validSteps.includes(currentTutorialStep)) {
      console.warn('Invalid tutorial step detected:', currentTutorialStep, '- resetting');
      setTutorialStep(null);
      return;
    }
  }, [currentTutorialStep, tutorialComplete, setTutorialStep]);

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
  useEffect(() => {
    if (authLoading) return;
    if (!userData) return;
    
    // Check if onboarding was just completed (user has completed onboarding but tutorial not started)
    if (userData.onboardingCompleted && !tutorialComplete && !currentTutorialStep) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        setTutorialStep('welcome');
      }, 300);
    }
  }, [userData, authLoading, tutorialComplete, currentTutorialStep, setTutorialStep]);

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
        
        // Detect check-in creation during tutorial
        if (currentTutorialStep === 'quickCheckIns' && checkIns.length > previousCheckInCount) {
          // Check-in was just created - advance tutorial
          setTimeout(() => {
            setTutorialStep('afterQuickCheckIn');
          }, 1000); // Small delay to let user see their check-in
        }
        
        setPreviousCheckInCount(checkIns.length);
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
      where('bestieUserIds', 'array-contains', currentUser.uid),
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
  }, [currentUser, currentTutorialStep, previousCheckInCount, setTutorialStep]);

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

  // Real-time bestie detection - check both stats and actual besties collection
  const [hasAnyBestie, setHasAnyBestie] = useState((userData?.stats?.totalBesties || 0) > 0);
  
  useEffect(() => {
    if (!currentUser?.uid) {
      setHasAnyBestie(false);
      return;
    }

    // First check stats (fast, updated via real-time listener in AuthContext)
    const statsBesties = (userData?.stats?.totalBesties || 0) > 0;
    if (statsBesties) {
      setHasAnyBestie(true);
    }

    // Also set up real-time listener on besties collection for immediate updates
    // This catches besties even if stats haven't updated yet
    const bestiesQuery1 = query(
      collection(db, 'besties'),
      where('requesterId', '==', currentUser.uid),
      where('status', '==', 'accepted'),
      limit(1)
    );
    const bestiesQuery2 = query(
      collection(db, 'besties'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'accepted'),
      limit(1)
    );

    const unsubscribe1 = onSnapshot(bestiesQuery1, (snapshot) => {
      const hasBesties = snapshot.size > 0 || statsBesties;
      setHasAnyBestie(hasBesties);
    }, (error) => {
      console.error('Error in besties listener:', error);
      setHasAnyBestie(statsBesties);
    });

    const unsubscribe2 = onSnapshot(bestiesQuery2, (snapshot) => {
      const hasBesties = snapshot.size > 0 || statsBesties;
      setHasAnyBestie(hasBesties);
    }, (error) => {
      console.error('Error in besties listener:', error);
      setHasAnyBestie(statsBesties);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser?.uid, userData?.stats?.totalBesties]);

  const hasCompletedFirstCheckIn = (userData?.stats?.completedCheckIns || 0) > 0;

  // Tutorial handlers - NEW FLOW
  const handleStartTutorial = () => {
    // First, reset any existing tutorial state to ensure clean start
    resetTutorial();
    setPreviousCheckInCount(activeCheckIns.length); // Track current count
    
    // Small delay to ensure state is cleared, then set to welcome
    setTimeout(() => {
      setTutorialStep('welcome');
    }, 50);
  };
  
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

  const handleTutorialStepComplete = () => {
    // This is now handled by handleTutorialNext
    handleTutorialNext();
  };

  const handleTutorialAction = (action) => {
    // This function is no longer needed in the new flow
    // Buttons handle their own clicks now
    haptic.light();
  };

  const handleTutorialFormClose = () => {
    setTutorialModalOpen(false);
    setTutorialFormStep(null);
    // Advance tutorial to next step when modal closes
    handleTutorialStepComplete();
  };

  // Get highlighted element ref based on current step - NEW FLOW
  const getHighlightedElementRef = () => {
    // Always return consistent structure: { current: element | null }
    if (!quickCheckInButtonsRef.current) {
      return { current: null };
    }
    
    try {
      let element = null;
      switch (currentTutorialStep) {
        case 'welcome':
          // Highlight container so tooltip can be positioned below it
          element = quickCheckInButtonsRef.current.containerRef || null;
          break;
        case 'allButtons':
          // Highlight entire container
          element = quickCheckInButtonsRef.current.containerRef || null;
          break;
        case 'quickCheckIns':
          // Highlight container (all 3 quick buttons will be highlighted via CSS)
          element = quickCheckInButtonsRef.current.containerRef || null;
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
          title: 'Welcome to Besties! 🛡️',
          body: "Let's show you around! This is where you'll create check-ins to keep yourself safe. Ready to learn?",
          buttonText: 'Show Me Around',
          onNext: () => handleTutorialNext(),
          onSkip: handleSkipTutorial,
          position: 'below',
          stepNumber,
          totalSteps
        };
      case 'allButtons':
        return {
          title: 'Your Check-In Hub',
          body: "This is where you create check-ins, and what check-ins do.",
          buttonText: 'Got It',
          onNext: () => handleTutorialNext(),
          position: 'below',
          stepNumber,
          totalSteps
        };
      case 'quickCheckIns':
        return {
          title: 'Quick Check-Ins',
          body: "Pick one and try it out! We'll see you back here when you're done.",
          buttonText: null, // No button - user must click a quick check-in
          onNext: () => {
            // Don't advance - wait for them to click a button
            // This step stays active until they click
          },
          position: 'auto',
          stepNumber,
          totalSteps
        };
      case 'afterQuickCheckIn':
        return {
          title: 'Great Job! 🎉',
          body: "You just created your first check-in! Now let's learn about the custom check-in option. It gives you full control over all the details.",
          buttonText: 'Show Me Custom',
          onNext: () => handleTutorialNext(),
          position: 'auto',
          stepNumber,
          totalSteps
        };
      case 'custom':
        return {
          title: 'Custom Check-In',
          body: "This is the custom check-in button! Use it when you need full control - set your own location, duration, notes, and more. Perfect for unique situations.",
          buttonText: 'Got It',
          onNext: () => {
            markTutorialComplete();
            toast.success("You're all set! Your besties are ready to keep you safe. 💜", {
              duration: 4000,
              icon: '🎉'
            });
          },
          position: 'auto',
          stepNumber,
          totalSteps
        };
      default:
        return null;
    }
  };

  const handleTutorialBack = () => {
    const steps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom'];
    const currentIndex = steps.indexOf(currentTutorialStep);
    
    if (currentIndex > 0) {
      setTutorialStep(steps[currentIndex - 1]);
    }
  };

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
  const shouldShowTutorial = isValidStep && !tutorialComplete && !tutorialModalOpen;
  const tooltipConfig = shouldShowTutorial ? getTooltipConfig() : null;

  return (
    <div className="min-h-screen bg-pattern">
      <OfflineBanner />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* =================================================================
            ⚠️  AI PROTECTION: DO NOT EDIT THIS SECTION ⚠️
            Safety Stats Section - Do not modify unless explicitly told by the user
            ================================================================= */}
        {/* Stats Card / Add Bestie Card / Tutorial Prompt Card */}
        {activeCheckIns.length === 0 && (
          <>
            {/* Show "Create First Check-In" card when user has no besties and hasn't completed check-in tutorial */}
            {!hasAnyBestie && !checkInTutorialComplete && (
              <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50 animate-fade-in">
                <div className="text-center">
                  <div className="text-5xl mb-4">🛡️</div>
                  <h3 className="font-display text-2xl text-text-primary mb-3">
                    Learn How to Check In
                  </h3>
                  <p className="text-text-secondary mb-4 leading-relaxed">
                    Let's walk you through creating your first check-in! You'll practice with a demo bestie, then add real besties afterward.
                  </p>
                  
                  {/* Green highlight box */}
                  <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                      🎓 Practice Mode
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      We'll guide you step-by-step with a demo bestie. No real alerts will be sent!
                    </p>
                  </div>
                  
                  {/* Blue highlight box */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-6">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      ⏱️ Takes about 2 minutes. You'll learn everything you need to know!
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      haptic.light();
                      navigate('/create-check-in');
                    }}
                    className="btn btn-primary text-lg py-3 px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Start Tutorial →
                  </button>
                </div>
              </div>
            )}
            
            {/* Show Add Bestie Card when user has no besties but has completed check-in tutorial */}
            {!hasAnyBestie && checkInTutorialComplete && (
              <AddBestieCard 
                onBestieAdded={() => {
                  // BestieCelebrationModal will play automatically via App.jsx
                  // The card will automatically hide when userData updates via real-time listener
                  toast.success('Bestie added! 💜');
                }} 
              />
            )}

            {/* Show Tutorial Prompt Card when user has besties but hasn't completed tutorial */}
            {hasAnyBestie && !tutorialComplete && !hasCompletedFirstCheckIn && (
              <TutorialPromptCard
                onStartTutorial={handleStartTutorial}
                onSkip={handleSkipTutorial}
              />
            )}

            {/* Show Stats Card when user has besties and has completed first check-in */}
            {hasAnyBestie && hasCompletedFirstCheckIn && (
              <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50 animate-fade-in">
                <div className="mb-4 flex items-center">
                  <h3 className="font-display text-lg text-text-primary">Your Safety Stats</h3>
                  <InfoButton message="Track your safety journey! These stats show your completed check-ins, bestie connections, and streaks. Keep building those safety habits! 💜" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-display text-primary">
                      {userData?.stats?.completedCheckIns || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display text-secondary">
                      {userData?.stats?.totalBesties || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Besties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display text-orange-500">
                      {userData?.stats?.currentStreak || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display text-accent">
                      {userData?.stats?.longestStreak || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Longest Streak</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Active Alert Banner */}
        <ActiveAlertBanner />

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
              isTutorialMode={!!currentTutorialStep && !tutorialModalOpen}
              onTutorialAction={handleTutorialAction}
              allowQuickCheckInClick={currentTutorialStep === 'quickCheckIns'}
            />

            {/* Tutorial Modals */}
            {tutorialModalOpen && tutorialFormStep === 'rideshare' && (
              <RideshareModal 
                onClose={handleTutorialFormClose}
                isTutorialMode={true}
              />
            )}
            {tutorialModalOpen && tutorialFormStep === 'walking' && (
              <WalkingModal 
                onClose={handleTutorialFormClose}
                isTutorialMode={true}
              />
            )}
            {tutorialModalOpen && tutorialFormStep === 'quickmeet' && (
              <QuickMeetModal 
                onClose={handleTutorialFormClose}
                isTutorialMode={true}
              />
            )}

            {/* Living Circle - DO NOT REMOVE */}
            <LivingCircle userId={currentUser?.uid} />

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
                      <button
                        onClick={() => {
                          haptic.medium();
                          navigate(`/user/${checkIn.userId}`);
                          // Log alert response when profile is viewed
                          logAlertResponse(checkIn.id, checkIn.userId, currentUser.uid);
                        }}
                        className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        👤 View Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/history/${checkIn.id}`);
                          // Log alert response when details are viewed
                          logAlertResponse(checkIn.id, checkIn.userId, currentUser.uid);
                        }}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        View Details →
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
              {activeCheckIns.map((checkIn) => (
                <CheckInCard key={checkIn.id} checkIn={checkIn} />
              ))}
            </div>

            {/* Get Me Out Button - Coming Soon */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-700 opacity-75">
              <h3 className="text-lg font-display text-orange-900 dark:text-orange-100 mb-2 text-center">
                🆘 Need an Exit Strategy?
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3 text-center">
                Feeling uncomfortable? We're working on a way to help you get out safely.
              </p>
              <div className="text-center">
                <span className="inline-block px-4 py-2 bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 rounded-full text-sm font-semibold">
                  ✨ Coming Soon
                </span>
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
            <p className="text-sm text-primary font-semibold">
              Keep slaying safely, queen! 👑✨
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


      {/* Tutorial Overlay - NEW FLOW */}
      {shouldShowTutorial && tooltipConfig && (
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
    </div>
  );
};

export default HomePage;
