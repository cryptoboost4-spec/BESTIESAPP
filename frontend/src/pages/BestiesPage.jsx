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
import Header from '../components/Header';
import BestieCard from '../components/BestieCard';
import AddBestieModal from '../components/AddBestieModal';
import BestieRequestCard from '../components/BestieRequestCard';
import toast from 'react-hot-toast';

const BestiesPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Activity feed state
  const [activityFeed, setActivityFeed] = useState([]);
  const [missedCheckIns, setMissedCheckIns] = useState([]);
  const [requestsForAttention, setRequestsForAttention] = useState([]);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('all');

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

  // Load activity feed - only when page is visible
  useEffect(() => {
    if (!currentUser || besties.length === 0) return;

    const loadActivityFeed = async () => {
      // Only load if page is visible
      if (document.hidden) return;

      const activities = [];
      const missed = [];
      const attentionRequests = [];

      // Get bestie user IDs (deduplicated to avoid showing duplicates for mutual besties)
      const bestieIds = [...new Set(besties.map(b => b.userId))];

      // Load recent check-ins (last 48 hours)
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

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

      setActivityFeed(activities);
      setMissedCheckIns(missed);
      setRequestsForAttention(attentionRequests);
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
  }, [currentUser, besties]);

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

    switch (activeFilter) {
      case 'circle':
        filtered = filtered.filter(b => b.isFavorite);
        break;
      case 'active':
        // Filter besties with check-ins in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        filtered = filtered.filter(b =>
          activityFeed.some(a => a.userId === b.userId && a.timestamp > oneHourAgo && a.status === 'active')
        );
        break;
      default:
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
    }

    return filtered;
  };

  // const rankings = getPowerRankings(); // TODO: Implement rankings when metrics are available
  const filteredBesties = getFilteredBesties();
  const hasAlerts = missedCheckIns.length > 0 || requestsForAttention.length > 0;

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
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-6xl mx-auto p-4 pb-32 md:pb-6">
        {/* Mobile Header - Simplified */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-display text-gradient mb-2">💜 Your Besties</h1>
          <p className="text-sm md:text-base text-text-secondary">Your safety squad activity hub</p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
              🔔 Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <BestieRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* PROMINENT Needs Attention Section - Top when active */}
        {hasAlerts && (
          <div className="mb-6 animate-pulse-slow">
            <h2 className="text-lg md:text-xl font-display text-red-600 mb-3 flex items-center gap-2">
              <span className="animate-ping inline-block w-3 h-3 bg-red-600 rounded-full"></span>
              ⚠️ NEEDS ATTENTION
            </h2>

            {/* Missed Check-ins */}
            {missedCheckIns.length > 0 && (
              <div className="space-y-3 mb-4">
                {missedCheckIns.map((missed) => (
                  <div key={missed.id} className="card p-4 bg-red-50 border-2 border-red-400 animate-pulse-slow">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="text-3xl flex-shrink-0">🚨</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-red-900 text-sm md:text-base">
                          {missed.userName} missed a check-in
                        </h3>
                        <p className="text-xs md:text-sm text-red-700 break-words">
                          {missed.checkInData.activity?.name || 'Check-in'} • {
                            new Date(missed.timestamp).toLocaleString()
                          }
                        </p>
                        {missed.checkInData.location?.address && (
                          <p className="text-xs md:text-sm text-red-600 mt-1 break-words">
                            📍 {missed.checkInData.location.address}
                          </p>
                        )}
                      </div>
                      <button
                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto flex-shrink-0"
                        onClick={() => window.location.href = `tel:${besties.find(b => b.userId === missed.userId)?.phone}`}
                      >
                        Call Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Request Attention */}
            {requestsForAttention.length > 0 && (
              <div className="space-y-3">
                {requestsForAttention.map((request) => (
                  <div key={request.userId} className="card p-4 bg-purple-50 border-2 border-purple-300 animate-pulse-slow">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="text-3xl flex-shrink-0">💜</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-purple-900 text-sm md:text-base">
                          {request.userName} needs support
                        </h3>
                        <div className="inline-block px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs md:text-sm font-semibold my-2">
                          {request.tag}
                        </div>
                        {request.note && (
                          <p className="text-xs md:text-sm text-purple-700 italic break-words">"{request.note}"</p>
                        )}
                        <p className="text-xs text-purple-600 mt-2">
                          {new Date(request.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="btn btn-sm btn-primary w-full sm:w-auto flex-shrink-0"
                        onClick={() => {
                          const bestie = besties.find(b => b.userId === request.userId);
                          if (bestie?.phone) {
                            window.location.href = `sms:${bestie.phone}`;
                          }
                        }}
                      >
                        Reach Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile-First Layout - Stack on mobile, grid on desktop */}
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters - Horizontal Scroll on Mobile */}
            <div className="card p-3 md:p-4">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 md:px-4 py-2 rounded-full whitespace-nowrap font-semibold text-xs md:text-sm flex-shrink-0 ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Besties
                </button>
                <button
                  onClick={() => setActiveFilter('circle')}
                  className={`px-3 md:px-4 py-2 rounded-full whitespace-nowrap font-semibold text-xs md:text-sm flex-shrink-0 ${
                    activeFilter === 'circle'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💜 Circle
                </button>
                <button
                  onClick={() => setActiveFilter('active')}
                  className={`px-3 md:px-4 py-2 rounded-full whitespace-nowrap font-semibold text-xs md:text-sm flex-shrink-0 ${
                    activeFilter === 'active'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔔 Active
                </button>
              </div>
            </div>

            {/* Activity Feed */}
            <div>
              <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
                📰 Activity Feed
              </h2>

              {activityFeed.length === 0 ? (
                <div className="card p-6 md:p-8 text-center">
                  <div className="text-3xl md:text-4xl mb-2">🌟</div>
                  <p className="text-sm md:text-base text-text-secondary">No recent activity</p>
                  <p className="text-xs md:text-sm text-text-secondary mt-1">
                    Check-ins from your besties will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 15).map((activity) => (
                    <div key={activity.id} className="card p-3 md:p-4">
                      {activity.type === 'checkin' && (
                        <div>
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="text-2xl md:text-3xl flex-shrink-0">
                              {activity.checkInData.activity?.emoji || '📍'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                                <span className="text-primary">{activity.userName}</span>
                                {activity.status === 'completed' && ' completed check-in safely ✅'}
                                {activity.status === 'active' && ' is currently checked in 🔔'}
                                {activity.status === 'alerted' && ' MISSED check-in 🚨'}
                              </h3>
                              <p className="text-xs md:text-sm text-text-secondary">
                                {activity.checkInData.activity?.name || 'Check-in'} • {
                                  getTimeAgo(activity.timestamp)
                                }
                              </p>
                              {activity.checkInData.location?.address && (
                                <p className="text-xs md:text-sm text-text-secondary mt-1 break-words">
                                  📍 {activity.checkInData.location.address}
                                </p>
                              )}
                            </div>
                            <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                              activity.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : activity.status === 'alerted'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {activity.status === 'completed' && '✓'}
                              {activity.status === 'alerted' && '⚠️'}
                              {activity.status === 'active' && '🔔'}
                            </div>
                          </div>

                          {/* Reactions - Compact on Mobile */}
                          {activity.status !== 'alerted' && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <button
                                  onClick={() => addReaction(activity.id, '💜')}
                                  className="text-xl md:text-2xl hover:scale-110 transition-transform"
                                  title="Proud"
                                >
                                  💜
                                </button>
                                <button
                                  onClick={() => addReaction(activity.id, '😮‍💨')}
                                  className="text-xl md:text-2xl hover:scale-110 transition-transform"
                                  title="Relieved"
                                >
                                  😮‍💨
                                </button>
                                <button
                                  onClick={() => addReaction(activity.id, '🎉')}
                                  className="text-xl md:text-2xl hover:scale-110 transition-transform"
                                  title="Celebrate"
                                >
                                  🎉
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCheckIn(activity);
                                    setShowComments(true);
                                  }}
                                  className="ml-auto text-xs md:text-sm text-primary hover:underline font-semibold"
                                >
                                  💬 Comment
                                </button>
                              </div>
                              {/* Show reaction counts */}
                              {reactions[activity.id] && reactions[activity.id].length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  {/* Group reactions by emoji */}
                                  {Object.entries(
                                    reactions[activity.id].reduce((acc, r) => {
                                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                      return acc;
                                    }, {})
                                  ).map(([emoji, count]) => (
                                    <span key={emoji} className="bg-gray-100 px-2 py-1 rounded-full">
                                      {emoji} {count}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {activity.type === 'badge' && (
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="text-2xl md:text-3xl flex-shrink-0">{activity.badge.icon || '🏆'}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                              <span className="text-primary">{activity.userName}</span>
                              {' earned the '}<span className="text-yellow-600">{activity.badge.name}</span> badge! 🎉
                            </h3>
                            <p className="text-xs md:text-sm text-text-secondary">
                              {getTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={() => addReaction(activity.id, '🎉')}
                            className="text-xl md:text-2xl hover:scale-110 transition-transform flex-shrink-0"
                          >
                            🎉
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* This Week's Champions - SUPER GIRLY VERSION */}
            <div className="relative overflow-hidden">
              {/* Sparkly background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-4 left-4 text-yellow-300 animate-pulse text-2xl">✨</div>
                <div className="absolute top-8 right-6 text-pink-300 animate-pulse delay-1s text-xl">💫</div>
                <div className="absolute bottom-6 left-8 text-purple-300 animate-pulse delay-2s text-xl">⭐</div>
                <div className="absolute bottom-4 right-4 text-yellow-300 animate-pulse delay-3s text-2xl">✨</div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 border-4 border-pink-200 shadow-xl relative">
                {/* Cute header with crown */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-2 animate-bounce" style={{animationDuration: '2s'}}>👑</div>
                  <h2 className="text-2xl font-display bg-gradient-to-r from-pink-600 via-purple-600 to-yellow-600 bg-clip-text text-transparent mb-1">
                    This Week's Queens
                  </h2>
                  <p className="text-xs text-gray-600">The besties who absolutely slayed! 💅</p>
                </div>

                <div className="space-y-4">
                  {/* Most Reliable - Pink gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-pink-200 hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                            💖
                          </div>
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-base font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                            Most Reliable
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Always there! 💕</div>
                          <div className="text-xs text-center text-gray-400 italic py-1 bg-gray-50 rounded-lg mt-2">
                            Earning crowns... 👑✨
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fastest Responder - Purple gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-200 hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg animate-pulse">
                            ⚡
                          </div>
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-base font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Lightning Fast
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Instant replies! ⚡</div>
                          <div className="text-xs text-center text-gray-400 italic py-1 bg-gray-50 rounded-lg mt-2">
                            Collecting sparkles... ✨
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety Champion - Rose gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-rose-200 hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                            🛡️
                          </div>
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-base font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                            Safety Superstar
                          </div>
                          <div className="text-xs text-gray-600 mb-1">Check-in queen! 👑</div>
                          <div className="text-xs text-center text-gray-400 italic py-1 bg-gray-50 rounded-lg mt-2">
                            Building streaks... 🔥
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Streak Queen - Yellow gradient */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-yellow-200 hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                            🔥
                          </div>
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            🏆
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-base font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                            Streak Queen
                          </div>
                          <div className="text-xs text-gray-600 mb-1">On fire! 🔥</div>
                          <div className="text-xs text-center text-gray-400 italic py-1 bg-gray-50 rounded-lg mt-2">
                            Tracking victories... 💪
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cute footer */}
                <div className="mt-6 pt-4 border-t-2 border-pink-200 text-center">
                  <p className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    🎯 Resets every Monday • Keep slaying, queens! 👑
                  </p>
                </div>
              </div>
            </div>

            {/* Besties Grid */}
            <div>
              <h2 className="text-lg md:text-xl font-display text-text-primary mb-3 md:mb-4">
                {activeFilter === 'circle' && '💜 Bestie Circle'}
                {activeFilter === 'all' && 'All Besties'}
                {activeFilter === 'active' && '🔔 Active Now'}
              </h2>

              {filteredBesties.length === 0 ? (
                <div className="card p-6 md:p-8 text-center">
                  <div className="text-3xl md:text-4xl mb-2">💜</div>
                  <p className="text-sm md:text-base text-text-secondary">No besties in this filter</p>
                  {activeFilter === 'circle' && (
                    <p className="text-xs md:text-sm text-text-secondary mt-2">
                      Add besties to your circle by favoriting them
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredBesties.map((bestie) => {
                    const indicators = getBestieIndicators(bestie);
                    return (
                      <div key={bestie.id} className="relative group">
                        {/* Main card with hover effect */}
                        <div className="h-full">
                          <BestieCard bestie={bestie} />
                        </div>

                        {/* Visual Indicators - Top Left */}
                        {indicators.length > 0 && (
                          <div className="absolute top-3 left-3 flex gap-1 z-10">
                            {indicators.map((indicator, idx) => (
                              <span
                                key={idx}
                                className="text-base bg-white rounded-full p-1.5 shadow-md border border-purple-200"
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
                              className="w-full bg-white hover:bg-purple-50 text-purple-900 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
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
        </div>

        {/* Empty State */}
        {besties.length === 0 && pendingRequests.length === 0 && (
          <div className="card p-8 md:p-12 text-center">
            <div className="text-5xl md:text-6xl mb-4">💜</div>
            <h2 className="text-xl md:text-2xl font-display text-text-primary mb-2">
              No besties yet!
            </h2>
            <p className="text-sm md:text-base text-text-secondary mb-6">
              Add friends who'll have your back when you need them
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Add Your First Bestie
            </button>
          </div>
        )}
      </div>

      {/* Comments Modal - Mobile Optimized */}
      {showComments && selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full max-h-[80vh] md:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-display text-text-primary">
                  💬 Comments
                </h2>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setSelectedCheckIn(null);
                    setComments([]);
                    setNewComment('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {selectedCheckIn.userName}'s check-in
              </p>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-text-secondary text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {comment.userPhoto ? (
                        <img
                          src={comment.userPhoto}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-display">
                          {comment.userName?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-2xl px-3 py-2">
                        <p className="font-semibold text-sm text-text-primary">
                          {comment.userName}
                        </p>
                        <p className="text-sm text-text-primary break-words">
                          {comment.text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-3">
                        {comment.timestamp?.toDate ? getTimeAgo(comment.timestamp.toDate()) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <div className="p-4 md:p-6 border-t border-gray-200 flex-shrink-0">
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
                  className="flex-1 px-4 py-2 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none text-sm"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
