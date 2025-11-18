import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import BestieCircle from '../components/BestieCircle';
import ShareProfileModal from '../components/ShareProfileModal';

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadBadges = async () => {
    if (!currentUser) return;

    try {
      const badgesDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgesDoc.exists()) {
        setBadges(badgesDoc.data().badges || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading badges:', error);
      setLoading(false);
    }
  };

  const featuredBadges = badges.slice(0, 3);

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

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Profile Header */}
        <div className="card p-6 mb-6 text-center">
          <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-display overflow-hidden">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userData?.displayName?.[0] || currentUser?.email?.[0] || 'U'
            )}
          </div>
          
          <h1 className="text-3xl font-display text-text-primary mb-2">
            {userData?.displayName || 'User'}
          </h1>
          
          <p className="text-text-secondary mb-4">{currentUser?.email}</p>

          {userData?.profile?.bio && (
            <p className="text-text-secondary italic max-w-md mx-auto mb-4">
              "{userData.profile.bio}"
            </p>
          )}

          <button
            onClick={() => navigate('/edit-profile')}
            className="btn btn-secondary mb-2"
          >
            ✏️ Edit Profile
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="btn bg-gradient-primary text-white"
          >
            📤 Share Profile
          </button>
        </div>

        {/* Bestie Circle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display text-text-primary">Your Bestie Circle</h2>
            <button
              onClick={() => navigate('/besties')}
              className="text-primary font-semibold hover:underline"
            >
              Manage →
            </button>
          </div>
          <BestieCircle userId={currentUser?.uid} onAddClick={() => navigate('/besties')} />
        </div>

        {/* Featured Badges */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display text-text-primary">Badges</h2>
            <button
              onClick={() => navigate('/badges')}
              className="text-primary font-semibold hover:underline"
            >
              View All →
            </button>
          </div>
          
          {featuredBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredBadges.map((badge) => (
                <div key={badge.id} className="card p-4 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-sm text-text-primary">{badge.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-text-secondary">
                Complete check-ins and add besties to earn badges!
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="card p-6 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">Your Stats</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-xl">
              <div className="text-3xl font-display text-primary mb-1">
                {userData?.stats?.completedCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary">Completed Check-ins</div>
            </div>

            <div className="text-center p-4 bg-secondary/5 rounded-xl">
              <div className="text-3xl font-display text-secondary mb-1">
                {userData?.stats?.totalBesties || 0}
              </div>
              <div className="text-sm text-text-secondary">Total Besties</div>
            </div>

            <div className="text-center p-4 bg-success/5 rounded-xl">
              <div className="text-3xl font-display text-success mb-1">
                {badges.length}
              </div>
              <div className="text-sm text-text-secondary">Badges Earned</div>
            </div>

            <div className="text-center p-4 bg-accent/5 rounded-xl">
              <div className="text-3xl font-display text-primary mb-1">
                {userData?.stats?.totalCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary">Total Check-ins</div>
            </div>
          </div>
        </div>

        {/* Donation Status */}
        {userData?.donationStats?.isActive && (
          <div className="card p-6 mb-6 bg-gradient-primary text-white">
            <h3 className="font-display text-xl mb-2">💜 Thank You!</h3>
            <p className="mb-2">
              You're helping keep Besties free for everyone
            </p>
            <div className="text-2xl font-display">
              ${userData.donationStats.totalDonated} donated
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
        <ShareProfileModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

export default ProfilePage;
