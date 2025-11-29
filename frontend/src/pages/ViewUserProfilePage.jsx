import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import CountUp from '../components/CountUp';
import toast from 'react-hot-toast';

const ViewUserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [alertedCheckIns, setAlertedCheckIns] = useState([]);
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

      // Load alerted check-ins where current user is a selected bestie
      const alertedCheckInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', userId),
        where('bestieIds', 'array-contains', currentUser.uid),
        where('status', '==', 'alerted')
      );
      const alertedSnapshot = await getDocs(alertedCheckInsQuery);
      const alertedData = alertedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlertedCheckIns(alertedData);

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
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pattern">
        <div className="max-w-4xl mx-auto p-4 pb-20">
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">{error}</h2>
            <p className="text-text-secondary mb-6">
              You can only view profiles of your accepted besties
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

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        {/* Alerted Check-Ins - URGENT! */}
        {alertedCheckIns.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display text-text-primary">⚠️ Urgent Alert</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                {alertedCheckIns.length}
              </span>
            </div>
            {alertedCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="card p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🚨</div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-red-900 dark:text-red-100 mb-2">
                      {user?.displayName} Missed Check-In!
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

        {/* Profile Header - ENHANCED */}
        <div
          className={`card p-8 mb-6 text-center relative overflow-hidden shadow-2xl profile-card-aura-${user?.profile?.aura || 'none'}`}
          style={{ background: user?.profile?.backgroundGradient || 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #ddd6fe 100%)' }}
        >
          {/* Floating decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-6 left-6 text-3xl animate-float opacity-40">💖</div>
            <div className="absolute top-10 right-8 text-2xl animate-float delay-1s opacity-40">✨</div>
            <div className="absolute bottom-10 left-10 text-2xl animate-float delay-2s opacity-40">🌸</div>
            <div className="absolute bottom-6 right-6 text-3xl animate-float delay-3s opacity-40">💫</div>
          </div>

          <div className="relative z-10">
            <div className="w-36 h-36 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl font-display overflow-hidden border-4 border-white shadow-2xl ring-4 ring-purple-200">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0] || 'U'
              )}
            </div>

            <h1 className="text-4xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {user?.displayName || 'User'}
            </h1>

            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-primary rounded-full text-sm font-semibold shadow-lg">
                <span>💜</span>
                <span>Your Bestie</span>
              </div>
              {user?.requestAttention?.active && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-semibold shadow-lg animate-pulse">
                  <span>💬</span>
                  <span>{user.requestAttention.tag}</span>
                </div>
              )}
            </div>

            {user?.profile?.bio && (
              <p className="text-gray-800 italic max-w-md mx-auto mt-4 text-lg">
                "{user.profile.bio}"
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
              <button
                onClick={() => {
                  const phone = user?.phoneNumber || user?.phone;
                  if (phone) {
                    window.location.href = `sms:${phone}`;
                  } else {
                    toast.error('No phone number available');
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-full transition-all shadow-lg hover:scale-105 flex items-center gap-2"
              >
                <span>💬</span>
                <span>Send Message</span>
              </button>
              <button
                onClick={() => {
                  const phone = user?.phoneNumber || user?.phone;
                  if (phone) {
                    window.location.href = `tel:${phone}`;
                  } else {
                    toast.error('No phone number available');
                  }
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-full transition-all shadow-lg hover:scale-105 flex items-center gap-2"
              >
                <span>📞</span>
                <span>Call</span>
              </button>
            </div>
          </div>
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

      {/* Aura Animations CSS */}
      <style>{`
        /* Aura Animations */
        @keyframes aura-shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes aura-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(219, 39, 119, 0.3), 0 0 40px rgba(139, 92, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(219, 39, 119, 0.5), 0 0 80px rgba(139, 92, 246, 0.4);
          }
        }
        @keyframes aura-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes rainbow-border {
          0% { border-color: #ff0000; }
          16% { border-color: #ff7f00; }
          33% { border-color: #ffff00; }
          50% { border-color: #00ff00; }
          66% { border-color: #0000ff; }
          83% { border-color: #8b00ff; }
          100% { border-color: #ff0000; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Aura Classes */
        .profile-card-aura-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 3s infinite;
          pointer-events: none;
          z-index: 1;
        }

        .profile-card-aura-glow {
          animation: aura-glow 3s ease-in-out infinite;
        }

        .profile-card-aura-pulse {
          animation: aura-pulse 2s ease-in-out infinite;
        }

        .profile-card-aura-rainbow {
          border: 4px solid;
          animation: rainbow-border 6s linear infinite;
        }

        .profile-card-aura-sparkle::after {
          content: '✨';
          position: absolute;
          top: 10%;
          right: 10%;
          font-size: 2rem;
          animation: sparkle 2s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default ViewUserProfilePage;
