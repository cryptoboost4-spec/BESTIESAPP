import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import BestieCircle from '../components/BestieCircle';

const OnboardingPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome'); // welcome, slides, name, photo, bestie-circle
  const [slideIndex, setSlideIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hasBesties, setHasBesties] = useState(false);
  const [checkingBesties, setCheckingBesties] = useState(false);

  // Prefill name from user data when it loads
  useEffect(() => {
    if (userData?.displayName && !displayName) {
      setDisplayName(userData.displayName);
    } else if (currentUser?.displayName && !displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [userData, currentUser, displayName]);

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

  // Check if user already has besties
  useEffect(() => {
    if (step === 'bestie-circle' && currentUser) {
      checkForBesties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentUser]);

  const checkForBesties = async () => {
    setCheckingBesties(true);
    try {
      const [requesterQuery, recipientQuery] = await Promise.all([
        getDocs(query(collection(db, 'besties'), where('requesterId', '==', currentUser.uid), where('status', '==', 'accepted'))),
        getDocs(query(collection(db, 'besties'), where('recipientId', '==', currentUser.uid), where('status', '==', 'accepted'))),
      ]);

      setHasBesties(!requesterQuery.empty || !recipientQuery.empty);
    } catch (error) {
      console.error('Error checking besties:', error);
    } finally {
      setCheckingBesties(false);
    }
  };

  const handleSaveName = async () => {
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
      toast.error('Failed to update name');
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

      toast.success('Photo uploaded!');
      setStep('bestie-circle');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSkipPhoto = () => {
    setStep('bestie-circle');
  };

  const handleFinish = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        onboardingCompleted: true,
      });

      if (hasBesties) {
        navigate('/create');
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">💜</div>
          <h1 className="text-4xl font-display text-white mb-4">Welcome to Besties!</h1>
          <p className="text-xl text-white/90 mb-8">
            Your personal safety network in your pocket
          </p>
          <button
            onClick={() => setStep('slides')}
            className="btn bg-white text-primary hover:bg-white/90 text-lg px-8 py-4"
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">{currentSlide.emoji}</div>
          <h2 className="text-3xl font-display text-text-primary mb-4">
            {currentSlide.title}
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            {currentSlide.description}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === slideIndex ? 'bg-primary w-6' : 'bg-gray-300'
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
                  className="flex-1 btn btn-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => setSlideIndex(slideIndex + 1)}
                  className="flex-1 btn btn-primary"
                >
                  Next →
                </button>
              </>
            ) : (
              <button
                onClick={() => setStep('name')}
                className="w-full btn btn-primary text-lg py-4"
              >
                Let's check your details! →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Name Edit
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-3xl font-display text-text-primary mb-2">
              Is this name correct?
            </h2>
            <p className="text-text-secondary">
              This is how your besties will see you
            </p>
          </div>

          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg mb-6"
            placeholder="Your name"
          />

          <button
            onClick={handleSaveName}
            className="w-full btn btn-primary text-lg py-4"
          >
            Looks Good! ✓
          </button>
        </div>
      </div>
    );
  }

  // Photo Upload
  if (step === 'photo') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-3xl font-display text-text-primary mb-2">
              Add a Profile Picture?
            </h2>
            <p className="text-text-secondary">
              Help your besties recognize you (optional)
            </p>
          </div>

          {userData?.photoURL && (
            <div className="mb-6 flex justify-center">
              <img
                src={userData.photoURL}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            </div>
          )}

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
            className="w-full btn btn-secondary text-lg py-4"
            disabled={uploading}
          >
            Skip for Now →
          </button>
        </div>
      </div>
    );
  }

  // Bestie Circle Intro
  if (step === 'bestie-circle') {
    if (checkingBesties) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-2xl w-full py-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-3xl font-display text-text-primary mb-2">
              Your Bestie Circle
            </h2>
            <p className="text-text-secondary mb-6">
              These are the 5 besties who get notified if you miss a check-in.
            </p>

            {!hasBesties && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-yellow-800">
                  ⚠️ You need at least one bestie to create a check-in
                </p>
              </div>
            )}

            {hasBesties && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-green-800">
                  ✅ Great! You already have a bestie in your circle
                </p>
              </div>
            )}
          </div>

          {/* Show actual bestie circle */}
          <div className="mb-8">
            <BestieCircle />
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-display text-lg mb-4 text-center">How It Works:</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex gap-3">
                <span className="text-2xl">1️⃣</span>
                <span>Choose up to 5 besties for your safety circle</span>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">2️⃣</span>
                <span>They'll get SMS alerts if you miss a check-in</span>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">3️⃣</span>
                <span>You can change who's in your circle anytime</span>
              </li>
            </ul>
          </div>

          {hasBesties ? (
            <button
              onClick={handleFinish}
              className="w-full btn btn-primary text-lg py-4"
            >
              Start Creating Check-Ins! →
            </button>
          ) : (
            <>
              <button
                onClick={handleFinish}
                className="w-full btn btn-primary text-lg py-4 mb-3"
              >
                ➕ Add Your First Bestie
              </button>

              <p className="text-xs text-center text-text-secondary">
                You'll be taken to your profile. Click on a + button in your bestie circle to continue
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingPage;
