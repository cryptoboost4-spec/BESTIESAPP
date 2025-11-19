import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import BestieCircle from '../components/BestieCircle';
import SocialShareCardsModal from '../components/SocialShareCardsModal';
import CountUp from '../components/CountUp';
import ConfettiCelebration from '../components/ConfettiCelebration';

const GRADIENT_OPTIONS = [
  { id: 'pink', name: 'Pink Dream', gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' },
  { id: 'purple', name: 'Purple Magic', gradient: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)' },
  { id: 'blue', name: 'Ocean Blue', gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
  { id: 'green', name: 'Fresh Green', gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
  { id: 'sunset', name: 'Sunset Glow', gradient: 'linear-gradient(135deg, #fed7aa 0%, #fca5a5 100%)' },
  { id: 'lavender', name: 'Lavender Fields', gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' },
  { id: 'peach', name: 'Peachy Keen', gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
  { id: 'mint', name: 'Mint Fresh', gradient: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)' }
];

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [featuredBadgeIds, setFeaturedBadgeIds] = useState([]);
  const [bestiesCount, setBestiesCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPhotoMenu && !e.target.closest('.photo-menu-container')) {
        setShowPhotoMenu(false);
      }
      if (showColorPicker && !e.target.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPhotoMenu, showColorPicker]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      // Load badges
      const badgesDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgesDoc.exists()) {
        const badgesData = badgesDoc.data().badges || [];
        setBadges(badgesData);
      }

      // Load featured badge preferences
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFeaturedBadgeIds(data.featuredBadges || []);
      }

      // Load besties count
      const bestiesQuery = query(
        collection(db, 'besties'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );
      const bestiesSnapshot = await getDocs(bestiesQuery);
      setBestiesCount(bestiesSnapshot.size);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

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
        photoURL: currentUser?.photoURL || null,
      });

      toast.success('Profile picture removed');
      setShowPhotoMenu(false);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  };

  const handleColorChange = async (gradient) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.backgroundGradient': gradient.gradient,
      });
      toast.success(`Background changed to ${gradient.name}!`);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Error updating background:', error);
      toast.error('Failed to update background');
    }
  };

  const handleToggleFeaturedBadge = async (badgeId) => {
    let newFeaturedBadges = [...featuredBadgeIds];

    if (newFeaturedBadges.includes(badgeId)) {
      newFeaturedBadges = newFeaturedBadges.filter(id => id !== badgeId);
    } else {
      if (newFeaturedBadges.length >= 3) {
        toast.error('You can only feature up to 3 badges');
        return;
      }
      newFeaturedBadges.push(badgeId);
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        featuredBadges: newFeaturedBadges,
      });
      setFeaturedBadgeIds(newFeaturedBadges);
      toast.success('Featured badges updated!');
    } catch (error) {
      console.error('Error updating featured badges:', error);
      toast.error('Failed to update badges');
    }
  };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const tasks = [];
    let completed = 0;

    // Email (usually from auth)
    if (currentUser?.email) {
      tasks.push({ name: 'Add email', completed: true });
      completed++;
    } else {
      tasks.push({ name: 'Add email', completed: false });
    }

    // Phone number
    if (userData?.phoneNumber) {
      tasks.push({ name: 'Add phone number', completed: true });
      completed++;
    } else {
      tasks.push({ name: 'Add phone number', completed: false });
    }

    // Profile photo
    if (userData?.photoURL) {
      tasks.push({ name: 'Upload profile photo', completed: true });
      completed++;
    } else {
      tasks.push({ name: 'Upload profile photo', completed: false });
    }

    // Bio
    if (userData?.profile?.bio) {
      tasks.push({ name: 'Write a bio', completed: true });
      completed++;
    } else {
      tasks.push({ name: 'Write a bio', completed: false });
    }

    // Besties (at least 5)
    if (bestiesCount >= 5) {
      tasks.push({ name: 'Add 5 besties', completed: true });
      completed++;
    } else {
      tasks.push({ name: `Add 5 besties (${bestiesCount}/5)`, completed: false });
    }

    const percentage = (completed / tasks.length) * 100;
    return { tasks, percentage, completed, total: tasks.length };
  };

  // Get weekly summary
  const getWeeklySummary = () => {
    const checkIns = userData?.stats?.totalCheckIns || 0;
    const besties = userData?.stats?.totalBesties || 0;

    if (checkIns >= 7 && besties >= 3) {
      return {
        status: 'excellent',
        emoji: '🌟',
        message: 'You\'re absolutely crushing it this week!',
        tip: 'Keep up the amazing safety habits!'
      };
    } else if (checkIns >= 3 || besties >= 3) {
      return {
        status: 'good',
        emoji: '💪',
        message: 'You\'re doing great! Keep it up!',
        tip: 'Try to check in regularly and add more besties.'
      };
    } else {
      return {
        status: 'needsWork',
        emoji: '💜',
        message: 'Let\'s build your safety network!',
        tip: 'Start by adding your closest friends as besties.'
      };
    }
  };

  const profileCompletion = calculateProfileCompletion();
  const weeklySummary = getWeeklySummary();
  const currentGradient = userData?.profile?.backgroundGradient || GRADIENT_OPTIONS[0].gradient;
  const loginStreak = userData?.loginStreak || 0;
  const featuredBadges = badges.filter(b => featuredBadgeIds.includes(b.id)).slice(0, 3);

  // Get progress bar color
  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
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
      <ConfettiCelebration trigger={confettiTrigger} type="badge" />

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        {/* Enhanced Profile Header with Color Picker */}
        <div
          className="card p-6 mb-6 text-center relative overflow-hidden"
          style={{ background: currentGradient }}
        >
          {/* Color Picker Button */}
          <div className="absolute top-4 right-4 color-picker-container">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              title="Change background color"
            >
              🎨
            </button>

            {showColorPicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 z-30 w-64">
                <div className="text-sm font-semibold text-gray-700 mb-3">Choose Your Vibe</div>
                <div className="grid grid-cols-2 gap-3">
                  {GRADIENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleColorChange(option)}
                      className="h-16 rounded-lg shadow-md hover:scale-105 transition-transform border-2 border-transparent hover:border-primary"
                      style={{ background: option.gradient }}
                      title={option.name}
                    >
                      <span className="text-xs font-semibold text-gray-700 drop-shadow-sm">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Larger Profile Photo */}
          <div className="relative inline-block photo-menu-container">
            <button
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center text-white text-5xl font-display overflow-hidden hover:opacity-90 transition-opacity border-4 border-white shadow-xl"
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

          <h1 className="text-3xl font-display text-gray-800 mb-2">
            {userData?.displayName || 'User'}
          </h1>

          <p className="text-gray-700 mb-4">{currentUser?.email}</p>

          {userData?.profile?.bio && (
            <p className="text-gray-700 italic max-w-md mx-auto mb-4">
              "{userData.profile.bio}"
            </p>
          )}

          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => navigate('/edit-profile')}
              className="btn btn-secondary"
            >
              ✏️ Edit Profile
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="btn bg-white text-primary hover:bg-gray-50"
            >
              📤 Share Profile
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-text-primary">Profile Completion</h2>
            <span className="text-2xl font-bold text-text-primary">
              {profileCompletion.completed}/{profileCompletion.total}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full ${getProgressColor(profileCompletion.percentage)} transition-all duration-500`}
              style={{ width: `${profileCompletion.percentage}%` }}
            ></div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {profileCompletion.tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-lg">
                  {task.completed ? '✅' : '⭕'}
                </span>
                <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-semibold'}`}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>

          {profileCompletion.percentage === 100 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
              <span className="text-2xl">🎉</span>
              <p className="text-green-700 font-semibold">Profile Complete! You're all set!</p>
            </div>
          )}
        </div>

        {/* Weekly Summary */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Weekly Summary</h2>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{weeklySummary.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">
                  {weeklySummary.message}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  💡 {weeklySummary.tip}
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-primary">{userData?.stats?.totalCheckIns || 0}</span>
                    <span className="text-gray-600"> check-ins</span>
                  </div>
                  <div>
                    <span className="font-semibold text-secondary">{bestiesCount}</span>
                    <span className="text-gray-600"> besties</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Streak */}
        {loginStreak > 0 && (
          <div className="card p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display text-text-primary mb-1">Daily Login Streak</h2>
                <p className="text-sm text-gray-600">Keep it going! 💪</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-1">🔥</div>
                <div className="text-3xl font-display text-orange-600">
                  <CountUp end={loginStreak} duration={1500} />
                </div>
                <div className="text-xs text-gray-600">days</div>
              </div>
            </div>
          </div>
        )}

        {/* Featured Badges */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display text-text-primary">Featured Badges</h2>
            <button
              onClick={() => setShowBadgeSelector(true)}
              className="text-primary font-semibold hover:underline text-sm"
            >
              Choose 3 →
            </button>
          </div>

          {featuredBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredBadges.map((badge) => (
                <div key={badge.id} className="card p-4 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-sm text-text-primary">{badge.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-text-secondary mb-3">
                Earn badges and showcase your favorites here!
              </p>
              <button
                onClick={() => navigate('/badges')}
                className="btn btn-primary text-sm"
              >
                View All Badges
              </button>
            </div>
          )}
        </div>

        {/* Modern Stats Grid with CountUp */}
        <div className="card p-6 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">Your Impact</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Completed Check-ins */}
            <div className="text-center p-5 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl">
              <div className="text-4xl font-display text-pink-700 mb-1">
                <CountUp end={userData?.stats?.completedCheckIns || 0} duration={1500} />
              </div>
              <div className="text-sm text-gray-700 font-semibold">Completed Check-ins</div>
            </div>

            {/* Total Besties */}
            <div className="text-center p-5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <div className="text-4xl font-display text-purple-700 mb-1">
                <CountUp end={bestiesCount} duration={1500} />
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

            {/* Total Check-ins */}
            <div className="text-center p-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <div className="text-4xl font-display text-blue-700 mb-1">
                <CountUp end={userData?.stats?.totalCheckIns || 0} duration={1500} />
              </div>
              <div className="text-sm text-gray-700 font-semibold">Total Check-ins</div>
            </div>
          </div>
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

        {/* Donation Status */}
        {userData?.donationStats?.isActive && (
          <div className="card p-6 mb-6 bg-gradient-primary text-white">
            <h3 className="font-display text-xl mb-2">💜 Thank You!</h3>
            <p className="mb-2">
              You're helping keep Besties free for everyone
            </p>
            <div className="text-2xl font-display">
              $<CountUp end={userData.donationStats.totalDonated} duration={2000} /> donated
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/badges')}
            className="w-full btn btn-primary"
          >
            🏆 View All Badges
          </button>

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

      {/* Badge Selector Modal */}
      {showBadgeSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display text-text-primary">Choose Featured Badges</h2>
              <button
                onClick={() => setShowBadgeSelector(false)}
                className="text-3xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select up to 3 badges to showcase on your profile ({featuredBadgeIds.length}/3 selected)
            </p>

            {badges.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {badges.map((badge) => {
                  const isSelected = featuredBadgeIds.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => handleToggleFeaturedBadge(badge.id)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-primary shadow-lg scale-105'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <div className="font-semibold text-xs text-text-primary">{badge.name}</div>
                      {isSelected && <div className="text-xs text-primary mt-1">✓ Featured</div>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-gray-600">No badges yet! Complete check-ins to earn them.</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBadgeSelector(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
