import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import BestieCircle from '../components/BestieCircle';
import SocialShareCardsModal from '../components/SocialShareCardsModal';

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Close photo menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPhotoMenu && !e.target.closest('.photo-menu-container')) {
        setShowPhotoMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPhotoMenu]);

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL,
      });

      toast.success('Profile picture updated!');
      setShowPhotoMenu(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: currentUser?.photoURL || null, // Fallback to auth provider photo
      });

      toast.success('Profile picture removed');
      setShowPhotoMenu(false);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
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
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Profile Header */}
        <div className="card p-6 mb-6 text-center">
          <div className="relative inline-block photo-menu-container">
            <button
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-4xl font-display overflow-hidden hover:opacity-90 transition-opacity"
            >
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userData?.displayName?.[0] || currentUser?.email?.[0] || 'U'
              )}
            </button>

            {/* Photo Management Menu */}
            {showPhotoMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-30 w-48">
                <div className="text-xs font-semibold text-gray-500 px-3 py-1">Manage</div>
                <button
                  onClick={() => navigate(`/user/${currentUser.uid}`)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                >
                  👤 View Profile
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPhotoMenu(false);
                  }}
                  disabled={uploading}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                >
                  🔄 Replace
                </button>
                <button
                  onClick={handleRemovePhoto}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm font-semibold text-red-600"
                >
                  ❌ Remove
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="mt-4"></div>
          
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
        <SocialShareCardsModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

export default ProfilePage;
