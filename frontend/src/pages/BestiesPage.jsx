import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useActivityFeed } from '../hooks/useActivityFeed';
import toast from 'react-hot-toast';

const BestiesPage = () => {
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Activity feed - using custom hook
  const { activityFeed, activityLoading, missedCheckIns, requestsForAttention } = useActivityFeed(currentUser, besties, userData);

  // Rankings period state (weekly, monthly, yearly)
  const [rankingsPeriod, setRankingsPeriod] = useState('weekly');

  // Modal state
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [reactions, setReactions] = useState({}); // { checkInId: [reactions] }

  // Handle opening post from notification
  useEffect(() => {
    if (location.state?.openPostId) {
      setSelectedPostId(location.state.openPostId);
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('checkin_reaction_added', {
        emoji: emoji,
        checkin_id: checkInId
      });

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

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('checkin_comment_added', {
        checkin_id: selectedCheckIn.id,
        comment_length: newComment.trim().length
      });

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
      <div className="fixed top-16 right-4 z-50">
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
              activityFeed={activityFeed.filter(activity => {
                // Filter out activities that are already shown in Needs Attention section
                const isInMissedCheckIns = missedCheckIns.some(m => 
                  m.userId === activity.userId && activity.status === 'alerted'
                );
                const isInAttentionRequests = requestsForAttention.some(r => 
                  r.userId === activity.userId && activity.type === 'checkin'
                );
                return !isInMissedCheckIns && !isInAttentionRequests;
              })}
              reactions={reactions}
              addReaction={addReaction}
              setSelectedCheckIn={setSelectedCheckIn}
              setShowComments={setShowComments}
              getTimeAgo={getTimeAgo}
              initialPostId={selectedPostId}
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
