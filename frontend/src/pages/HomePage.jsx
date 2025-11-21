import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, getDocs, getDoc, orderBy, limit } from 'firebase/firestore';
import Header from '../components/Header';
import CheckInCard from '../components/CheckInCard';
import QuickCheckInButtons from '../components/QuickCheckInButtons';
import BestieCircleStatus from '../components/BestieCircleStatus';
import DonationCard from '../components/DonationCard';
import EmergencySOSButton from '../components/EmergencySOSButton';
import BestieCelebrationModal from '../components/BestieCelebrationModal';
import ProfileWithBubble from '../components/ProfileWithBubble';
import AddToHomeScreenPrompt from '../components/AddToHomeScreenPrompt';
import GetMeOutButton from '../components/GetMeOutButton';
import OfflineBanner from '../components/OfflineBanner';
import PullToRefresh from '../components/PullToRefresh';
import NeedsAttentionSection from '../components/besties/NeedsAttentionSection';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';

// Dynamic supportive messages for girls 💜
const SUPPORTIVE_MESSAGES = [
  "Stay safe out there, queen! 👑",
  "Your besties have your back! 💜",
  "Looking out for you, babe! ✨",
  "Let's keep you safe, hun! 🛡️",
  "Ready to slay safely? 💅",
  "Your safety squad is here! 🌟",
  "Go live your life, we got you! 💕",
  "Be bold, be safe, be you! ⚡",
  "Adventure awaits safely! 🌸",
  "Your crew is watching out! 👯‍♀️",
  "Stay fierce, stay safe! 🔥",
  "We're here if you need us! 🤗",
  "Go make memories safely! 📸",
  "Your safety, your way! 💖",
  "Protected and empowered! ⭐",
  "Living your best life safely! 🦋",
  "Your peace of mind matters! 🌺",
  "Safe vibes only! ✌️",
  "Let's keep you covered, sis! 💪",
  "Confidence + Safety = You! 💎"
];

const HomePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Attention state
  const [showRequestAttention, setShowRequestAttention] = useState(false);
  const [attentionTag, setAttentionTag] = useState('');

  // Alerts state
  const [missedCheckIns, setMissedCheckIns] = useState([]);
  const [requestsForAttention, setRequestsForAttention] = useState([]);
  const [besties, setBesties] = useState([]);

  // Scrolling bubble example messages
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const exampleMessages = [
    '💬 Needs to vent',
    '🫂 Need a shoulder',
    '💜 Could use support',
    '😔 Having a rough day',
    "🎉 Let's do something",
    '📱 Want to chat'
  ];

  // Random supportive message (changes on each page load)
  const welcomeMessage = useMemo(() => {
    return SUPPORTIVE_MESSAGES[Math.floor(Math.random() * SUPPORTIVE_MESSAGES.length)];
  }, []); // Empty deps = only runs once on mount

  // Rotate through example messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % exampleMessages.length);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const pendingInvite = localStorage.getItem('pending_invite');
    if (pendingInvite && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to active check-ins
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

    return () => {
      unsubscribeCheckIns();
    };
  }, [currentUser]);

  // Load alerts for featured circle besties
  useEffect(() => {
    if (!currentUser || !userData) return;

    const loadAlerts = async () => {
      try {
        // Get user's featured circle
        const featuredCircle = userData.featuredCircle || [];
        if (featuredCircle.length === 0) {
          setMissedCheckIns([]);
          setRequestsForAttention([]);
          return;
        }

        // Load bestie names/info
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

        const missed = [];
        const attentionRequests = [];

        // Check each bestie in featured circle for alerts
        for (const bestieId of featuredCircle) {
          // Check for missed check-ins (last 48 hours)
          const twoDaysAgo = new Date();
          twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

          const checkInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', bestieId),
            where('createdAt', '>=', twoDaysAgo),
            where('status', '==', 'alerted'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );

          const checkInsSnapshot = await getDocs(checkInsQuery);
          checkInsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const bestie = bestiesData.find(b => b.userId === bestieId);
            missed.push({
              id: docSnap.id,
              userName: bestie?.name || 'Bestie',
              userId: bestieId,
              checkInData: data,
              timestamp: data.createdAt?.toDate() || new Date(),
            });
          });

          // Check for attention requests
          const userDoc = await getDoc(doc(db, 'users', bestieId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.requestAttention && data.requestAttention.active) {
              const bestie = bestiesData.find(b => b.userId === bestieId);
              attentionRequests.push({
                userId: bestieId,
                userName: bestie?.name || 'Bestie',
                tag: data.requestAttention.tag,
                note: data.requestAttention.note,
                timestamp: data.requestAttention.timestamp?.toDate() || new Date(),
              });
            }
          }
        }

        setMissedCheckIns(missed);
        setRequestsForAttention(attentionRequests);
      } catch (error) {
        console.error('Error loading alerts:', error);
      }
    };

    loadAlerts();
  }, [currentUser, userData]);

  const handleRefresh = async () => {
    // Reload user data by forcing a re-fetch
    // The Firestore listeners will automatically update when data changes
    try {
      // Trigger a small delay to show the refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Refreshed! 💜', { duration: 2000 });
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-pattern">
        <OfflineBanner />
        <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Welcome Message */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-display text-text-primary mb-2">
            Hey {userData?.displayName || 'there'}! 👋
          </h1>
          <p className="text-text-secondary">
            {activeCheckIns.length > 0
              ? `You have ${activeCheckIns.length} active check-in${activeCheckIns.length > 1 ? 's' : ''}`
              : welcomeMessage}
          </p>
        </div>

        {/* Needs Attention Section - Featured Circle Only */}
        <NeedsAttentionSection
          missedCheckIns={missedCheckIns}
          requestsForAttention={requestsForAttention}
          besties={besties}
        />

        {/* Quick Check-In Buttons */}
        {activeCheckIns.length === 0 && (
          <>
            <QuickCheckInButtons />

            {/* Bestie Circle Status */}
            <BestieCircleStatus userId={currentUser?.uid} />

            {/* Request Attention Button */}
            {userData?.requestAttention?.active ? (
              <div className="card p-4 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">💜</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display text-purple-900 dark:text-purple-100 mb-2">
                      You're requesting attention
                    </h3>
                    <div className="inline-block px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded-full text-sm font-semibold mb-2">
                      {userData.requestAttention.tag}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                      Your besties can see this on your profile 💜
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          'requestAttention.active': false,
                        });
                        toast.success('Request removed');
                      } catch (error) {
                        console.error('Error canceling request:', error);
                        toast.error('Failed to cancel request');
                      }
                    }}
                    className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-semibold text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6 mb-6 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-700">
                {/* Header with sparkle emoji */}
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">✨</div>
                  <h3 className="text-xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Need a Little Support?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We all have those days. Let your besties know you could use some extra love right now 💕
                  </p>
                </div>

                {/* Preview card - centered */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border-2 border-purple-200 dark:border-purple-600 shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Preview:</p>
                    <ProfileWithBubble
                      photoURL={userData?.photoURL}
                      name={userData?.displayName || currentUser?.email || 'You'}
                      requestAttention={{ active: true, tag: exampleMessages[currentMessageIndex] }}
                      size="lg"
                      showBubble={true}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic">
                      Your besties will see "{exampleMessages[currentMessageIndex]}" on your profile
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic.light();
                    setShowRequestAttention(true);
                  }}
                  className="btn bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full shadow-lg"
                >
                  💜 Request Support
                </button>
              </div>
            )}
          </>
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

            {/* Get Me Out Button - Only shows during active check-ins */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-2 border-orange-200 dark:border-orange-700">
              <h3 className="text-lg font-display text-orange-900 dark:text-orange-100 mb-2 text-center">
                🆘 Need an Exit Strategy?
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-4 text-center">
                Feeling uncomfortable? Hold the button for 3 seconds and your besties will call you to help you get out of there.
              </p>
              <GetMeOutButton currentUser={currentUser} userData={userData} />
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

        {/* Stats Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-text-primary">Your Safety Stats</h3>
            <button
              onClick={() => navigate('/profile')}
              className="text-primary font-semibold hover:underline text-sm"
            >
              View Profile →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                {userData?.stats?.currentStreak || 0} 🔥
              </div>
              <div className="text-sm text-text-secondary">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-accent">
                {userData?.stats?.longestStreak || 0} 👑
              </div>
              <div className="text-sm text-text-secondary">Longest Streak</div>
            </div>
          </div>
        </div>

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
                    navigate('/besties');
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
      <EmergencySOSButton />

      {/* Bestie Celebration Modal */}
      <BestieCelebrationModal />

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreenPrompt currentUser={currentUser} userData={userData} />

      {/* Request Attention Modal */}
      {showRequestAttention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-display text-text-primary mb-4">
              💜 Request Attention
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Let your besties know you could use some support. This is a non-urgent request - they'll see a badge on your profile throughout the app.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                How can your besties help?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAttentionTag('Needs to vent 💬')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs to vent 💬'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs to vent</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Needs a shoulder 🫂')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs a shoulder 🫂'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🫂</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs a shoulder</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Could use support 💜')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Could use support 💜'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💜</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Could use support</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Having a rough day 😔')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Having a rough day 😔'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">😔</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rough day</div>
                </button>
                <button
                  onClick={() => setAttentionTag("Let's do something 🎉")}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === "Let's do something 🎉"
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Let's hang out</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Want to chat 📱')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Want to chat 📱'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Want to chat</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestAttention(false);
                  setAttentionTag('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!attentionTag) {
                    toast.error('Please select an option');
                    return;
                  }

                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      requestAttention: {
                        active: true,
                        tag: attentionTag,
                        timestamp: Timestamp.now(),
                      }
                    });

                    // Notify all besties
                    try {
                      const bestiesQuery = query(
                        collection(db, 'besties'),
                        where('status', '==', 'accepted')
                      );
                      const bestiesSnapshot = await getDocs(bestiesQuery);
                      const userBesties = [];

                      bestiesSnapshot.forEach(doc => {
                        const data = doc.data();
                        // Get the other person's ID (not mine)
                        if (data.requesterId === currentUser.uid) {
                          userBesties.push({ id: data.recipientId });
                        } else if (data.recipientId === currentUser.uid) {
                          userBesties.push({ id: data.requesterId });
                        }
                      });

                      // Send notification to each bestie
                      for (const bestie of userBesties) {
                        await notificationService.notifyRequestAttention(
                          bestie.id,
                          userData?.displayName || 'A bestie',
                          currentUser.uid
                        );
                      }
                    } catch (notifError) {
                      console.error('Error sending notifications:', notifError);
                      // Don't fail the whole operation if notifications fail
                    }

                    toast.success('Your besties will see your request 💜');
                    setShowRequestAttention(false);
                    setAttentionTag('');
                  } catch (error) {
                    console.error('Error requesting attention:', error);
                    toast.error('Failed to send request');
                  }
                }}
                className="flex-1 btn btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PullToRefresh>
  );
};

export default HomePage;
