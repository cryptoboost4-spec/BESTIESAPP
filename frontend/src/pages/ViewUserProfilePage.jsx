import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Header from '../components/Header';
import CountUp from '../components/CountUp';

const ViewUserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setIsBestie] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUser]);

  const loadUserProfile = async () => {
    if (!userId || !currentUser) return;

    // Can't view your own profile this way, redirect to /profile
    if (userId === currentUser.uid) {
      navigate('/profile');
      return;
    }

    try {
      // Check if they're a bestie (bidirectional check)
      // We check both directions because a bestie relationship in Firestore can be stored
      // with either user as requester or recipient. A relationship exists if found in either direction.
      const [requesterQuery, recipientQuery] = await Promise.all([
        getDocs(
          query(
            collection(db, 'besties'),
            where('requesterId', '==', currentUser.uid),
            where('recipientId', '==', userId),
            where('status', '==', 'accepted')
          )
        ),
        getDocs(
          query(
            collection(db, 'besties'),
            where('requesterId', '==', userId),
            where('recipientId', '==', currentUser.uid),
            where('status', '==', 'accepted')
          )
        ),
      ]);

      const isUserBestie = !requesterQuery.empty || !recipientQuery.empty;
      setIsBestie(isUserBestie);

      if (!isUserBestie) {
        setError('Only besties can view profiles');
        setLoading(false);
        return;
      }

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const userData = { id: userDoc.id, ...userDoc.data() };
      setUser(userData);

      // Load badges (public)
      const badgesDoc = await getDoc(doc(db, 'badges', userId));
      if (badgesDoc.exists()) {
        setBadges(badgesDoc.data().badges || []);
      }

      // Load recent check-ins if privacy allows (last 7 days)
      const showCheckIns = userData?.privacySettings?.showCheckInsToBesties !== false; // default true
      if (showCheckIns) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const checkInsQuery = query(
          collection(db, 'checkins'),
          where('userId', '==', userId),
          where('createdAt', '>=', sevenDaysAgo),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const checkInsSnapshot = await getDocs(checkInsQuery);
        const checkInsData = checkInsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentCheckIns(checkInsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load profile');
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="max-w-4xl mx-auto p-4 pb-20">
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">{error}</h2>
            <p className="text-text-secondary mb-6">
              You can only view profiles of people in your Bestie Circle
            </p>
            <button onClick={() => navigate('/besties')} className="btn btn-primary">
              Manage Besties
            </button>
          </div>
        </div>
      </div>
    );
  }

  const featuredBadges = user?.featuredBadges
    ? badges.filter(b => user.featuredBadges.includes(b.id)).slice(0, 3)
    : badges.slice(0, 3);

  const showStats = user?.privacySettings?.showStatsToBesties !== false; // default true
  const showCheckIns = user?.privacySettings?.showCheckInsToBesties !== false; // default true

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        {/* Profile Header */}
        <div
          className="card p-6 mb-6 text-center relative overflow-hidden"
          style={{ background: user?.profile?.backgroundGradient || 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' }}
        >
          <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl font-display overflow-hidden border-4 border-white shadow-xl">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] || 'U'
            )}
          </div>

          <h1 className="text-3xl font-display text-gray-800 mb-2">
            {user?.displayName || 'User'}
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm text-primary rounded-full text-sm font-semibold mb-2 shadow-sm">
            <span>💜</span>
            <span>Your Bestie</span>
          </div>

          {user?.profile?.bio && (
            <p className="text-gray-700 italic max-w-md mx-auto mt-4">
              "{user.profile.bio}"
            </p>
          )}
        </div>

        {/* Stats Section - Visible to Besties */}
        {showStats ? (
          <div className="card p-6 mb-6">
            <h2 className="text-2xl font-display text-text-primary mb-4">Stats</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Completed Check-ins */}
              <div className="text-center p-5 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl">
                <div className="text-4xl font-display text-pink-700 mb-1">
                  <CountUp end={user?.stats?.completedCheckIns || 0} duration={1500} />
                </div>
                <div className="text-sm text-gray-700 font-semibold">Completed Check-ins</div>
              </div>

              {/* Total Check-ins */}
              <div className="text-center p-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <div className="text-4xl font-display text-blue-700 mb-1">
                  <CountUp end={user?.stats?.totalCheckIns || 0} duration={1500} />
                </div>
                <div className="text-sm text-gray-700 font-semibold">Total Check-ins</div>
              </div>

              {/* Total Besties */}
              <div className="text-center p-5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <div className="text-4xl font-display text-purple-700 mb-1">
                  <CountUp end={user?.stats?.totalBesties || 0} duration={1500} />
                </div>
                <div className="text-sm text-gray-700 font-semibold">Total Besties</div>
              </div>

              {/* Badges Earned */}
              <div className="text-center p-5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                <div className="text-4xl font-display text-yellow-700 mb-1">
                  <CountUp end={badges.length} duration={1500} />
                </div>
                <div className="text-sm text-gray-700 font-semibold">Badges Earned</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-gray-50 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-text-secondary">
              Stats are private
            </p>
          </div>
        )}

        {/* Recent Check-Ins (Last 7 Days) */}
        {showCheckIns ? (
          <div className="mb-6">
            <h2 className="text-2xl font-display text-text-primary mb-4">
              Recent Check-ins (Last 7 Days)
            </h2>

            {recentCheckIns.length > 0 ? (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{checkIn.activity?.emoji || '📍'}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                          {checkIn.activity?.name || checkIn.activityName || 'Check-in'}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {checkIn.createdAt?.toDate().toLocaleDateString()} at{' '}
                          {checkIn.createdAt?.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {checkIn.location?.address && (
                          <p className="text-sm text-text-secondary mt-1">
                            📍 {checkIn.location.address}
                          </p>
                        )}
                        {checkIn.duration && (
                          <p className="text-sm text-text-secondary">
                            ⏱️ {checkIn.duration} minutes
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        checkIn.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : checkIn.status === 'alerted'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {checkIn.status === 'completed' && '✓ Safe'}
                        {checkIn.status === 'alerted' && '⚠️ Alert Sent'}
                        {checkIn.status === 'active' && '🔔 Active'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-text-secondary">No check-ins in the last 7 days</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-gray-50 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-text-secondary">
              Check-in history is private
            </p>
          </div>
        )}

        {/* Featured Badges */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">Featured Badges</h2>

          {featuredBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredBadges.map((badge, index) => (
                <div key={index} className="card p-4 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                  <div className="font-semibold text-sm text-text-primary">
                    {badge.name || badge}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-text-secondary">No featured badges</p>
            </div>
          )}

          {badges.length > 3 && (
            <p className="text-center text-text-secondary text-sm mt-3">
              + {badges.length - 3} more badges
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/besties')}
            className="w-full btn btn-secondary"
          >
            ← Back to Besties
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserProfilePage;
