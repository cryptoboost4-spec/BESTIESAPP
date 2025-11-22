import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import BestieCard from '../components/BestieCard';
import AddBestieModal from '../components/AddBestieModal';
import PendingRequestsList from '../components/besties/PendingRequestsList';
import NeedsAttentionSection from '../components/besties/NeedsAttentionSection';
import EmptyState from '../components/besties/EmptyState';
import CreatePostModal from '../components/CreatePostModal';
import UrgentAlertBanner from '../components/UrgentAlertBanner';
import toast from 'react-hot-toast';

const BestiesPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Activity feed state
  const [activityFeed, setActivityFeed] = useState([]);
  const [missedCheckIns, setMissedCheckIns] = useState([]);
  const [requestsForAttention, setRequestsForAttention] = useState([]);

  // Rankings period state (weekly, monthly, yearly)
  const [rankingsPeriod, setRankingsPeriod] = useState('weekly');

  // Modal state
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Load besties
  useEffect(() => {
    if (!currentUser) return;

    const requesterQuery = query(
      collection(db, 'besties'),
      where('requesterId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );

    const recipientQuery = query(
      collection(db, 'besties'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );

    const unsubscribeRequester = onSnapshot(requesterQuery, (snapshot) => {
      const bestiesList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: doc.id,
          userId: data.recipientId,
          name: data.recipientName || 'Unknown',
          phone: data.recipientPhone,
          role: 'added',
          isFavorite: data.isFavorite || false,
        });
      });

      getDocs(recipientQuery).then((recipientSnapshot) => {
        recipientSnapshot.forEach((doc) => {
          const data = doc.data();
          bestiesList.push({
            id: doc.id,
            userId: data.requesterId,
            name: data.requesterName || 'Unknown',
            phone: data.requesterPhone,
            role: 'guardian',
            isFavorite: data.isFavorite || false,
          });
        });

        setBesties(bestiesList);
        setLoading(false);
      }).catch((error) => {
        console.error('Error loading recipient besties:', error);
        setBesties(bestiesList);
        setLoading(false);
      });
    });

    const pendingQuery = query(
      collection(db, 'besties'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setPendingRequests(requests);
    });

    return () => {
      unsubscribeRequester();
      unsubscribePending();
    };
  }, [currentUser]);

  // Create welcome posts for new users
  useEffect(() => {
    const createWelcomePosts = async () => {
      if (!currentUser || !userData) return;

      // Check if user is day-old (account created within last 24 hours)
      const accountAge = currentUser.metadata?.creationTime
        ? new Date() - new Date(currentUser.metadata.creationTime)
        : Infinity;
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (accountAge > oneDayInMs) return; // Not a new user

      // Check if welcome posts already exist
      const welcomePostsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', 'BESTIES_BOT')
      );
      const welcomePostsSnapshot = await getDocs(welcomePostsQuery);

      // Check if any existing welcome posts are for this user
      const hasWelcomePosts = welcomePostsSnapshot.docs.some(doc =>
        doc.data().recipientId === currentUser.uid
      );

      if (hasWelcomePosts) return; // Welcome posts already created

      // Create welcome posts
      const welcomeMessages = [
        {
          text: "Welcome to your Besties social hub! 💜\n\nThis is your private space - only your besties see what you get up to in here. There's no algorithm, just you, your besties, and a whole lot of privacy. Feel free to share updates, check-ins, or just say hi!",
          order: 1
        },
        {
          text: "📊 Scroll down to find the leaderboard!\n\nCompete with your friends to see who's most reliable, who's the quickest to respond... but in reality, you all win. This is about staying safe together, not competition. The real prize is having each other's backs! 🏆",
          order: 2
        },
        {
          text: "👥 Keep scrolling to see all your besties!\n\nThis is where you'll find everyone after you've filled your bestie circle. Check on them, see their activity, and stay connected. Your safety squad is growing! 🌟",
          order: 3
        }
      ];

      try {
        for (const message of welcomeMessages) {
          await addDoc(collection(db, 'posts'), {
            userId: 'BESTIES_BOT',
            recipientId: currentUser.uid,
            userName: 'Besties Team',
            userPhoto: null,
            text: message.text,
            photoURL: null,
            createdAt: Timestamp.fromMillis(Date.now() - (3 - message.order) * 1000), // Stagger timestamps
            isWelcomeMessage: true,
          });
        }
      } catch (error) {
        console.error('Error creating welcome posts:', error);
      }
    };

    createWelcomePosts();
  }, [currentUser, userData]);

  // Load activity feed - only when page is visible
  useEffect(() => {
    if (!currentUser || besties.length === 0) {
      return;
    }

    const loadActivityFeed = async () => {
      // Only load if page is visible
      if (document.hidden) return;

      const activities = [];
      const missed = [];
      const attentionRequests = [];

      // Get bestie user IDs (deduplicated to avoid showing duplicates for mutual besties)
      const bestieIds = [...new Set(besties.map(b => b.userId))];

      // Load recent activity (last 48 hours)
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      // Load user's own posts
      const userPostsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', currentUser.uid),
        where('createdAt', '>=', twoDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const userPostsSnapshot = await getDocs(userPostsQuery);
      userPostsSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'post',
          postData: data,
          userName: userData?.displayName || 'You',
          userId: currentUser.uid,
          timestamp: data.createdAt?.toDate() || new Date(),
        });
      });

      // Load welcome posts from Besties Bot
      const welcomePostsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', 'BESTIES_BOT')
      );
      const welcomePostsSnapshot = await getDocs(welcomePostsQuery);
      welcomePostsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only show welcome posts addressed to current user
        if (data.recipientId === currentUser.uid) {
          activities.push({
            id: doc.id,
            type: 'post',
            postData: data,
            userName: 'Besties Team',
            userId: 'BESTIES_BOT',
            timestamp: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      for (const bestieId of bestieIds) {
        try {
          // Get recent check-ins
          const checkInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', bestieId),
            where('createdAt', '>=', twoDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const checkInsSnapshot = await getDocs(checkInsQuery);

          // Get recent posts from this bestie
          const postsQuery = query(
            collection(db, 'posts'),
            where('userId', '==', bestieId),
            where('createdAt', '>=', twoDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const postsSnapshot = await getDocs(postsQuery);
          const bestie = besties.find(b => b.userId === bestieId);

          postsSnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
              id: doc.id,
              type: 'post',
              postData: data,
              userName: bestie?.name || 'Bestie',
              userId: bestieId,
              timestamp: data.createdAt?.toDate() || new Date(),
            });
          });

          checkInsSnapshot.forEach((doc) => {
            const data = doc.data();
            const bestie = besties.find(b => b.userId === bestieId);

            activities.push({
              id: doc.id,
              type: 'checkin',
              checkInData: data,
              userName: bestie?.name || 'Bestie',
              userId: bestieId,
              timestamp: data.createdAt?.toDate() || new Date(),
              status: data.status,
            });

            // Check for missed check-ins
            if (data.status === 'alerted') {
              missed.push({
                id: doc.id,
                userName: bestie?.name || 'Bestie',
                userId: bestieId,
                checkInData: data,
                timestamp: data.createdAt?.toDate() || new Date(),
              });
            }
          });

          // Check for request attention
          const userDoc = await getDoc(doc(db, 'users', bestieId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.requestAttention && userData.requestAttention.active) {
              const bestie = besties.find(b => b.userId === bestieId);
              attentionRequests.push({
                userId: bestieId,
                userName: bestie?.name || 'Bestie',
                tag: userData.requestAttention.tag,
                note: userData.requestAttention.note,
                timestamp: userData.requestAttention.timestamp?.toDate() || new Date(),
              });
            }
          }

          // Load recent achievements/badges
          const badgesDoc = await getDoc(doc(db, 'badges', bestieId));
          if (badgesDoc.exists()) {
            const badgesData = badgesDoc.data();
            const recentBadges = badgesData.badges?.filter(b => {
              const earnedDate = b.earnedAt?.toDate();
              return earnedDate && earnedDate > twoDaysAgo;
            }) || [];

            recentBadges.forEach(badge => {
              const bestie = besties.find(b => b.userId === bestieId);
              activities.push({
                id: `badge-${bestieId}-${badge.id}`,
                type: 'badge',
                userName: bestie?.name || 'Bestie',
                userId: bestieId,
                badge: badge,
                timestamp: badge.earnedAt?.toDate() || new Date(),
              });
            });
          }
        } catch (error) {
          console.error('Error loading activity for bestie:', error);
        }
      }

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => b.timestamp - a.timestamp);

      // Filter alerts to only show selected besties (featured circle)
      const featuredCircle = userData?.featuredCircle || [];
      const filteredMissed = featuredCircle.length > 0
        ? missed.filter(m => featuredCircle.includes(m.userId))
        : missed;
      const filteredAttention = featuredCircle.length > 0
        ? attentionRequests.filter(a => featuredCircle.includes(a.userId))
        : attentionRequests;

      setActivityFeed(activities);
      setMissedCheckIns(filteredMissed);
      setRequestsForAttention(filteredAttention);
    };

    // Initial load
    loadActivityFeed();

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadActivityFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, besties, userData]);

  // Calculate power rankings - TODO: Implement when metrics are available
  /* const getPowerRankings = () => {
    const rankings = {
      mostReliable: [],
      fastestResponder: [],
      safetyChampion: [],
      streakMaster: [],
    };

    // This would need actual metrics from Firestore
    // For now, return empty arrays
    return rankings;
  }; */

  // Get visual indicators for a bestie
  const getBestieIndicators = (bestie) => {
    const indicators = [];

    // Check recent activity for indicators
    const bestieActivities = activityFeed.filter(a => a.userId === bestie.userId);

    // Fast responder - if they have activity in last 5 min
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (bestieActivities.some(a => a.timestamp > fiveMinAgo)) {
      indicators.push({ icon: '⚡', tooltip: 'Fast responder' });
    }

    // Reliable - if they have high completion rate (would need to calculate from Firestore)
    const completedCount = bestieActivities.filter(a => a.status === 'completed').length;
    if (completedCount > 5) {
      indicators.push({ icon: '🛡️', tooltip: 'Very reliable' });
    }

    // Active streak - if they have check-ins multiple days in a row
    indicators.push({ icon: '🔥', tooltip: '7-day streak' });

    // Night check-ins - if they often check in at night
    const nightCheckIns = bestieActivities.filter(a => {
      const hour = a.timestamp.getHours();
      return hour >= 21 || hour <= 6;
    });
    if (nightCheckIns.length > 2) {
      indicators.push({ icon: '🌙', tooltip: 'Night owl' });
    }

    return indicators.slice(0, 3); // Max 3 indicators
  };

  // Load comments for selected check-in
  useEffect(() => {
    if (!selectedCheckIn || !showComments) return;

    const loadComments = async () => {
      try {
        const commentsQuery = query(
          collection(db, 'checkins', selectedCheckIn.id, 'comments'),
          orderBy('timestamp', 'asc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments([]);
      }
    };

    loadComments();
  }, [selectedCheckIn, showComments]);

  // Add comment to check-in
  const addComment = async () => {
    if (!newComment.trim() || !selectedCheckIn) return;

    try {
      await addDoc(collection(db, 'checkins', selectedCheckIn.id, 'comments'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'Anonymous',
        userPhoto: userData?.photoURL || null,
        text: newComment.trim(),
        timestamp: Timestamp.now(),
      });

      // Reload comments
      const commentsQuery = query(
        collection(db, 'checkins', selectedCheckIn.id, 'comments'),
        orderBy('timestamp', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      setComments(commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Filter besties
  const getFilteredBesties = () => {
    let filtered = [...besties];

    // Sort by most recent activity first, then favorites, then alphabetical
    filtered.sort((a, b) => {
      // Check for recent activity
      const aRecent = activityFeed.find(f => f.userId === a.userId);
      const bRecent = activityFeed.find(f => f.userId === b.userId);

      // If both have recent activity, sort by timestamp
      if (aRecent && bRecent) {
        return bRecent.timestamp - aRecent.timestamp;
      }

      // If one has recent activity and the other doesn't
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;

      // If neither has recent activity, favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // Finally, alphabetical
      return (a.name || '').localeCompare(b.name || '');
    });

    return filtered;
  };

  // const rankings = getPowerRankings(); // TODO: Implement rankings when metrics are available
  const filteredBesties = getFilteredBesties();

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

      <div className="max-w-6xl mx-auto p-4 pb-32 md:pb-6">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-display text-gradient">💜 Your Besties</h1>
        </div>

        {/* Urgent Alerts Banner */}
        <UrgentAlertBanner />

        {/* Pending Requests */}
        <PendingRequestsList pendingRequests={pendingRequests} />

        {/* PROMINENT Needs Attention Section - Top when active */}
        <NeedsAttentionSection
          missedCheckIns={missedCheckIns}
          requestsForAttention={requestsForAttention}
          besties={besties}
        />

        {/* Main Content - Full Width */}
        <div className="space-y-6">
            {/* This Week's Champions - Soft & Girly Version */}
            <div className="relative overflow-hidden">
              {/* Subtle sparkly background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-2 left-2 text-pink-200 text-sm">✨</div>
                <div className="absolute top-3 right-3 text-purple-200 text-sm">💫</div>
                <div className="absolute bottom-2 left-3 text-pink-200 text-sm">⭐</div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-600 shadow-lg relative">
                {/* Cute header with crown */}
                <div className="text-center mb-3">
                  <div className="text-3xl mb-1">👑</div>
                  <h2 className="text-lg font-display bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {rankingsPeriod === 'weekly' && "This Week's Queens"}
                    {rankingsPeriod === 'monthly' && "This Month's Queens"}
                    {rankingsPeriod === 'yearly' && "This Year's Queens"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your amazing squad! 💕</p>
                </div>

                {/* Period Tabs - Compact */}
                <div className="flex gap-1.5 justify-center mb-3">
                  <button
                    onClick={() => setRankingsPeriod('weekly')}
                    className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                      rankingsPeriod === 'weekly'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📅 Week
                  </button>
                  <button
                    onClick={() => setRankingsPeriod('monthly')}
                    className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                      rankingsPeriod === 'monthly'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    🗓️ Month
                  </button>
                  <button
                    onClick={() => setRankingsPeriod('yearly')}
                    className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                      rankingsPeriod === 'yearly'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    🎯 Year
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Most Reliable - Pink gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-rose-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-pink-200 dark:border-pink-600 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                            💖
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Most Reliable
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Always there for you 💕</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fastest Responder - Purple gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-fuchsia-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-purple-200 dark:border-purple-600 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-300 to-fuchsia-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                            ⚡
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                            Super Speedy
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Quick to the rescue 💜</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety Champion - Rose gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-pink-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-rose-200 dark:border-rose-600 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                            🛡️
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                            Guardian Angel
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Keeping you safe 🌸</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Streak Queen - Yellow gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-yellow-200 dark:border-yellow-600 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                            🔥
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                            Streak Queen
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">On fire lately! ✨</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cute footer */}
                <div className="mt-3 pt-2 border-t border-pink-200 dark:border-pink-600 text-center">
                  <p className="text-xs font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {rankingsPeriod === 'weekly' && '💫 Resets Monday'}
                    {rankingsPeriod === 'monthly' && '💫 Resets on 1st'}
                    {rankingsPeriod === 'yearly' && '💫 Resets Jan 1st'}
                  </p>
                </div>
              </div>
            </div>

          {/* Besties Grid */}
          <div>
            <h2 className="text-lg md:text-xl font-display text-text-primary mb-3 md:mb-4">
              All Besties
            </h2>

            {filteredBesties.length === 0 ? (
                <div className="card p-6 md:p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
                  <div className="text-5xl md:text-6xl mb-3">💜</div>
                  <p className="text-base md:text-lg font-semibold text-text-primary mb-2">No besties yet</p>
                  <p className="text-sm md:text-base text-text-secondary">
                    Start adding besties to see them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                  {filteredBesties.map((bestie) => {
                    const indicators = getBestieIndicators(bestie);
                    return (
                      <div key={bestie.id} className="relative group">
                        {/* Main card with improved styling */}
                        <div className="h-full transform transition-all duration-300 hover:scale-[1.02]">
                          <BestieCard bestie={bestie} />
                        </div>

                        {/* Visual Indicators - Top Left */}
                        {indicators.length > 0 && (
                          <div className="absolute top-3 left-3 flex gap-1 z-10">
                            {indicators.map((indicator, idx) => (
                              <span
                                key={idx}
                                className="text-base bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-purple-200 dark:border-purple-600"
                                title={indicator.tooltip}
                              >
                                {indicator.icon}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quick Action Overlay - Shows on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4 pointer-events-none group-hover:pointer-events-auto">
                          <div className="w-full space-y-2">
                            <button
                              onClick={() => navigate(`/user/${bestie.userId}`)}
                              className="w-full bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                              <span>👤</span>
                              <span>View Profile</span>
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const bestieDoc = await getDoc(doc(db, 'besties', bestie.id));
                                    if (bestieDoc.exists()) {
                                      await updateDoc(doc(db, 'besties', bestie.id), {
                                        isFavorite: !bestieDoc.data().isFavorite
                                      });
                                      toast.success(bestieDoc.data().isFavorite ? 'Removed from circle' : 'Added to circle! 💜');
                                    }
                                  } catch (error) {
                                    console.error('Error toggling circle:', error);
                                    toast.error('Failed to update');
                                  }
                                }}
                                className={`flex-1 ${bestie.isFavorite ? 'bg-pink-500 hover:bg-pink-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg`}
                              >
                                <span>{bestie.isFavorite ? '💔' : '💜'}</span>
                                <span className="text-sm">{bestie.isFavorite ? 'Remove' : 'Add to Circle'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (bestie.phone) {
                                    window.location.href = `sms:${bestie.phone}`;
                                  } else {
                                    toast.error('No phone number available');
                                  }
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                              >
                                <span>💬</span>
                                <span className="text-sm">Message</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* Empty State */}
        <EmptyState
          besties={besties}
          pendingRequests={pendingRequests}
          onAddBestie={() => setShowAddModal(true)}
        />
      </div>

      {/* Comments Modal - Mobile Optimized with Bottom Menu Bar Clearance */}
      {showComments && selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end md:items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl max-w-md w-full max-h-[80vh] md:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-display text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text">
                  💬 Comments
                </h2>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setSelectedCheckIn(null);
                    setComments([]);
                    setNewComment('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedCheckIn.userName}'s check-in
              </p>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 overscroll-contain">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                    No comments yet
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Be the first to comment!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-fade-in">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {comment.userPhoto ? (
                        <img
                          src={comment.userPhoto}
                          alt={comment.userName}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-600"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-display ring-2 ring-purple-100 dark:ring-purple-600">
                          {comment.userName?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl px-4 py-2 shadow-sm">
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-200">
                          {comment.userName}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-3">
                        {comment.timestamp?.toDate ? getTimeAgo(comment.timestamp.toDate()) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input - Fixed at bottom with safe area */}
            <div className="p-4 md:p-6 border-t-2 border-purple-100 dark:border-purple-600 flex-shrink-0 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 rounded-full border-2 border-purple-200 dark:border-purple-600 focus:border-purple-400 dark:focus:border-purple-400 focus:outline-none text-sm shadow-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bestie Modal */}
      {showAddModal && (
        <AddBestieModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={() => {
            // Reload activity feed after post creation
            window.location.reload();
          }}
        />
      )}

      {/* CSS for slow pulse animation */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

// Helper function to get time ago
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default BestiesPage;
