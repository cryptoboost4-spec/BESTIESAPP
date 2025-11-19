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
  const [emergencyContactCount, setEmergencyContactCount] = useState(0);
  const [firstCheckInDate, setFirstCheckInDate] = useState(null);
  const [nighttimeCheckIns, setNighttimeCheckIns] = useState(0);
  const [weekendCheckIns, setWeekendCheckIns] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
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

  // Animate progress bar when profile completion changes
  useEffect(() => {
    const profileCompletion = calculateProfileCompletion();
    const targetProgress = profileCompletion.percentage;

    // Reset to 0 first
    setAnimatedProgress(0);

    // Animate to target after a small delay
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, bestiesCount, currentUser]);

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
        where('requesterId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );
      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(bestiesQuery),
        getDocs(bestiesQuery2)
      ]);

      setBestiesCount(snapshot1.size + snapshot2.size);

      // Count how many times user is an emergency contact
      const emergencyContactQuery = query(
        collection(db, 'checkins'),
        where('selectedBesties', 'array-contains', currentUser.uid)
      );
      const emergencySnapshot = await getDocs(emergencyContactQuery);
      setEmergencyContactCount(emergencySnapshot.size);

      // Get first check-in date
      const checkInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      if (!checkInsSnapshot.empty) {
        let earliestDate = null;
        let nightCount = 0;
        let weekendCount = 0;

        checkInsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          const date = data.createdAt?.toDate();

          if (date) {
            // Track earliest date
            if (!earliestDate || date < earliestDate) {
              earliestDate = date;
            }

            // Count nighttime check-ins (9 PM - 6 AM)
            const hour = date.getHours();
            if (hour >= 21 || hour < 6) {
              nightCount++;
            }

            // Count weekend check-ins (Saturday = 6, Sunday = 0)
            const day = date.getDay();
            if (day === 0 || day === 6) {
              weekendCount++;
            }
          }
        });

        setFirstCheckInDate(earliestDate);
        setNighttimeCheckIns(nightCount);
        setWeekendCheckIns(weekendCount);
      }

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

  // Calculate profile completion with navigation paths and section IDs
  const calculateProfileCompletion = () => {
    const tasks = [];
    let completed = 0;

    // Email (usually from auth)
    if (currentUser?.email) {
      tasks.push({ name: 'Add email', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add email', completed: false, path: '/settings', section: 'account' });
    }

    // Phone number
    if (userData?.phoneNumber) {
      tasks.push({ name: 'Add phone number', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Add phone number', completed: false, path: '/settings', section: 'phone' });
    }

    // Profile photo
    if (userData?.photoURL) {
      tasks.push({ name: 'Upload profile photo', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Upload profile photo', completed: false, path: null, section: 'photo', action: 'scrollToPhoto' });
    }

    // Bio
    if (userData?.profile?.bio) {
      tasks.push({ name: 'Write a bio', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: 'Write a bio', completed: false, path: '/edit-profile', section: 'bio' });
    }

    // Besties (at least 5)
    if (bestiesCount >= 5) {
      tasks.push({ name: 'Add 5 besties', completed: true, path: null, section: null });
      completed++;
    } else {
      tasks.push({ name: `Add 5 besties (${bestiesCount}/5)`, completed: false, path: '/besties', section: null });
    }

    const percentage = (completed / tasks.length) * 100;
    return { tasks, percentage, completed, total: tasks.length };
  };

  // Check if user has been active for at least a week
  const hasWeekOfActivity = () => {
    if (!firstCheckInDate) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return firstCheckInDate <= weekAgo;
  };

  // Get weekly summary
  const getWeeklySummary = () => {
    if (!hasWeekOfActivity()) {
      return {
        status: 'new',
        emoji: '🌱',
        message: 'Building your safety journey',
        tip: 'You\'ll get your weekly summary after you have one week of activity!'
      };
    }

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

  // Handle profile completion task navigation with section scrolling
  const handleTaskNavigation = (task) => {
    if (task.action === 'scrollToPhoto') {
      // Scroll to photo section on this page
      const photoElement = document.querySelector('.photo-menu-container');
      if (photoElement) {
        photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Trigger photo menu
        setShowPhotoMenu(true);
      }
    } else if (task.path) {
      // Navigate to path with section hash
      if (task.section) {
        navigate(`${task.path}#${task.section}`);
      } else {
        navigate(task.path);
      }
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

  // Calculate days active
  const getDaysActive = () => {
    if (!firstCheckInDate) return 0;
    const now = new Date();
    const diffTime = Math.abs(now - firstCheckInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        {/* Profile Header - Matching ViewUserProfilePage Design */}
        <div
          className="card p-6 mb-6 text-center relative overflow-hidden"
          style={{ background: currentGradient }}
        >
          {/* Edit Profile Button - Above Color Picker */}
          <div className="absolute top-4 right-4 color-picker-container flex flex-col gap-2">
            <button
              onClick={() => navigate('/edit-profile')}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform text-xl"
              title="Edit profile"
            >
              ✏️
            </button>

            {/* Color Picker Button */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              title="Change background color"
            >
              🎨
            </button>

            {showColorPicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 z-30 w-64 max-h-80 overflow-y-auto">
                <div className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white pb-2">Choose Your Vibe</div>
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

          {/* Profile Photo */}
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
                <div className="text-xs font-semibold text-gray-500 px-3 py-1">Manage Photo</div>
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

          <h1 className="text-3xl font-display text-gray-800 mb-2 mt-4">
            {userData?.displayName || 'User'}
          </h1>

          {userData?.profile?.bio && (
            <p className="text-gray-700 italic max-w-md mx-auto mt-4">
              "{userData.profile.bio}"
            </p>
          )}

          {/* Social Sharing Icons */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Share your profile:</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {/* Facebook */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/user/${currentUser.uid}`;
                  const text = `Come be my bestie on Besties! 💜`;
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                  if (isMobile) {
                    // Try to open in Facebook app first, fallback to web
                    window.location.href = `fb://facewebmodal/f?href=${encodeURIComponent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`)}`;
                    // Fallback to web after a delay if app doesn't open
                    setTimeout(() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                    }, 1000);
                  } else {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                  }
                }}
                className="w-12 h-12 rounded-full bg-[#1877f2] hover:bg-[#1864d9] text-white flex items-center justify-center transition-colors shadow-lg"
                title="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* Twitter/X */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/user/${currentUser.uid}`;
                  const text = `Come be my bestie on Besties! 💜`;
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                  if (isMobile) {
                    // Try to open in Twitter app first
                    window.location.href = `twitter://post?message=${encodeURIComponent(text + ' ' + url)}`;
                    // Fallback to web after a delay if app doesn't open
                    setTimeout(() => {
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                    }, 1000);
                  } else {
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                  }
                }}
                className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-colors shadow-lg"
                title="Share on X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/user/${currentUser.uid}`;
                  const text = `Come be my bestie on Besties! 💜`;
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                  if (isMobile) {
                    // Open WhatsApp app directly on mobile
                    window.location.href = `whatsapp://send?text=${encodeURIComponent(text + ' ' + url)}`;
                  } else {
                    // Open WhatsApp web on desktop
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                  }
                }}
                className="w-12 h-12 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-colors shadow-lg"
                title="Share on WhatsApp"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>

              {/* Instagram - Copy Link */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/user/${currentUser.uid}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Profile link copied! Share it on Instagram 💜');
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90 text-white flex items-center justify-center transition-opacity shadow-lg"
                title="Copy link for Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>

              {/* Copy Link Button */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/user/${currentUser.uid}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Profile link copied to clipboard!');
                }}
                className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-colors shadow-lg"
                title="Copy link"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Completion Bar with Clickable Tasks */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-gradient">Profile Completion ✨</h2>
            <span className="text-2xl font-bold text-gradient">
              {profileCompletion.completed}/{profileCompletion.total}
            </span>
          </div>

          {/* Animated Progress Bar with Shimmer Effect */}
          <div className="w-full h-4 bg-white rounded-full overflow-hidden mb-4 shadow-inner relative">
            <div
              className={`h-full ${getProgressColor(profileCompletion.percentage)} transition-all duration-1000 ease-out relative overflow-hidden`}
              style={{ width: `${animatedProgress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer-effect"></div>
            </div>
            {/* Progress percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
                {Math.round(profileCompletion.percentage)}%
              </span>
            </div>
          </div>

          {/* Task List with Navigation */}
          <div className="space-y-2">
            {profileCompletion.tasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">
                    {task.completed ? '✅' : '⭕'}
                  </span>
                  <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-semibold'}`}>
                    {task.name}
                  </span>
                </div>
                {!task.completed && (task.path || task.action) && (
                  <button
                    onClick={() => handleTaskNavigation(task)}
                    className="btn btn-sm btn-primary text-xs px-3 py-1"
                  >
                    Go →
                  </button>
                )}
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
                {hasWeekOfActivity() && (
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
                )}
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

        {/* Featured Badges with Sticky View All */}
        <div className="mb-6 relative">
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
            <>
              <div className="grid grid-cols-3 gap-4">
                {featuredBadges.map((badge) => (
                  <div key={badge.id} className="card p-4 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="font-semibold text-sm text-text-primary">{badge.name}</div>
                  </div>
                ))}
              </div>

              {/* Sticky View All Button */}
              <button
                onClick={() => navigate('/badges')}
                className="fixed bottom-24 right-4 md:bottom-6 md:right-6 btn btn-primary shadow-lg text-sm px-4 py-2 z-20"
              >
                🏆 View All
              </button>
            </>
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

        {/* Enhanced Your Impact - Modern Luxury Design */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <h2 className="text-3xl font-display text-gradient mb-6 text-center">Your Impact ✨</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Besties Count */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">💜</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={bestiesCount} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Besties</div>
              </div>
            </div>

            {/* Emergency Contact Count */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">🛡️</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={emergencyContactCount} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Times Selected</div>
                <div className="text-xs text-gray-500">as Emergency Contact</div>
              </div>
            </div>

            {/* Days Active */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">📅</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={getDaysActive()} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Days Active</div>
              </div>
            </div>

            {/* Completed Check-ins */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">✅</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={userData?.stats?.completedCheckIns || 0} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Safe Check-ins</div>
              </div>
            </div>

            {/* Badges Earned */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">🏆</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={badges.length} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Badges Earned</div>
              </div>
            </div>

            {/* Login Streak */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">🔥</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={loginStreak} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Day Streak</div>
              </div>
            </div>

            {/* Nighttime Check-ins */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">🌙</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={nighttimeCheckIns} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Night Check-ins</div>
                <div className="text-xs text-gray-500">9 PM - 6 AM</div>
              </div>
            </div>

            {/* Weekend Check-ins */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 text-6xl opacity-10">🎉</div>
              <div className="relative z-10">
                <div className="text-4xl font-display bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  <CountUp end={weekendCheckIns} duration={1500} />
                </div>
                <div className="text-sm font-semibold text-gray-600">Weekend Check-ins</div>
                <div className="text-xs text-gray-500">Sat & Sun</div>
              </div>
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

        {/* Settings Button */}
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

      {/* Badge Selector Modal - Updated */}
      {showBadgeSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display text-text-primary">Choose Featured Badges</h2>
              <button
                onClick={() => setShowBadgeSelector(false)}
                className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-xl font-bold transition-colors"
                title="Close"
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
                <p className="text-gray-600 mb-4">No badges yet! Complete tasks to earn them.</p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/badges')}
                className="btn btn-primary"
              >
                See How to Earn Badges →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer Effect CSS */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
