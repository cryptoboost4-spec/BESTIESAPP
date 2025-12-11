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
import EmergencySOSButton from '../components/EmergencySOSButton';
import OfflineBanner from '../components/OfflineBanner';
import InviteFriendsModal from '../components/InviteFriendsModal';
import InfoButton from '../components/InfoButton';
import ActiveAlertBanner from '../components/alerts/ActiveAlertBanner';
import TestCheckInWalkthrough from '../components/TestCheckInWalkthrough';
import AddBestieCard from '../components/AddBestieCard';
import TutorialPromptCard from '../components/TutorialPromptCard';
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
  
  // Test Check-In Walkthrough state
  const [showTestWalkthrough, setShowTestWalkthrough] = useState(false);
  const [hasSeenTestWalkthrough, setHasSeenTestWalkthrough] = useState(false);

  // Tutorial state
  const { tutorialComplete, currentTutorialStep, markTutorialComplete, setTutorialStep } = useTutorialState();
  const quickCheckInButtonsRef = useRef(null);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [tutorialFormStep, setTutorialFormStep] = useState(null);

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

  // Redirect to login if there's a pending invite and user is not logged in
  useEffect(() => {
    if (authLoading) return;

    const pendingInvite = sessionStorage.getItem('pending_invite') || localStorage.getItem('pending_invite');
    if (pendingInvite && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  // Show test walkthrough for first-time users with besties but no check-ins
  useEffect(() => {
    if (authLoading || !userData || !currentUser) return;
    
    // Check if user has seen the walkthrough
    const seen = localStorage.getItem('test_checkin_walkthrough_seen');
    if (seen) {
      setHasSeenTestWalkthrough(true);
      return;
    }

    // Show if user has besties but no completed check-ins
    const hasBesties = userData?.stats?.totalBesties > 0;
    const hasNoCheckIns = !userData?.stats?.completedCheckIns || userData?.stats?.completedCheckIns === 0;
    
    if (hasBesties && hasNoCheckIns && !hasSeenTestWalkthrough) {
      // Delay to let user see the page first - don't be too aggressive
      const timer = setTimeout(() => {
        setShowTestWalkthrough(true);
      }, 3000); // 3 seconds - gives user time to see the page
      return () => clearTimeout(timer);
    }
  }, [userData, currentUser, authLoading, hasSeenTestWalkthrough]);

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
  }, [currentUser]);

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

  // Derived state for tutorial visibility
  const hasAnyBestie = (userData?.stats?.totalBesties || 0) > 0;
  const hasCompletedFirstCheckIn = (userData?.stats?.completedCheckIns || 0) > 0;

  // Tutorial handlers
  const handleStartTutorial = () => {
    setTutorialStep('rideshare');
  };

  const handleSkipTutorial = () => {
    markTutorialComplete();
  };

  const handleTutorialStepComplete = () => {
    const steps = ['rideshare', 'walking', 'quickmeet', 'custom'];
    const currentIndex = steps.indexOf(currentTutorialStep);
    
    if (currentIndex < steps.length - 1) {
      setTutorialStep(steps[currentIndex + 1]);
    } else {
      markTutorialComplete();
      toast.success("You're all set! Your besties are ready to keep you safe. 💜");
    }
  };

  const handleTutorialAction = (action) => {
    if (action === 'rideshare') {
      // Open rideshare modal in tutorial mode
      const buttonsRef = quickCheckInButtonsRef.current;
      if (buttonsRef) {
        // Trigger the modal to open
        setTutorialModalOpen(true);
        setTutorialFormStep('rideshare');
      }
    } else if (action === 'walking') {
      setTutorialModalOpen(true);
      setTutorialFormStep('walking');
    } else if (action === 'quickmeet') {
      setTutorialModalOpen(true);
      setTutorialFormStep('quickmeet');
    } else if (action === 'custom') {
      // Step 4 - allow real check-in creation
      markTutorialComplete();
      navigate('/create');
    }
  };

  const handleTutorialFormClose = () => {
    setTutorialModalOpen(false);
    setTutorialFormStep(null);
    handleTutorialStepComplete();
  };

  // Get highlighted element ref based on current step
  const getHighlightedElementRef = () => {
    if (!quickCheckInButtonsRef.current) return null;
    
    switch (currentTutorialStep) {
      case 'rideshare':
        return { current: quickCheckInButtonsRef.current.rideshareButton };
      case 'walking':
        return { current: quickCheckInButtonsRef.current.walkingButton };
      case 'quickmeet':
        return { current: quickCheckInButtonsRef.current.quickMeetButton };
      case 'custom':
        return { current: quickCheckInButtonsRef.current.customButton };
      default:
        return null;
    }
  };

  // Get tooltip config based on current step
  const getTooltipConfig = () => {
    switch (currentTutorialStep) {
      case 'rideshare':
        return {
          title: 'Rideshare Check-Ins',
          body: "Use these when getting a ride from Uber, Lyft, or a friend. Share the license plate and arrival time - your bestie will be notified if you don't check in safe.",
          buttonText: 'Next',
          onNext: () => handleTutorialAction('rideshare')
        };
      case 'walking':
        return {
          title: 'Walking Check-Ins',
          body: "Perfect for walks, runs, or anytime you're out on foot. Set how long you'll be gone.",
          buttonText: 'Next',
          onNext: () => handleTutorialAction('walking')
        };
      case 'quickmeet':
        return {
          title: 'Quick Meet Check-Ins',
          body: "Meeting someone new or at a specific location? Share your location so your bestie knows where you are. Great for first dates!",
          buttonText: 'Next',
          onNext: () => handleTutorialAction('quickmeet')
        };
      case 'custom':
        return {
          title: 'Custom Check-Ins',
          body: "Create your own check-in for any situation! You're all set - ready to create your first real check-in? 💜",
          buttonText: 'Create My First Check-In',
          onNext: () => handleTutorialAction('custom')
        };
      default:
        return null;
    }
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
            {/* Show Add Bestie Card when user has no besties */}
            {!hasAnyBestie && (
              <AddBestieCard onBestieAdded={() => {
                // BestieCelebrationModal will play automatically
                toast.success('Bestie added! 💜');
              }} />
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
              ref={quickCheckInButtonsRef}
              isTutorialMode={!!currentTutorialStep && !tutorialModalOpen}
              onTutorialAction={handleTutorialAction}
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

      {/* Emergency SOS Button */}
      <EmergencySOSButton hasActiveAlert={activeCheckIns.some(checkIn => checkIn.status === 'alerted')} />

      {/* Add to Home Screen Prompt - Disabled per user request */}
      {/* <AddToHomeScreenPrompt currentUser={currentUser} userData={userData} /> */}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}

      {/* Test Check-In Walkthrough */}
      {showTestWalkthrough && (
        <TestCheckInWalkthrough
          onComplete={() => {
            localStorage.setItem('test_checkin_walkthrough_seen', 'true');
            setHasSeenTestWalkthrough(true);
            setShowTestWalkthrough(false);
            toast.success('Great job! You\'re ready to create real check-ins now! 💜');
          }}
          onSkip={() => {
            localStorage.setItem('test_checkin_walkthrough_seen', 'true');
            setHasSeenTestWalkthrough(true);
            setShowTestWalkthrough(false);
          }}
        />
      )}

      {/* Tutorial Overlay - Only show when modal is not open */}
      {currentTutorialStep && !tutorialModalOpen && (
        <TutorialOverlay
          currentStep={currentTutorialStep}
          onStepComplete={handleTutorialStepComplete}
          onTutorialComplete={handleSkipTutorial}
          highlightedElementRef={getHighlightedElementRef()}
          tooltipConfig={getTooltipConfig()}
        />
      )}
    </div>
  );
};

export default HomePage;
