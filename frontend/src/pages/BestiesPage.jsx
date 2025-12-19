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
  Timestamp
} from 'firebase/firestore';
import AddBestieModal from '../components/AddBestieModal';
import PendingRequestsList from '../components/besties/PendingRequestsList';
import NeedsAttentionSection from '../components/besties/NeedsAttentionSection';
import ActivityFeed from '../components/besties/ActivityFeed';
import EmptyState from '../components/besties/EmptyState';
import CreatePostModal from '../components/CreatePostModal';
import BestiesGrid from '../components/besties/BestiesGrid';
import CommentsModal from '../components/besties/CommentsModal';
import CircleCheckInCard from '../components/circleCheckin/CircleCheckInCard';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useBestiesTutorialState } from '../hooks/useBestiesTutorialState';
import BestiesTutorialWelcome from '../components/tutorials/besties/BestiesTutorialWelcome';
import BestiesTutorialOverlay from '../components/tutorials/besties/BestiesTutorialOverlay';
import CelebrationToast from '../components/tutorials/CelebrationToast';
import { useRef } from 'react';
import toast from 'react-hot-toast';

const BestiesPage = () => {
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredCircle, setFeaturedCircle] = useState([]);

  // Activity feed - using custom hook
  const { activityFeed, activityLoading, missedCheckIns, requestsForAttention } = useActivityFeed(currentUser, besties, userData);

  // Mock posts for tutorial
  const [mockTutorialPosts, setMockTutorialPosts] = useState([]);

  // Read localStorage flags BEFORE any state initialization to avoid race conditions
  const initialState = useRef(() => {
    if (typeof window === 'undefined') {
      return { fromClickBestiesTab: false, shouldResetTooltip: false };
    }
    
    const fromClickBestiesTab = localStorage.getItem('bestieCircle_postTutorialStep') === 'click-besties-tab';
    
    // If coming from click-besties-tab, clear flags immediately
    if (fromClickBestiesTab) {
      localStorage.removeItem('bestieCircle_postTutorialStep');
      localStorage.removeItem('besties_tooltip_dismissed'); // FIXED: Correct key
      console.log('[Besties Tutorial] Coming from click-besties-tab, cleared flags');
      return { fromClickBestiesTab: true, shouldResetTooltip: true };
    }
    
    return { fromClickBestiesTab: false, shouldResetTooltip: false };
  }).current(); // Call immediately via IIFE pattern with useRef

  // Track if the first tooltip was dismissed (so Profile button appears and flashes)
  const [tooltipDismissed, setTooltipDismissed] = useState(() => {
    // If we should reset (coming from click-besties-tab), start with false
    if (initialState.shouldResetTooltip) {
      return false;
    }
    // Otherwise, read from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('besties_tooltip_dismissed') === 'true';
    }
    return false;
  });
  const autoStartAttempted = useRef(false);

  // Tutorial state
  const tutorial = useBestiesTutorialState();
  
  // Auto-start tutorial on first visit OR when coming from "click-besties-tab" step
  useEffect(() => {
    const fromClickBestiesTab = initialState.fromClickBestiesTab;
    
    console.log('[Besties Tutorial] Auto-start check:', {
      fromClickBestiesTab,
      isLoading: tutorial.isLoading,
      isCompleted: tutorial.isCompleted,
      tutorialActive: tutorial.tutorialActive,
      tooltipDismissed,
      autoStartAttempted: autoStartAttempted.current
    });
    
    // Don't run if still loading
    if (tutorial.isLoading) return;
    
    // If coming from click-besties-tab, always start tutorial (reset if needed)
    if (fromClickBestiesTab && !tutorial.tutorialActive) {
      console.log('[Besties Tutorial] Coming from click-besties-tab, starting tutorial...');
      const startTutorial = async () => {
        // Reset if previously completed
        if (tutorial.isCompleted) {
          console.log('[Besties Tutorial] Tutorial was completed, resetting...');
          await tutorial.resetTutorial();
        }
        // Start tutorial
        tutorial.startTutorial();
        setTooltipDismissed(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('besties_tooltip_dismissed');
          window.dispatchEvent(new CustomEvent('besties_tooltip_dismissed_changed', {
            detail: { dismissed: false }
          }));
          if (window.analytics) {
            window.analytics.track('tutorial_started', { 
              page: 'besties', 
              auto_started: true,
              from_click_besties_tab: true
            });
          }
        }
      };
      startTutorial();
      return;
    }
    
    // Normal auto-start for first-time visitors
    // Only auto-start if:
    // - Tutorial is not completed
    // - Tutorial is not already active
    // - Not coming from a notification
    // - Haven't already attempted to auto-start
    if (
      !tutorial.isCompleted &&
      !tutorial.tutorialActive &&
      !location.state?.fromNotification &&
      !location.state?.restartTutorial &&
      !autoStartAttempted.current
    ) {
      console.log('[Besties Tutorial] First-time visitor, auto-starting tutorial...');
      autoStartAttempted.current = true;
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        tutorial.startTutorial();
        setTooltipDismissed(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('besties_tooltip_dismissed');
          window.dispatchEvent(new CustomEvent('besties_tooltip_dismissed_changed', {
            detail: { dismissed: false }
          }));
          if (window.analytics) {
            window.analytics.track('tutorial_started', { 
              page: 'besties', 
              auto_started: true,
              from_click_besties_tab: false
            });
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tutorial.isLoading, tutorial.isCompleted, tutorial.tutorialActive, location.state?.fromNotification, location.state?.restartTutorial, tooltipDismissed]);
  
  // Handle tutorial restart from navigation state
  useEffect(() => {
    if (location.state?.restartTutorial && !tutorial.isLoading && tutorial.isCompleted) {
      tutorial.resetTutorial().then(() => {
        tutorial.startTutorial();
        // Clear the state
        window.history.replaceState({}, document.title);
      });
    }
  }, [location.state, tutorial]);

  // Reset tooltipDismissed when tutorial starts (backup safety check)
  useEffect(() => {
    if (tutorial.tutorialActive && tutorial.currentStep === 1 && tooltipDismissed) {
      console.log('[Besties Tutorial] Safety reset: Tutorial is active but tooltip is dismissed, resetting...');
      // Reset tooltip dismissed state when tutorial starts
      setTooltipDismissed(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('besties_tooltip_dismissed');
        window.dispatchEvent(new CustomEvent('besties_tooltip_dismissed_changed', {
          detail: { dismissed: false }
        }));
      }
    }
  }, [tutorial.tutorialActive, tutorial.currentStep, tooltipDismissed]);

  // Create mock tutorial posts when tutorial becomes active
  useEffect(() => {
    if (tutorial.tutorialActive && tutorial.currentStep === 1) {
      // Create informative mock posts from Demo Bestie explaining the besties page
      // Structure must match what ActivityFeed expects (with postData wrapper)
      const mockPosts = [
        {
          id: 'mock-1',
          type: 'post',
          userId: 'demo-user',
          userName: 'Demo Bestie',
          userPhoto: null,
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          isMockTutorial: true,
          postData: {
            text: "Hey bestie! 💜 Welcome to your Besties page! This is your private social space where you'll see check-ins and posts from your besties. This activity feed shows everything your besties share - it's like a private timeline just for your safety network!",
            photoURL: null,
            isSupportRequest: false,
            commentCount: 0,
            reactionCounts: {}
          }
        },
        {
          id: 'mock-2',
          type: 'post',
          userId: 'demo-user',
          userName: 'Demo Bestie',
          userPhoto: null,
          timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
          isMockTutorial: true,
          postData: {
            text: "You'll see check-ins here when your besties create them - like when they're on a date, taking a rideshare, or walking alone. If they don't check in on time, you'll get an alert so you can make sure they're safe! 🛡️",
            photoURL: null,
            isSupportRequest: false,
            commentCount: 0,
            reactionCounts: {}
          }
        },
        {
          id: 'mock-3',
          type: 'post',
          userId: 'demo-user',
          userName: 'Demo Bestie',
          userPhoto: null,
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          isMockTutorial: true,
          postData: {
            text: "You can also share posts here - updates, photos, or just how you're feeling! Everything is private and only visible to your besties. Scroll down to see all your besties and their connection info. When you're ready, click the Profile button below to continue learning about the app! 💜",
            photoURL: null,
            isSupportRequest: false,
            commentCount: 0,
            reactionCounts: {}
          }
        }
      ];
      setMockTutorialPosts(mockPosts);
    } else {
      // Clear mock posts when tutorial is not active
      setMockTutorialPosts([]);
    }
  }, [tutorial.tutorialActive, tutorial.currentStep]);

  // Auto-start tutorial when coming from check-in tutorial
  useEffect(() => {
    if (location.state?.startTutorial && !tutorial.isLoading && !tutorial.isCompleted && !tutorial.tutorialActive) {
      tutorial.startTutorial();
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tutorial]);
  
  // Refs for highlighted elements
  const activityFeedRef = useRef(null);
  const postButtonRef = useRef(null);
  const bestiesGridRef = useRef(null);
  const [showCelebration, setShowCelebration] = useState(false);

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

      // Also load featuredCircle from user document to sync circle status
      const userDocRef = doc(db, 'users', currentUser.uid);
      getDoc(userDocRef).then((userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFeaturedCircle(userData.featuredCircle || []);
        }
      }).catch((error) => {
        console.error('Error loading featuredCircle:', error);
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

      // If neither has recent activity, circle members first (check featuredCircle, not just isFavorite)
      const aInCircle = featuredCircle.includes(a.userId);
      const bInCircle = featuredCircle.includes(b.userId);
      if (aInCircle && !bInCircle) return -1;
      if (!aInCircle && bInCircle) return 1;
      
      // Then favorites (for backward compatibility)
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
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-text-secondary">Loading your besties... 👯‍♀️</p>
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

        {/* Pending Requests */}
        <PendingRequestsList pendingRequests={pendingRequests} />

        {/* PROMINENT Needs Attention Section - Top when active */}
        <NeedsAttentionSection
          missedCheckIns={missedCheckIns}
          requestsForAttention={requestsForAttention}
          besties={besties}
        />

        {/* Activity Feed - Moved to top */}
        <div ref={activityFeedRef} className="mb-6">
          {/* Circle Check-In Card */}
          <CircleCheckInCard />

          {/* Activity Feed Header with Create Post Button */}
          <div className="flex items-center justify-between mb-4 mt-6">
            <h2 className="text-lg md:text-xl font-display text-text-primary">
              📰 Activity Feed
            </h2>
            <button
              ref={postButtonRef}
              onClick={() => {
                setShowCreatePostModal(true);
              }}
              className="btn btn-primary px-4 py-2 text-sm font-semibold"
              aria-label="Create a new post"
            >
              ✍️ Post
            </button>
          </div>

          {/* Activity Feed */}
          {!activityLoading && (
            <ActivityFeed
              activityFeed={
                tutorial.tutorialActive && tutorial.currentStep === 1
                  ? [...mockTutorialPosts, ...activityFeed.filter(activity => {
                      // Filter out activities that are already shown in Needs Attention section
                      const isInMissedCheckIns = missedCheckIns.some(m => 
                        m.userId === activity.userId && activity.status === 'alerted'
                      );
                      const isInAttentionRequests = requestsForAttention.some(r => 
                        r.userId === activity.userId && activity.type === 'checkin'
                      );
                      return !isInMissedCheckIns && !isInAttentionRequests;
                    })]
                  : activityFeed.filter(activity => {
                      const isInMissedCheckIns = missedCheckIns.some(m => 
                        m.userId === activity.userId && activity.status === 'alerted'
                      );
                      const isInAttentionRequests = requestsForAttention.some(r => 
                        r.userId === activity.userId && activity.type === 'checkin'
                      );
                      return !isInMissedCheckIns && !isInAttentionRequests;
                    })
              }
              reactions={reactions}
              addReaction={addReaction}
              setSelectedCheckIn={setSelectedCheckIn}
              setShowComments={setShowComments}
              getTimeAgo={getTimeAgo}
              initialPostId={selectedPostId}
            />
          )}
        </div>

        {/* Besties Section */}
        <div className="space-y-6">
          {/* Besties Grid */}
          <div ref={bestiesGridRef}>
            <BestiesGrid
              featuredCircle={featuredCircle}
              besties={filteredBesties}
              activityFeed={activityFeed}
            />
          </div>
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

      {/* Floating Action Button - Add Bestie */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-pink-500 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center text-3xl md:text-4xl font-bold animate-pulse-slow hover:animate-none"
        title="Add a bestie"
      >
        <span className="drop-shadow-lg">+</span>
      </button>

      {/* Add Bestie Modal */}
      {showAddModal && (
        <AddBestieModal 
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => {
            setShowCreatePostModal(false);
          }}
          onPostCreated={() => {
            setShowCreatePostModal(false);
            // Note: Activity feed will update automatically via useActivityFeed hook
          }}
        />
      )}

      {/* Tutorial Welcome Card */}
      {!tutorial.isLoading && !tutorial.isCompleted && !tutorial.tutorialActive && !location.state?.fromNotification && (
        <BestiesTutorialWelcome
          onStart={() => {
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_started', { page: 'besties' });
            }
            tutorial.startTutorial();
          }}
          onSkip={() => {
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_skipped', { page: 'besties', at_step: 0 });
            }
            tutorial.skipTutorial();
          }}
        />
      )}

      {/* Tutorial Overlay */}
      {(() => {
        const shouldRender = tutorial.tutorialActive && tutorial.currentStep === 1 && !tooltipDismissed;
        console.log('[Besties Tutorial] Overlay render check:', {
          tutorialActive: tutorial.tutorialActive,
          currentStep: tutorial.currentStep,
          tooltipDismissed,
          shouldRender
        });
        return shouldRender;
      })() && (
        <BestiesTutorialOverlay
          currentStep={tutorial.currentStep}
          onNext={() => {
            // User clicked "Got it" - dismiss tooltip but keep tutorial active
            // This will make Profile button appear and flash
            setTooltipDismissed(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('besties_tooltip_dismissed', 'true');
              // Dispatch custom event to notify MobileBottomNav
              window.dispatchEvent(new CustomEvent('besties_tooltip_dismissed_changed', {
                detail: { dismissed: true }
              }));
            }
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_step_completed', {
                page: 'besties',
                step: 1,
                action: 'got_it'
              });
            }
          }}
          onBack={() => {
            // No back button for single step
          }}
          onSkip={() => {
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_skipped', {
                page: 'besties',
                at_step: tutorial.currentStep
              });
            }
            tutorial.skipTutorial();
          }}
          isPaused={tutorial.isPaused}
          activityFeedLength={
            tutorial.tutorialActive && tutorial.currentStep === 1
              ? activityFeed.length + mockTutorialPosts.length
              : activityFeed.length
          }
          refs={{
            activityFeed: activityFeedRef,
            postButton: postButtonRef,
            bestiesGrid: bestiesGridRef
          }}
        />
      )}

      {/* Celebration Toast with Confetti */}
      {showCelebration && (
        <CelebrationToast
          message="You're all set! Enjoy your Besties space 💜"
          icon="🎉"
          duration={4000}
          showConfetti={true}
          onComplete={() => setShowCelebration(false)}
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
