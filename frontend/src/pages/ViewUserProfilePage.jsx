import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Header from '../components/Header';

const ViewUserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
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
      // Check if they're a bestie
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

      setUser({ id: userDoc.id, ...userDoc.data() });

      // Load badges (public)
      const badgesDoc = await getDoc(doc(db, 'badges', userId));
      if (badgesDoc.exists()) {
        setBadges(badgesDoc.data().badges || []);
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

  const featuredBadges = badges.slice(0, 3);

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Profile Header */}
        <div className="card p-6 mb-6 text-center">
          <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-display overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] || 'U'
            )}
          </div>

          <h1 className="text-3xl font-display text-text-primary mb-2">
            {user?.displayName || 'User'}
          </h1>

          <p className="text-text-secondary mb-2">{user?.email}</p>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            <span>💜</span>
            <span>Your Bestie</span>
          </div>

          {user?.profile?.bio && (
            <p className="text-text-secondary italic max-w-md mx-auto mt-4">
              "{user.profile.bio}"
            </p>
          )}
        </div>

        {/* Featured Badges */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">Badges</h2>

          {featuredBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredBadges.map((badge, index) => (
                <div key={index} className="card p-4 text-center">
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
              <p className="text-text-secondary">No badges earned yet</p>
            </div>
          )}

          {badges.length > 3 && (
            <p className="text-center text-text-secondary text-sm mt-3">
              + {badges.length - 3} more badges
            </p>
          )}
        </div>

        {/* Public Stats - NOT shown (stats are private) */}
        <div className="card p-6 mb-6 bg-gray-50 text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-text-secondary">
            Stats are private
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/besties')}
          className="w-full btn btn-secondary"
        >
          ← Back to Besties
        </button>
      </div>
    </div>
  );
};

export default ViewUserProfilePage;
