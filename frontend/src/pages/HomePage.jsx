import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import CheckInCard from '../components/CheckInCard';
import QuickCheckInButtons from '../components/QuickCheckInButtons';
import LivingCircle from '../components/LivingCircle';
import DonationCard from '../components/DonationCard';
import WeeklySummary from '../components/profile/WeeklySummary';
import EmergencySOSButton from '../components/EmergencySOSButton';
import AddToHomeScreenPrompt from '../components/AddToHomeScreenPrompt';
import GetMeOutButton from '../components/GetMeOutButton';
import OfflineBanner from '../components/OfflineBanner';
import InviteFriendsModal from '../components/InviteFriendsModal';
import InfoButton from '../components/InfoButton';
// FloatingNotificationBell removed per user request
import { logAlertResponse } from '../services/interactionTracking';

const HomePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Friends modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Besties state for weekly summary
  const [besties, setBesties] = useState([]);

  // Alerted check-ins from besties (where current user is a selected bestie)
  const [alertedBestieCheckIns, setAlertedBestieCheckIns] = useState([]);

  // Analytics stats
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

  useEffect(() => {
    if (!currentUser) return;

    // Listen to active check-ins from current user
    const checkInsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['active', 'alerted'])
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
        setActiveCheckIns([]);
        setLoading(false);
      }
    );

    // ALSO listen to alerted check-ins where current user is a selected bestie
    const alertedBestieQuery = query(
      collection(db, 'checkins'),
      where('bestieIds', 'array-contains', currentUser.uid),
      where('status', '==', 'alerted')
    );

    const unsubscribeAlerted = onSnapshot(
      alertedBestieQuery,
      async (snapshot) => {
        const alertedCheckIns = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          // Get the user's name who created the check-in
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          const userName = userDoc.exists() ? userDoc.data().displayName : 'Bestie';

          alertedCheckIns.push({
            id: docSnap.id,
            ...data,
            userName
          });
        }
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
        const emergencyQuery = query(
          collection(db, 'checkins'),
          where('bestieIds', 'array-contains', currentUser.uid)
        );
        const emergencySnapshot = await getDocs(emergencyQuery);
        setEmergencyContactCount(emergencySnapshot.size);

        // Calculate days active
        const firstCheckIn = userData?.stats?.firstCheckInDate?.toDate?.() || userData?.stats?.firstCheckInDate;
        if (firstCheckIn) {
          const now = new Date();
          const diffTime = Math.abs(now - firstCheckIn);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

      } catch (error) {
        console.error('Error loading analytics:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
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
        {/* Stats Card - Moved above Quick Check-In */}
        {activeCheckIns.length === 0 && (
          <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50">
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

        {/* =================================================================
            ⚠️  AI PROTECTION: DO NOT EDIT THIS SECTION ⚠️
            Quick Check-In Section - Do not modify unless explicitly told by the user
            ================================================================= */}
        {/* Quick Check-In Buttons - Moved to middle */}
        {activeCheckIns.length === 0 && (
          <>
            <QuickCheckInButtons />

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

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreenPrompt currentUser={currentUser} userData={userData} />

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
};

export default HomePage;
