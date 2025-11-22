import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
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
      where('status', '==', 'alerted')
    );

    const unsubscribe = onSnapshot(
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
        where('status', '==', 'accepted')
      );
      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(bestiesQuery),
        getDocs(bestiesQuery2)
      ]);

      setBestiesCount(snapshot1.size + snapshot2.size);

      // Count how many times user is an emergency contact
      const emergencyContactQuery = query(
        collection(db, 'checkins'),
        where('selectedBesties', 'array-contains', currentUser.uid)
      );
      const emergencySnapshot = await getDocs(emergencyContactQuery);
      setEmergencyContactCount(emergencySnapshot.size);

      // Get first check-in date
      const checkInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      if (!checkInsSnapshot.empty) {
        let earliestDate = null;
        let nightCount = 0;
        let weekendCount = 0;

        checkInsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          const date = data.createdAt?.toDate();

          if (date) {
            if (!earliestDate || date < earliestDate) {
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

        setFirstCheckInDate(earliestDate);
        setNighttimeCheckIns(nightCount);
        setWeekendCheckIns(weekendCount);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
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

    // 7. Customize Profile
    if (userData?.profile?.customTheme || userData?.profile?.customBanner || userData?.featuredBadges?.length > 0) {
      tasks.push({ name: 'Customize your profile', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Customize your profile', completed: false, path: '/profile', section: null });
    }

    // 8. Earn a Badge
    if (badges && badges.length > 0) {
      tasks.push({ name: 'Earn your first badge', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Earn your first badge', completed: false, path: null, section: null, action: 'scrollToBadges' });
    }

    // 9. Fill Bestie Circle (5 besties)
    const circleCount = userData?.featuredCircle?.length || 0;
    if (circleCount >= 5) {
      tasks.push({ name: 'Fill your Bestie Circle (5 besties)', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: `Fill your Bestie Circle (${circleCount}/5)`, completed: false, path: null, section: null, action: 'scrollToBestieCircle' });
    }

    // 10. Review Notification Settings
    const hasReviewedNotifications = userData?.profileCompletion?.reviewedNotifications || false;
    if (hasReviewedNotifications) {
      tasks.push({ name: 'Review notification settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review notification settings', completed: false, path: '/settings', section: 'notifications' });
    }

    // 11. Review Privacy Settings
    const hasReviewedPrivacy = userData?.profileCompletion?.reviewedPrivacy || false;
    if (hasReviewedPrivacy) {
      tasks.push({ name: 'Review privacy settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review privacy settings', completed: false, path: '/settings', section: 'privacy' });
    }

    // 12. Review Passcode Settings
    const hasReviewedPasscode = userData?.profileCompletion?.reviewedPasscode || false;
    const hasSafetyPasscode = userData?.security?.safetyPasscode;
    if (hasReviewedPasscode || hasSafetyPasscode) {
      tasks.push({ name: 'Review passcode settings', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Review passcode settings', completed: false, path: '/settings', section: 'security' });
    }

    // 13. View About Us
    const hasViewedAbout = userData?.profileCompletion?.viewedAbout || false;
    if (hasViewedAbout) {
      tasks.push({ name: 'View About Us', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'View About Us', completed: false, path: '/about', section: null });
    }

    // 14. FINAL CHALLENGE: Invite 5 Besties
    // Count total besties (not just in circle)
    if (bestiesCount >= 5) {
      tasks.push({ name: '🎉 Invite 5 besties to the app', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: `🎉 Invite 5 besties (${bestiesCount}/5)`, completed: false, path: '/home', section: null });
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
    } else if (task.action === 'scrollToBestieCircle') {
      const bestieCircleElement = document.querySelector('.bestie-circle-section');
      if (bestieCircleElement) {
        bestieCircleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
      <div className="min-h-screen bg-pattern">
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
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
        <ProfileCard currentUser={currentUser} userData={userData} />

        {/* Profile Completion */}
        <ProfileCompletion
          profileCompletion={profileCompletion}
          animatedProgress={animatedProgress}
          onTaskNavigation={handleTaskNavigation}
        />

        {/* Request Support Section */}
        <RequestSupportSection />

        {/* Bestie Circle Status - REMOVED from Profile Page per user request */}
        {/* <BestieCircleStatus userId={currentUser?.uid} /> */}

        {/* Login Streak */}
        <LoginStreak loginStreak={loginStreak} />

        {/* Badges Section */}
        <BadgesSection
          currentUser={currentUser}
          badges={badges}
          featuredBadgeIds={featuredBadgeIds}
          setFeaturedBadgeIds={setFeaturedBadgeIds}
          setConfettiTrigger={setConfettiTrigger}
        />

        {/* Stats Section */}
        <StatsSection
          bestiesCount={bestiesCount}
          emergencyContactCount={emergencyContactCount}
          daysActive={getDaysActive()}
          userData={userData}
          badges={badges}
          loginStreak={loginStreak}
          nighttimeCheckIns={nighttimeCheckIns}
          weekendCheckIns={weekendCheckIns}
        />

        {/* Donation Status */}
        <DonationStatus userData={userData} />

        {/* Settings Button */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/settings')}
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
    </div>
  );
};

export default ProfilePage;
