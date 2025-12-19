import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import SocialShareCardsModal from '../components/SocialShareCardsModal';
import ConfettiCelebration from '../components/ConfettiCelebration';
import ProfileCard from '../components/profile/ProfileCard';
import ProfileCompletion from '../components/profile/ProfileCompletion';
import LoginStreak from '../components/profile/LoginStreak';
// import BestieCircleStatus from '../components/BestieCircleStatus'; // Removed from Profile Page per user request
import BadgesSection from '../components/profile/BadgesSection';
import StatsSection from '../components/profile/StatsSection';
import DonationStatus from '../components/profile/DonationStatus';
import ProfileAuraStyles from '../components/profile/ProfileAuraStyles';
import RequestSupportSection from '../components/RequestSupportSection';
import OfflineBanner from '../components/OfflineBanner';
import { useSimpleTutorial } from '../hooks/useSimpleTutorial';
import ProfileTutorialOverlay from '../components/tutorials/profile/ProfileTutorialOverlay';
import { clearAllTutorialState } from '../utils/tutorialHelpers';

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [featuredBadgeIds, setFeaturedBadgeIds] = useState([]);
  const [bestiesCount, setBestiesCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [emergencyContactCount, setEmergencyContactCount] = useState(0);
  const [firstCheckInDate, setFirstCheckInDate] = useState(null);
  const [nighttimeCheckIns, setNighttimeCheckIns] = useState(0);
  const [weekendCheckIns, setWeekendCheckIns] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [alertedBestieCheckIns, setAlertedBestieCheckIns] = useState([]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  // New relationship stats
  const [messagesExchangedThisWeek, setMessagesExchangedThisWeek] = useState(0);
  const [supportActionsThisMonth, setSupportActionsThisMonth] = useState(0);
  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const [activePacts, setActivePacts] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [strongestConnection, setStrongestConnection] = useState(null);

  // Simple tutorial state - just tracks if tutorial has been shown
  const { showTutorial, completeTutorial } = useSimpleTutorial('profile');
  
  // Log tutorial state for debugging
  useEffect(() => {
    console.log('[Profile Tutorial] State:', { showTutorial });
  }, [showTutorial]);

  // Refs for highlighted elements
  const profileCardRef = useRef(null);
  const customizerButtonRef = useRef(null);
  const profileCompletionRef = useRef(null);
  const badgesSectionRef = useRef(null);
  const statsSectionRef = useRef(null);
  const settingsButtonRef = useRef(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Listen for alerted check-ins where current user is a selected bestie
  useEffect(() => {
    if (!currentUser) return;

    const alertedBestieQuery = query(
      collection(db, 'checkins'),
      where('bestieIds', 'array-contains', currentUser.uid),
      where('status', '==', 'alerted'),
      limit(20) // Reasonable limit for alerted check-ins
    );

    const unsubscribe = onSnapshot(
      alertedBestieQuery,
      async (snapshot) => {
        const alertedCheckIns = [];

        // Batch fetch all user documents at once to avoid N+1 queries
        const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
        const userDocPromises = userIds.map(id => getDoc(doc(db, 'users', id)));
        const userDocs = await Promise.all(userDocPromises);
        const userDataMap = new Map();
        userDocs.forEach((userDoc, idx) => {
          if (userDoc.exists()) {
            userDataMap.set(userIds[idx], userDoc.data());
          }
        });

        // Use the map for lookups
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const userName = userDataMap.get(data.userId)?.displayName || 'Bestie';

          alertedCheckIns.push({
            id: docSnap.id,
            ...data,
            userName
          });
        }
        setAlertedBestieCheckIns(alertedCheckIns);
      },
      (error) => {
        // Use error tracking instead of console.error
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading alerted check-ins:', error);
        }
        setAlertedBestieCheckIns([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Animate progress bar when profile completion changes
  useEffect(() => {
    const profileCompletion = calculateProfileCompletion();
    const targetProgress = profileCompletion.percentage;
    setAnimatedProgress(targetProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, bestiesCount, currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      // Load badges
      const badgesDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgesDoc.exists()) {
        const badgesData = badgesDoc.data().badges || [];
        setBadges(badgesData);
      }

      // Load featured badge preferences
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFeaturedBadgeIds(data.featuredBadges || []);
      }

      // Load besties count
      const bestiesQuery = query(
        collection(db, 'besties'),
        where('requesterId', '==', currentUser.uid),
        where('status', '==', 'accepted'),
        limit(100) // Reasonable limit for besties count
      );
      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'accepted'),
        limit(100) // Reasonable limit for besties count
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(bestiesQuery),
        getDocs(bestiesQuery2)
      ]);

      setBestiesCount(snapshot1.size + snapshot2.size);

      // Count how many times user is an emergency contact
      // Use bestieUserIds for consistency with security rules and other queries
      const emergencyContactQuery = query(
        collection(db, 'checkins'),
        where('bestieUserIds', 'array-contains', currentUser.uid),
        limit(1000) // Reasonable limit for analytics count
      );
      const emergencySnapshot = await getDocs(emergencyContactQuery);
      setEmergencyContactCount(emergencySnapshot.size);

      // Get first check-in date from stats (set by trigger) or calculate from check-ins
      const firstCheckInFromStats = userData?.stats?.firstCheckInDate?.toDate?.() || userData?.stats?.firstCheckInDate;
      if (firstCheckInFromStats) {
        setFirstCheckInDate(firstCheckInFromStats);
      }

      // Calculate nighttime and weekend check-ins
      const checkInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid),
        limit(50) // Reasonable limit for recent check-ins analysis
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      if (!checkInsSnapshot.empty) {
        let earliestDate = firstCheckInFromStats || null;
        let nightCount = 0;
        let weekendCount = 0;

        checkInsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          const date = data.createdAt?.toDate();

          if (date) {
            // Only update earliestDate if we don't have it from stats
            if (!firstCheckInFromStats && (!earliestDate || date < earliestDate)) {
              earliestDate = date;
            }

            const hour = date.getHours();
            if (hour >= 21 || hour < 6) {
              nightCount++;
            }

            const day = date.getDay();
            if (day === 0 || day === 6) {
              weekendCount++;
            }
          }
        });

        // Only set if we calculated it (not from stats)
        if (!firstCheckInFromStats && earliestDate) {
          setFirstCheckInDate(earliestDate);
        }
        setNighttimeCheckIns(nightCount);
        setWeekendCheckIns(weekendCount);
      }

      // Load relationship stats
      await loadRelationshipStats();

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadRelationshipStats = async () => {
    if (!currentUser) return;

    try {
      const now = new Date();
      
      // Calculate start of this week (Monday)
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekTimestamp = Timestamp.fromDate(startOfWeek);

      // Calculate start of this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

      // Load messages this week (sent or received)
      const messagesQuery = query(
        collection(db, 'bestie_messages'),
        where('sentAt', '>=', startOfWeekTimestamp),
        limit(1000)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesThisWeek = messagesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.senderId === currentUser.uid || data.recipientId === currentUser.uid;
      }).length;
      setMessagesExchangedThisWeek(messagesThisWeek);

      // Load support actions this month
      const supportActionsQuery = query(
        collection(db, 'support_actions'),
        where('actorId', '==', currentUser.uid),
        where('timestamp', '>=', startOfMonthTimestamp),
        limit(1000)
      );
      const supportActionsSnapshot = await getDocs(supportActionsQuery);
      setSupportActionsThisMonth(supportActionsSnapshot.size);

      // Load completed challenges
      const challengesQuery1 = query(
        collection(db, 'bestie_challenges'),
        where('user1Id', '==', currentUser.uid),
        where('status', '==', 'completed'),
        limit(100)
      );
      const challengesQuery2 = query(
        collection(db, 'bestie_challenges'),
        where('user2Id', '==', currentUser.uid),
        where('status', '==', 'completed'),
        limit(100)
      );
      const [challenges1, challenges2] = await Promise.all([
        getDocs(challengesQuery1),
        getDocs(challengesQuery2)
      ]);
      setChallengesCompleted(challenges1.size + challenges2.size);

      // Load active pacts
      const pactsQuery1 = query(
        collection(db, 'safety_pacts'),
        where('user1Id', '==', currentUser.uid),
        where('status', '==', 'active'),
        limit(100)
      );
      const pactsQuery2 = query(
        collection(db, 'safety_pacts'),
        where('user2Id', '==', currentUser.uid),
        where('status', '==', 'active'),
        limit(100)
      );
      const [pacts1, pacts2] = await Promise.all([
        getDocs(pactsQuery1),
        getDocs(pactsQuery2)
      ]);
      setActivePacts(pacts1.size + pacts2.size);

      // Load average response time from alert_responses
      const alertResponsesQuery = query(
        collection(db, 'alert_responses'),
        where('responderId', '==', currentUser.uid),
        limit(100)
      );
      const alertResponsesSnapshot = await getDocs(alertResponsesQuery);
      if (!alertResponsesSnapshot.empty) {
        let totalResponseTime = 0;
        let count = 0;
        alertResponsesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.responseTime) {
            totalResponseTime += data.responseTime;
            count++;
          }
        });
        if (count > 0) {
          setAvgResponseTime(totalResponseTime / count);
        }
      }

      // Load strongest connection from user stats (cached) or calculate
      const strongestConn = userData?.stats?.strongestConnection;
      if (strongestConn) {
        // Get bestie name and photo
        const bestieDoc = await getDoc(doc(db, 'users', strongestConn.bestieId));
        if (bestieDoc.exists()) {
          const bestieData = bestieDoc.data();
          setStrongestConnection({
            bestieId: strongestConn.bestieId,
            bestieName: strongestConn.bestieName || bestieData.displayName || 'Bestie',
            photoURL: bestieData.photoURL || null,
            score: strongestConn.score
          });
        }
      }
    } catch (error) {
      console.error('Error loading relationship stats:', error);
      // Don't fail if stats can't be loaded
    }
  };

  const calculateProfileCompletion = () => {
    const tasks = [];
    let completed = 0;

    // PAGE 1: EASY TASKS - Basic Profile Setup (5 tasks)

    // 1. Name
    if (userData?.displayName && userData?.displayName !== 'Anonymous') {
      tasks.push({ name: 'Add your name', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add your name', completed: false, path: '/edit-profile', section: 'display-name' });
    }

    // 2. Profile Photo
    if (userData?.photoURL) {
      tasks.push({ name: 'Upload profile photo', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Upload profile photo', completed: false, path: null, section: 'photo', action: 'scrollToPhoto' });
    }

    // 3. Bio
    if (userData?.profile?.bio) {
      tasks.push({ name: 'Write a bio', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Write a bio', completed: false, path: '/edit-profile', section: 'bio' });
    }

    // 4. Birthday
    if (userData?.profile?.birthdate && userData.profile.birthdate.trim() !== '') {
      tasks.push({ name: 'Add birthday', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add birthday', completed: false, path: '/edit-profile', section: 'birthday' });
    }

    // 5. Phone Number
    if (userData?.phoneNumber) {
      tasks.push({ name: 'Add phone number', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add phone number', completed: false, path: '/edit-profile', section: 'phone' });
    }

    // PAGE 2: HARDER TASKS - Advanced Features (5 tasks)

    // 6. Email
    if (currentUser?.email) {
      tasks.push({ name: 'Add email', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add email', completed: false, path: '/settings', section: 'account' });
    }

    // 7. Customize Profile (background customization)
    if (userData?.profile?.customization?.background || userData?.profile?.customTheme || userData?.profile?.customBanner || userData?.featuredBadges?.length > 0) {
      tasks.push({ name: 'Customize your profile', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Customize your profile', completed: false, path: null, section: null, action: 'openCustomizer' });
    }

    // 8. Earn a Badge
    if (badges && badges.length > 0) {
      tasks.push({ name: 'Earn your first badge', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Earn your first badge', completed: false, path: null, section: null, action: 'scrollToBadges' });
    }

    // 9. Review Notification Settings
    const hasReviewedNotifications = userData?.profileCompletion?.reviewedNotifications || false;
    if (hasReviewedNotifications) {
      tasks.push({ name: 'Review notification settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review notification settings', completed: false, path: '/settings', section: 'notifications' });
    }

    // 10. Review Privacy Settings
    const hasReviewedPrivacy = userData?.profileCompletion?.reviewedPrivacy || false;
    if (hasReviewedPrivacy) {
      tasks.push({ name: 'Review privacy settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review privacy settings', completed: false, path: '/settings', section: 'privacy' });
    }

    // 11. Review Passcode Settings
    const hasReviewedPasscode = userData?.profileCompletion?.reviewedPasscode || false;
    const hasSafetyPasscode = userData?.security?.safetyPasscode;
    if (hasReviewedPasscode || hasSafetyPasscode) {
      tasks.push({ name: 'Review passcode settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review passcode settings', completed: false, path: '/settings', section: 'security' });
    }

    // 12. View About Us
    const hasViewedAbout = userData?.profileCompletion?.viewedAbout || false;
    if (hasViewedAbout) {
      tasks.push({ name: 'View About Us', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'View About Us', completed: false, path: '/about', section: null });
    }

    // 13. Fill Bestie Circle (5 besties)
    const circleCount = userData?.featuredCircle?.length || 0;
    if (circleCount >= 5) {
      tasks.push({ name: 'Fill your Bestie Circle (5 besties)', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: `Fill your Bestie Circle (${circleCount}/5)`, completed: false, path: '/', section: null });
    }

    // 14. FINAL CHALLENGE: Add 5 Besties (total, not just circle)
    if (bestiesCount >= 5) {
      tasks.push({ name: '🎉 Add 5 besties to the app', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: `🎉 Add 5 besties (${bestiesCount}/5)`, completed: false, path: '/besties', section: null });
    }

    const percentage = (completed / tasks.length) * 100;
    return { tasks, percentage, completed, total: tasks.length };
  };

  const handleTaskNavigation = (task) => {
    if (task.action === 'scrollToPhoto') {
      const photoElement = document.querySelector('.photo-menu-container');
      if (photoElement) {
        photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (task.action === 'openCustomizer') {
      // Open the ProfileCustomizer modal
      setShowCustomizer(true);
    } else if (task.action === 'scrollToBadges') {
      const badgesElement = document.querySelector('.badges-section');
      if (badgesElement) {
        badgesElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (task.path) {
      if (task.section) {
        navigate(`${task.path}#${task.section}`);
      } else {
        navigate(task.path);
      }
    }
  };

  const getDaysActive = () => {
    if (!firstCheckInDate) return 0;
    const now = new Date();
    const diffTime = Math.abs(now - firstCheckInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const profileCompletion = calculateProfileCompletion();
  const loginStreak = userData?.loginStreak || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-text-secondary">Loading your profile... 💜</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <OfflineBanner />
      <ConfettiCelebration trigger={confettiTrigger} type="badge" />
      <ProfileAuraStyles />

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
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
                    <button
                      onClick={() => navigate(`/history/${checkIn.id}`)}
                      className="mt-3 btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Card */}
        <div ref={profileCardRef}>
          <ProfileCard
            currentUser={currentUser}
            userData={userData}
            showCustomizer={showCustomizer}
            setShowCustomizer={setShowCustomizer}
            customizerButtonRef={customizerButtonRef}
            onCustomizerClick={() => {}}
            onCustomizerSave={() => {}}
          />
        </div>

        {/* Profile Completion */}
        <div ref={profileCompletionRef}>
          <ProfileCompletion
            profileCompletion={profileCompletion}
            animatedProgress={animatedProgress}
            onTaskNavigation={handleTaskNavigation}
            disableInteractions={false}
          />
        </div>

        {/* Request Support Section */}
        <RequestSupportSection />

        {/* Bestie Circle Status - REMOVED from Profile Page per user request */}
        {/* <BestieCircleStatus userId={currentUser?.uid} /> */}

        {/* Login Streak */}
        <LoginStreak loginStreak={loginStreak} />

        {/* Badges Section */}
        <div ref={badgesSectionRef}>
          <BadgesSection
            currentUser={currentUser}
            badges={badges}
            featuredBadgeIds={featuredBadgeIds}
            setFeaturedBadgeIds={setFeaturedBadgeIds}
            setConfettiTrigger={setConfettiTrigger}
            disableInteractions={false}
          />
        </div>

        {/* Stats Section */}
        <div ref={statsSectionRef}>
          <StatsSection
            bestiesCount={bestiesCount}
            emergencyContactCount={emergencyContactCount}
            daysActive={getDaysActive()}
            userData={userData}
            badges={badges}
            loginStreak={loginStreak}
            nighttimeCheckIns={nighttimeCheckIns}
            weekendCheckIns={weekendCheckIns}
            messagesExchangedThisWeek={messagesExchangedThisWeek}
            supportActionsThisMonth={supportActionsThisMonth}
            challengesCompleted={challengesCompleted}
            activePacts={activePacts}
            avgResponseTime={avgResponseTime}
            strongestConnection={strongestConnection}
          />
        </div>

        {/* Donation Status */}
        <DonationStatus userData={userData} />

        {/* Settings Button */}
        <div className="space-y-3" ref={settingsButtonRef}>
          <button
            onClick={() => {
              // Complete tutorial when Settings is clicked
              if (showTutorial) {
                completeTutorial();
              }
              navigate('/settings');
            }}
            className="w-full btn btn-secondary"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <SocialShareCardsModal onClose={() => setShowShareModal(false)} />
      )}

      {/* Tutorial Overlay - Simple: show once on first visit */}
      {showTutorial && (
        <ProfileTutorialOverlay
          currentStep={1}
          onNext={() => {
            // User clicked "Got it" - complete tutorial and clear all tutorial state
            completeTutorial();
            clearAllTutorialState();
          }}
          onBack={() => {}}
          onSkip={() => {
            // Same as "Got it"
            completeTutorial();
            clearAllTutorialState();
          }}
          isPaused={false}
          refs={{
            profileCard: profileCardRef
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
