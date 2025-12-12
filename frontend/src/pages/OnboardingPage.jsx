import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

const OnboardingPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome'); // welcome, slides, name, photo, invite-welcome, bestie-circle
  const [slideIndex, setSlideIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hasBesties, setHasBesties] = useState(false);
  const [inviterInfo, setInviterInfo] = useState(null);
  const [nameHasBeenEdited, setNameHasBeenEdited] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inputRef = useRef(null); // Correctly placed at top level - false positive from ESLint cache

  // Check for inviter info on mount
  useEffect(() => {
    const storedInviterInfo = sessionStorage.getItem('inviter_info') || localStorage.getItem('inviter_info');
    if (storedInviterInfo) {
      try {
        setInviterInfo(JSON.parse(storedInviterInfo));
      } catch (e) {
        console.error('Failed to parse inviter info:', e);
      }
    }
  }, []);

  // Prefill name from user data when it loads (only if user hasn't edited it yet)
  useEffect(() => {
    if (!nameHasBeenEdited) {
      if (userData?.displayName && !displayName) {
        setDisplayName(userData.displayName);
      } else if (currentUser?.displayName && !displayName) {
        setDisplayName(currentUser.displayName);
      }
    }
  }, [userData, currentUser, displayName, nameHasBeenEdited]);

  const slides = [
    {
      emoji: '👋',
      title: 'Welcome to Besties!',
      description: 'Your personal safety check-in app that keeps your loved ones informed.',
    },
    {
      emoji: '⏰',
      title: 'How It Works',
      description: 'Create a check-in with a time limit. If you don\'t mark yourself safe before time runs out, your besties get alerted.',
    },
    {
      emoji: '💜',
      title: 'Your Safety Network',
      description: 'Add up to 5 besties to your circle. They\'ll be notified if you miss a check-in, so they can make sure you\'re okay.',
    },
    {
      emoji: '📱',
      title: 'Stay Connected',
      description: 'Your besties get SMS alerts when you miss a check-in. They can also see your location and notes from your last check-in.',
    },
    {
      emoji: '✨',
      title: 'Let\'s Get Started!',
      description: 'We\'ll help you set up your profile and add your first bestie. Then you\'ll be ready to create your first check-in!',
    },
  ];

  const currentSlide = slides[slideIndex];

  // Check if user already has besties (for analytics only)
  useEffect(() => {
    if (step === 'bestie-circle' && currentUser) {
      checkForBesties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentUser]);

  const checkForBesties = async () => {
    if (!currentUser) return;

    try {
      // If there's a pending invite, wait for it to be processed
      // AuthContext removes pending_invite after processing
      const pendingInvite = sessionStorage.getItem('pending_invite') || localStorage.getItem('pending_invite');
      if (pendingInvite) {
        // Wait up to 3 seconds for invite to process
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const stillPending = sessionStorage.getItem('pending_invite') || localStorage.getItem('pending_invite');
          if (!stillPending) break; // Invite processed!
        }
      }

      // Now check for besties in Firestore (for analytics tracking only)
      const [requesterQuery, recipientQuery] = await Promise.all([
        getDocs(query(collection(db, 'besties'), where('requesterId', '==', currentUser.uid), where('status', '==', 'accepted'))),
        getDocs(query(collection(db, 'besties'), where('recipientId', '==', currentUser.uid), where('status', '==', 'accepted'))),
      ]);

      setHasBesties(!requesterQuery.empty || !recipientQuery.empty);
    } catch (error) {
      console.error('Error checking besties:', error);
      // On error, assume no besties (for analytics)
      setHasBesties(false);
    }
  };

  const handleSaveName = async () => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(),
      });
      setStep('photo');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name. Please try again.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentUser) {
      toast.error('Please sign in to continue');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB. Please choose a smaller image.');
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading('Uploading photo...');

    try {
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL,
      });

      toast.success('Photo uploaded!', { id: uploadToast });

      // If user joined via invite, show welcome screen first
      if (inviterInfo) {
        setStep('invite-welcome');
      } else {
        setStep('bestie-circle');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleUseCurrentPhoto = () => {
    // User already has a photo and wants to use it
    // No need to update anything, just advance to next step
    if (inviterInfo) {
      setStep('invite-welcome');
    } else {
      setStep('bestie-circle');
    }
  };

  const handleSkipPhoto = () => {
    // User wants to skip photo (no photo or doesn't want to use existing one)
    // If user joined via invite, show welcome screen first
    if (inviterInfo) {
      setStep('invite-welcome');
    } else {
      setStep('bestie-circle');
    }
  };

  const handleFinish = async () => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        onboardingCompleted: true,
      });

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('onboarding_completed', {
        has_besties: hasBesties
      });

      // Always navigate to home page - it has clear instructions for next steps
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
      // Don't navigate on error - let user retry
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 pb-32 md:pb-6" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">💜</div>
          <h1 className="text-4xl font-display text-white mb-4">Welcome to Besties!</h1>
          <p className="text-xl text-white/90 mb-8">
            Your personal safety network in your pocket
          </p>
          <button
            onClick={() => setStep('slides')}
            className="btn bg-white dark:bg-gray-800 text-primary hover:bg-white/90 dark:hover:bg-gray-700 text-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Start onboarding"
          >
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  // Slides
  if (step === 'slides') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4 pb-32 md:pb-6" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">{currentSlide.emoji}</div>
          <h2 className="text-3xl font-display text-gray-800 dark:text-gray-200 mb-4">
            {currentSlide.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {currentSlide.description}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === slideIndex ? 'bg-primary w-6' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {slideIndex < slides.length - 1 ? (
              <>
                <button
                  onClick={() => setStep('name')}
                  className="flex-1 btn btn-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Skip slides and go to profile setup"
                  title="Skip the introduction and go straight to setting up your profile"
                >
                  Skip Intro
                </button>
                <button
                  onClick={() => setSlideIndex(slideIndex + 1)}
                  className="flex-1 btn btn-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Go to next slide"
                >
                  Next →
                </button>
              </>
            ) : (
              <button
                onClick={() => setStep('name')}
                className="w-full btn btn-primary text-lg py-4"
              >
                Set Up Your Profile →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Name Edit
  if (step === 'name') {
    const hasName = displayName.trim().length > 0;
    
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center p-4 pb-32 md:pb-6" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-3xl font-display text-gray-800 dark:text-gray-200 mb-2">
              {hasName ? 'Is this name correct?' : 'What\'s your name?'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {hasName 
                ? 'This is how your besties will see you'
                : 'Enter your name so your besties know who you are'}
            </p>
          </div>

          <div
            onClick={() => inputRef.current?.focus()}
            className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 text-lg mb-4 cursor-text"
          >
            <input
              ref={inputRef}
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setNameHasBeenEdited(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && displayName.trim()) {
                  e.preventDefault();
                  handleSaveName();
                }
              }}
              maxLength={50}
              className="w-full bg-transparent border-none outline-none text-gray-800 dark:text-gray-200"
              placeholder="Tap to enter your name"
              aria-label="Your name"
              aria-required="true"
            />
          </div>

          {!hasName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              💡 Your name helps your besties recognize you
            </p>
          )}

          {displayName.length >= 45 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2 text-center">
              ⚠️ Name is getting long ({displayName.length}/50 characters)
            </p>
          )}

          <button
            onClick={handleSaveName}
            className="w-full btn btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!displayName.trim()}
            aria-label={hasName ? "Confirm name and continue" : "Save name and continue"}
            title={!displayName.trim() ? "Please enter your name to continue" : ""}
          >
            {hasName ? 'Looks Good! ✓' : 'Continue →'}
          </button>
        </div>
      </div>
    );
  }

  // Photo Upload
  if (step === 'photo') {
    const hasExistingPhoto = userData?.photoURL || currentUser?.photoURL;
    
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center p-4 pb-32 md:pb-6" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-3xl font-display text-gray-800 dark:text-gray-200 mb-2">
              {hasExistingPhoto ? 'Your Profile Picture' : 'Add a Profile Picture?'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {hasExistingPhoto 
                ? 'We found a photo from your account. Want to use it or upload a different one?'
                : 'Help your besties recognize you (optional)'}
            </p>
          </div>

          {hasExistingPhoto && (
            <div className="mb-6 flex flex-col items-center">
              <img
                src={userData?.photoURL || currentUser?.photoURL}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current photo
              </p>
            </div>
          )}

          {hasExistingPhoto ? (
            <>
              {/* User has existing photo - show "Use This Photo" as primary action */}
              <button
                onClick={handleUseCurrentPhoto}
                className="w-full btn btn-primary text-lg py-4 mb-3"
                disabled={uploading}
              >
                ✓ Use This Photo →
              </button>

              <label className="block w-full mb-3">
                <div className="btn btn-secondary text-lg py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {uploading ? 'Uploading...' : '📤 Upload Different Photo'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <button
                onClick={handleSkipPhoto}
                className="w-full btn btn-secondary text-sm py-3 opacity-75 hover:opacity-100 transition-opacity"
                disabled={uploading}
                aria-label="Skip photo and continue to setup"
                title="You can add a photo later in your profile settings"
              >
                Skip Photo (Optional) →
              </button>
            </>
          ) : (
            <>
              {/* User has no photo - show upload as primary action */}
              <label className="block w-full mb-4">
                <div className="btn btn-primary text-lg py-4 text-center cursor-pointer">
                  {uploading ? 'Uploading...' : '📤 Upload Photo'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <button
                onClick={handleSkipPhoto}
                className="w-full btn btn-secondary text-lg py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={uploading}
                aria-label="Skip photo and continue to setup"
                title="You can add a photo later in your profile settings"
              >
                Skip Photo (Optional) →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Invite Welcome Screen (only shown if user joined via invite)
  if (step === 'invite-welcome' && inviterInfo) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4 pb-32 md:pb-6" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">💜</div>

          {/* Inviter's Photo */}
          {inviterInfo.photoURL ? (
            <div className="mb-6 flex justify-center">
              <img
                src={inviterInfo.photoURL}
                alt={inviterInfo.displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
            </div>
          ) : (
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center text-white text-5xl font-display border-4 border-white shadow-xl">
                {inviterInfo.displayName?.[0] || '?'}
              </div>
            </div>
          )}

          <h1 className="text-4xl font-display text-white mb-4">
            Welcome to Besties!
          </h1>
          <p className="text-2xl text-white/90 mb-2">
            You accepted <span className="font-bold">{inviterInfo.displayName}'s</span> request
          </p>
          <p className="text-xl text-white/90 mb-8">
            You are now besties! 🎉
          </p>

          <button
            onClick={() => {
              // Clean up inviter info and proceed to bestie circle
              sessionStorage.removeItem('inviter_info');
              localStorage.removeItem('inviter_info');
              setInviterInfo(null);
              setStep('bestie-circle');
            }}
            className="btn bg-white dark:bg-gray-800 text-primary hover:bg-white/90 dark:hover:bg-gray-700 text-lg px-8 py-4"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (step === 'bestie-circle') {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 overflow-hidden relative">
        {/* Confetti background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-celebration-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            >
              <span className="text-3xl md:text-4xl">
                {['🎉', '✨', '💜', '🌟', '💫', '🎊', '⭐', '💕'][Math.floor(Math.random() * 8)]}
              </span>
            </div>
          ))}
        </div>

        <div className="max-w-md w-full text-center relative z-10">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl md:text-5xl font-display text-white mb-4">
            You're All Set!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-6">
            Welcome to Besties! You're ready to start using your safety network.
          </p>
          
          {/* What's Next - Adapts based on whether user has besties */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/30">
            <h2 className="text-2xl font-display text-white mb-4">What's Next?</h2>
            <div className="space-y-3 text-left">
              {hasBesties ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Great! You already have besties</p>
                      <p className="text-sm text-white/70">Your safety circle is ready to go</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Create Your First Check-In</p>
                      <p className="text-sm text-white/70">Use the "Try Test Walkthrough" button on the home page to practice first</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Stay Safe Together</p>
                      <p className="text-sm text-white/70">Your besties will watch out for you 💜</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Learn How to Check In</p>
                      <p className="text-sm text-white/70">Create your first check-in to see how it works - we'll guide you through it!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Add Your Besties</p>
                      <p className="text-sm text-white/70">After you learn check-ins, add real besties to your safety circle</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <div className="text-white/90">
                      <p className="font-semibold">Stay Safe Together</p>
                      <p className="text-sm text-white/70">Your besties will watch out for you 💜</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="btn bg-white dark:bg-gray-800 text-primary hover:bg-white/90 dark:hover:bg-gray-700 text-lg px-8 py-4 shadow-2xl transform hover:scale-105 transition-all"
          >
            Let's Go! →
          </button>
        </div>

        <style>{`
          @keyframes celebration-float {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .animate-celebration-float {
            animation: celebration-float 5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default OnboardingPage;
