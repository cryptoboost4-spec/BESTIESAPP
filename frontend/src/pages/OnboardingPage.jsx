import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

const OnboardingPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome'); // welcome, name, photo, invite-welcome
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
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
        // Complete onboarding and go to home
        await handleFinish();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleUseCurrentPhoto = async () => {
    // User already has a photo and wants to use it
    // No need to update anything, just advance to next step
    if (inviterInfo) {
      setStep('invite-welcome');
    } else {
      // Complete onboarding and go to home
      await handleFinish();
    }
  };

  const handleSkipPhoto = async () => {
    // User wants to skip photo (no photo or doesn't want to use existing one)
    // If user joined via invite, show welcome screen first
    if (inviterInfo) {
      setStep('invite-welcome');
    } else {
      // Complete onboarding and go to home
      await handleFinish();
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
      logAnalyticsEvent('onboarding_completed', {});

      // Navigate to home page - tutorial will auto-start
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
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 pb-32 md:pb-6 overflow-y-auto" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-8xl mb-6 animate-bounce">💜</div>
          <h1 className="text-4xl font-display text-white mb-4">Welcome to Besties!</h1>
          <p className="text-xl text-white/90 mb-6">
            Your personal safety network in your pocket
          </p>
          
          {/* Information cards from deleted slides */}
          <div className="space-y-4 mb-8 text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⏰</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">How It Works</h3>
                  <p className="text-sm text-white/90">Create a check-in with a time limit. If you don't mark yourself safe before time runs out, your besties get alerted.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💜</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Your Safety Network</h3>
                  <p className="text-sm text-white/90">Add up to 5 besties to your circle. They'll be notified if you miss a check-in, so they can make sure you're okay.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📱</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Stay Connected</h3>
                  <p className="text-sm text-white/90">Your besties get SMS alerts when you miss a check-in. They can also see your location and notes from your last check-in.</p>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setStep('name')}
            className="btn bg-white dark:bg-gray-800 text-primary hover:bg-white/90 dark:hover:bg-gray-700 text-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Start onboarding"
          >
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  // Name Edit
  if (step === 'name') {
    const hasName = displayName.trim().length > 0;
    
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center p-4 pb-32 md:pb-6 overflow-y-auto" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
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
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center p-4 pb-32 md:pb-6 overflow-y-auto" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-3xl font-display text-gray-800 dark:text-gray-200 mb-2">
              {hasExistingPhoto ? 'Add a Profile Picture?' : 'Add a Profile Picture?'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {hasExistingPhoto 
                ? 'Help your besties recognize you (optional)'
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
              {/* User has existing photo - show "Use This Photo" as top button */}
              <button
                onClick={handleUseCurrentPhoto}
                className="w-full btn btn-primary text-lg py-4 mb-3"
                disabled={uploading}
              >
                Use This Photo →
              </button>

              <label className="block w-full mb-3">
                <div className="btn btn-secondary text-lg py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4 pb-32 md:pb-6 overflow-y-auto" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 8rem))' }}>
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
            onClick={async () => {
              // Clean up inviter info and complete onboarding
              sessionStorage.removeItem('inviter_info');
              localStorage.removeItem('inviter_info');
              setInviterInfo(null);
              await handleFinish();
            }}
            className="btn bg-white dark:bg-gray-800 text-primary hover:bg-white/90 dark:hover:bg-gray-700 text-lg px-8 py-4"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingPage;
