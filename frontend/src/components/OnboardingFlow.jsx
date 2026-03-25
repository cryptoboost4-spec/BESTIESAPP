import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

const OnboardingFlow = ({ onComplete }) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome'); // Celebration will show after onboarding on HomePage
  const [slideIndex, setSlideIndex] = useState(0);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [uploading, setUploading] = useState(false);

  // Tutorial Steps for Action Loop
  const [tutStep, setTutStep] = useState(1);
  const [mockBestie, setMockBestie] = useState('');
  const [mockLocation, setMockLocation] = useState('');

  const handleSaveName = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim() || 'Anonymous',
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
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-gradient-primary flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">💜</div>
          <h1 className="text-4xl font-display text-white mb-4">Welcome to Besties!</h1>
          <p className="text-xl text-white/90 mb-8">
            Your personal safety network in your pocket
          </p>
          <button
            onClick={() => setStep('name')}
            className="btn bg-white text-primary hover:bg-white/90 text-lg px-8 py-4"
          >
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  // Action-Based Tutorial Loop
  if (step === 'tutorial') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4">
        <div className="max-w-md w-full text-center">
          
          {/* Step 1: Add Bestie */}
          {tutStep === 1 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">💜</div>
              <h2 className="text-3xl font-display text-text-primary mb-4">Step 1: Add a Bestie</h2>
              <p className="text-text-secondary mb-6">Safety is better together. Add someone you trust to be your emergency contact.</p>
              <input 
                type="text" 
                placeholder="Bestie's Name or Phone #"
                className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4 focus:border-primary outline-none"
                value={mockBestie}
                onChange={(e) => setMockBestie(e.target.value)}
              />
              <button 
                onClick={() => setTutStep(2)}
                disabled={!mockBestie.trim()}
                className="btn btn-primary w-full py-4 disabled:opacity-50"
              >
                Add "{mockBestie || 'Bestie'}" →
              </button>
            </div>
          )}

          {/* Step 2: Create Check-in */}
          {tutStep === 2 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">📍</div>
              <h2 className="text-3xl font-display text-text-primary mb-4">Step 2: Create Check-in</h2>
              <p className="text-text-secondary mb-6">Whenever you're feeling unsafe, set a timer. Where are you going?</p>
              <input 
                type="text" 
                placeholder="e.g., Walking to my car"
                className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4 focus:border-primary outline-none"
                value={mockLocation}
                onChange={(e) => setMockLocation(e.target.value)}
              />
              <div className="bg-gray-100 rounded-xl p-4 mb-6 text-sm text-gray-500">
                Timer set for: <span className="font-bold text-primary">15 minutes</span>
              </div>
              <button 
                onClick={() => setTutStep(3)}
                disabled={!mockLocation.trim()}
                className="btn btn-primary w-full py-4 disabled:opacity-50"
              >
                Start Check-in →
              </button>
            </div>
          )}

          {/* Step 3: View Mockup */}
          {tutStep === 3 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">⏱️</div>
              <h2 className="text-3xl font-display text-text-primary mb-4">Timer is Active</h2>
              <p className="text-text-secondary mb-6">Your check-in is now running.</p>
              
              <div className="border-2 border-primary rounded-xl p-6 mb-8 text-left bg-primary/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-primary">Active Check-in</span>
                  <span className="text-primary font-mono bg-white px-2 py-1 rounded">14:59</span>
                </div>
                <p className="text-gray-800 font-semibold">{mockLocation}</p>
                <div className="mt-4 flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs">💜</div>
                  <span className="text-sm text-gray-600 self-center">{mockBestie} is watching</span>
                </div>
              </div>

              <button 
                onClick={() => setTutStep(4)}
                className="btn btn-primary w-full py-4"
              >
                Next Step →
              </button>
            </div>
          )}

          {/* Step 4: Mark Safe */}
          {tutStep === 4 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-display text-text-primary mb-4">Step 3: Mark Safe</h2>
              <p className="text-text-secondary mb-6">When you arrive, press the green button to end the timer before it runs out.</p>
              
              <button 
                onClick={() => setTutStep(5)}
                className="btn bg-green-500 hover:bg-green-600 text-white w-full py-5 text-xl font-bold rounded-2xl mb-4 shadow-lg active:scale-95 transition-transform"
              >
                MARK AS SAFE
              </button>
              <button 
                onClick={() => setTutStep(5)} // Allow skip for demo
                className="text-gray-400 text-sm hover:underline"
              >
                What happens if I don't?
              </button>
            </div>
          )}

          {/* Step 5: Missed Consequence */}
          {tutStep === 5 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-3xl font-display text-text-primary mb-4">If You Don't Check In...</h2>
              <p className="text-text-secondary mb-6">If the timer hits zero, we instantly alert your besties so they can check on you.</p>

              <div className="bg-gray-100 p-4 rounded-xl text-left border-l-4 border-red-500 mb-8 max-w-sm mx-auto">
                <p className="text-xs text-gray-500 mb-1">Incoming SMS to {mockBestie}</p>
                <p className="font-mono text-sm">🚨 EMERGENCY: {displayName || 'Your friend'} missed their check-in! Location: {mockLocation}. Check Besties app immediately!</p>
              </div>

              <button 
                onClick={handleFinish}
                className="btn btn-primary w-full py-4"
              >
                I Understand, Let's Go! ✨
              </button>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-8">
            {[1,2,3,4,5].map(step => (
              <div key={step} className={`w-2 h-2 rounded-full ${tutStep >= step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>

        </div>
      </div>
    );
  }

  // Name Edit
  if (step === 'name') {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
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
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
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
            onClick={() => setStep('tutorial')}
            className="w-full btn btn-secondary text-lg py-4"
            disabled={uploading}
          >
            Skip for Now →
          </button>

          <button
            onClick={() => setStep('tutorial')}
            className="w-full text-center text-sm text-text-secondary hover:text-primary transition-colors mt-2"
            disabled={uploading}
          >
            Do it later
          </button>
        </div>
      </div>
    );
  }



  return null;
};

export default OnboardingFlow;
