import React, { useState, useEffect } from 'react';
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
  addDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import AddBestieModal from '../components/AddBestieModal';
import PendingRequestsList from '../components/besties/PendingRequestsList';
import NeedsAttentionSection from '../components/besties/NeedsAttentionSection';
import ActivityFeed from '../components/besties/ActivityFeed';
import ActivityFeedSkeleton from '../components/besties/ActivityFeedSkeleton';
import EmptyState from '../components/besties/EmptyState';
import CreatePostModal from '../components/CreatePostModal';
import BestiesLeaderboard from '../components/besties/BestiesLeaderboard';
import BestiesGrid from '../components/besties/BestiesGrid';
import CommentsModal from '../components/besties/CommentsModal';
import FloatingNotificationBell from '../components/FloatingNotificationBell';
import toast from 'react-hot-toast';

const BestiesPage = () => {
  const { currentUser, userData } = useAuth();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Activity feed state
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [missedCheckIns, setMissedCheckIns] = useState([]);
  const [requestsForAttention, setRequestsForAttention] = useState([]);

  // Rankings period state (weekly, monthly, yearly)
  const [rankingsPeriod, setRankingsPeriod] = useState('weekly');

  // Modal state
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [reactions, setReactions] = useState({}); // { checkInId: [reactions] }

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
      setActivityLoading(false);
      return;
    }

    const loadActivityFeed = async () => {
      // Only load if page is visible
      if (document.hidden) return;

      setActivityLoading(true);

      const activities = [];
      const missed = [];
      const attentionRequests = [];

      // Get bestie user IDs (deduplicated)
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
          // Get recent check-ins FROM this bestie
          const checkInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', bestieId),
            where('createdAt', '>=', twoDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const checkInsSnapshot = await getDocs(checkInsQuery);

          // ALSO get check-ins where CURRENT USER is a selected bestie FOR this friend
          const checkInsAsBestieQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', bestieId),
            where('bestieIds', 'array-contains', currentUser.uid),
            where('createdAt', '>=', twoDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const checkInsAsBestieSnapshot = await getDocs(checkInsAsBestieQuery);

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

          // Process check-ins from both queries
          const allCheckInsSnapshots = [checkInsSnapshot, checkInsAsBestieSnapshot];

          allCheckInsSnapshots.forEach(snapshot => {
            snapshot.forEach((doc) => {
              const data = doc.data();
              const bestie = besties.find(b => b.userId === bestieId);

              // Avoid duplicates
              const alreadyAdded = activities.some(a => a.id === doc.id);
              if (!alreadyAdded) {
                activities.push({
                  id: doc.id,
                  type: 'checkin',
                  checkInData: data,
                  userName: bestie?.name || 'Bestie',
                  userId: bestieId,
                  timestamp: data.createdAt?.toDate() || new Date(),
                  status: data.status,
                });

                // Check for missed check-ins (alerted status)
                if (data.status === 'alerted') {
                  const alreadyInMissed = missed.some(m => m.id === doc.id);
                  if (!alreadyInMissed) {
                    missed.push({
                      id: doc.id,
                      userName: bestie?.name || 'Bestie',
                      userId: bestieId,
                      checkInData: data,
                      timestamp: data.createdAt?.toDate() || new Date(),
                    });
                  }
                }
              }
            });
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
      setActivityLoading(false);
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

  // Load reactions for check-ins
  useEffect(() => {
    if (activityFeed.length === 0) return;

    const loadReactions = async () => {
      const reactionsData = {};

      for (const activity of activityFeed) {
        if (activity.type === 'checkin') {
          try {
            const reactionsSnapshot = await getDocs(
              collection(db, 'checkins', activity.id, 'reactions')
            );
            reactionsData[activity.id] = reactionsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (error) {
            console.error('Error loading reactions:', error);
            reactionsData[activity.id] = [];
          }
        }
      }

      setReactions(reactionsData);
    };

    loadReactions();
  }, [activityFeed]);

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

  // Add reaction to check-in
  const addReaction = async (checkInId, emoji) => {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions[checkInId]?.find(
        r => r.userId === currentUser.uid && r.emoji === emoji
      );

      if (existingReaction) {
        toast('You already reacted with this!', { icon: emoji });
        return;
      }

      await addDoc(collection(db, 'checkins', checkInId, 'reactions'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'Anonymous',
        emoji: emoji,
        timestamp: Timestamp.now(),
      });

      // Reload reactions for this check-in
      const reactionsSnapshot = await getDocs(
        collection(db, 'checkins', checkInId, 'reactions')
      );
      setReactions(prev => ({
        ...prev,
        [checkInId]: reactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }));

      toast.success('Reaction added!');
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

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
      {/* Notification Bell - No Header */}
      <div className="fixed top-4 right-4 z-50">
        <FloatingNotificationBell />
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-32 md:pb-6">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-display text-gradient">💜 Your Besties</h1>
        </div>

        {/* Pending Requests */}
        <PendingRequestsList pendingRequests={pendingRequests} />

        {/* PROMINENT Needs Attention Section - Top when active */}
        <NeedsAttentionSection
          missedCheckIns={missedCheckIns}
          requestsForAttention={requestsForAttention}
          besties={besties}
        />

        {/* Activity Feed - Moved to top */}
        <div className="mb-6">
          {/* Activity Feed Header with Create Post Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-display text-text-primary">
              📰 Activity Feed
            </h2>
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="btn btn-primary px-4 py-2 text-sm font-semibold"
            >
              ✍️ Post
            </button>
          </div>

          {/* Activity Feed */}
          {activityLoading ? (
            <ActivityFeedSkeleton />
          ) : (
            <ActivityFeed
              activityFeed={activityFeed}
              reactions={reactions}
              addReaction={addReaction}
              setSelectedCheckIn={setSelectedCheckIn}
              setShowComments={setShowComments}
              getTimeAgo={getTimeAgo}
            />
          )}
        </div>

        {/* Leaderboard and Besties Section */}
        <div className="space-y-6">
          {/* This Week's Champions */}
          <BestiesLeaderboard
            rankingsPeriod={rankingsPeriod}
            setRankingsPeriod={setRankingsPeriod}
          />

          {/* Besties Grid */}
          <BestiesGrid
            besties={filteredBesties}
            activityFeed={activityFeed}
          />
        </div>

        {/* Empty State */}
        <EmptyState
          besties={besties}
          pendingRequests={pendingRequests}
          onAddBestie={() => setShowAddModal(true)}
        />
      </div>

      {/* Comments Modal */}
      {showComments && selectedCheckIn && (
        <CommentsModal
          selectedCheckIn={selectedCheckIn}
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={addComment}
          onClose={() => {
            setShowComments(false);
            setSelectedCheckIn(null);
            setComments([]);
            setNewComment('');
          }}
        />
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

export default BestiesPage;
