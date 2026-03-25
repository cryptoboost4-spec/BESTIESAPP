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
  const [step, setStep] = useState('welcome'); // welcome, name, photo, tutorial, invite-welcome
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [inviterInfo, setInviterInfo] = useState(null);
  const [nameHasBeenEdited, setNameHasBeenEdited] = useState(false);
  // Tutorial step state
  const [tutStep, setTutStep] = useState(1);
  const [mockBestie, setMockBestie] = useState('');
  const [mockLocation, setMockLocation] = useState('');
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
        // Show interactive tutorial before completing onboarding
        setStep('tutorial');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleUseCurrentPhoto = async () => {
    if (inviterInfo) {
      setStep('invite-welcome');
    } else {
      setStep('tutorial');
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
          <p className="text-xl text-white/90 mb-8">
            Let's confirm a few details, then we'll show you how it works.
          </p>

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

              <label className="block w-full">
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
            </>
          ) : (
            <>
              {/* User has no photo - show upload as primary action */}
              <label className="block w-full">
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
            </>
          )}
        </div>
      </div>
    );
  }

  // Interactive 5-Step Safety Tutorial
  if (step === 'tutorial') {
    const steps = [
      { num: 1, label: 'Add Bestie' },
      { num: 2, label: 'Check-in' },
      { num: 3, label: 'Timer' },
      { num: 4, label: 'Mark Safe' },
      { num: 5, label: 'If Missed' },
    ];
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 pb-32 overflow-y-auto">
        <div className="max-w-md w-full">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map(s => (
              <div key={s.num} className={`w-2 h-2 rounded-full transition-colors ${tutStep >= s.num ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>

          {tutStep === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-4">💜</div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">Step 1: Add a Bestie</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Safety is better together. Add someone you trust as your emergency contact.</p>
              <input
                type="text"
                placeholder="Bestie's name or phone number"
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl mb-4 focus:border-primary outline-none text-lg"
                value={mockBestie}
                onChange={(e) => setMockBestie(e.target.value)}
              />
              <button
                onClick={() => setTutStep(2)}
                disabled={!mockBestie.trim()}
                className="btn btn-primary w-full py-4 text-lg disabled:opacity-40"
              >
                Add "{mockBestie || 'Bestie'}" →
              </button>
            </div>
          )}

          {tutStep === 2 && (
            <div className="text-center">
              <div className="text-6xl mb-4">📍</div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">Step 2: Create a Check-in</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">When you're heading somewhere, set a timer. Where are you going?</p>
              <input
                type="text"
                placeholder="e.g. Walking to my car"
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl mb-4 focus:border-primary outline-none text-lg"
                value={mockLocation}
                onChange={(e) => setMockLocation(e.target.value)}
              />
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
                Timer set for <span className="font-bold text-primary">15 minutes</span>
              </div>
              <button
                onClick={() => setTutStep(3)}
                disabled={!mockLocation.trim()}
                className="btn btn-primary w-full py-4 text-lg disabled:opacity-40"
              >
                Start Check-in →
              </button>
            </div>
          )}

          {tutStep === 3 && (
            <div className="text-center">
              <div className="text-6xl mb-4">⏱️</div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">Step 3: Timer is Running</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Your besties are watching. You'll get a warning at 5 minutes and 1 minute left.</p>
              <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-6 mb-6">
                <div className="text-5xl font-bold text-primary mb-1">14:59</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">📍 {mockLocation || 'Walking to my car'}</div>
              </div>
              <button onClick={() => setTutStep(4)} className="btn btn-primary w-full py-4 text-lg">
                Got it →
              </button>
            </div>
          )}

          {tutStep === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">Step 4: Mark Yourself Safe</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">When you arrive safely, tap the button. Your besties get a "they're safe!" notification.</p>
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-4 mb-6">
                <p className="text-green-800 dark:text-green-300 font-semibold">📍 {mockLocation || 'Walking to my car'}</p>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">Timer: 12:43 remaining</p>
              </div>
              <button onClick={() => setTutStep(5)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors">
                ✅ I'm Safe!
              </button>
            </div>
          )}

          {tutStep === 5 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">Step 5: If You Miss It…</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">If the timer expires without you marking safe:</p>
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <span className="text-xl">📳</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Your phone sounds a <strong>loud alarm</strong> for 60 seconds</p>
                </div>
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <span className="text-xl">📱</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><strong>{mockBestie || 'Your bestie'}</strong> gets an instant push notification</p>
                </div>
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <span className="text-xl">💬</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">If push fails, they receive an <strong>SMS alert</strong></p>
                </div>
              </div>
              <button onClick={handleFinish} className="btn btn-primary w-full py-4 text-lg">
                I'm Ready — Let's Go! 🚀
              </button>
            </div>
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
