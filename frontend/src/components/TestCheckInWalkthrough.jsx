import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';

const TestCheckInWalkthrough = ({ onComplete, onSkip }) => {
  const { userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [selectedBestie, setSelectedBestie] = useState(null);
  const [location, setLocation] = useState('');

  const steps = [
    {
      title: 'Welcome to Test Mode! 🎓',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
              ✅ This is a safe practice mode
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              <strong>No real check-in will be created.</strong> This is just to help you learn how it works!
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Let's practice creating a check-in together! You'll learn everything step-by-step.
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            You'll learn how to:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside ml-4">
            <li>Select a location for your check-in</li>
            <li>Set how long until you'll be back</li>
            <li>Choose which besties should be notified</li>
            <li>Understand what happens when the timer runs out</li>
            <li>How to mark yourself safe</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 mt-4">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              ⏱️ This takes about 2 minutes. You can skip anytime with the ✕ button in the top right.
            </p>
          </div>
        </div>
      ),
      emoji: '🎓'
    },
    {
      title: 'Step 1: Choose Your Location 📍',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            First, tell us where you'll be. This helps your besties find you if needed.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Coffee shop downtown"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => {
                haptic.light();
                setLocation('Current Location (GPS)');
              }}
              className="w-full btn btn-secondary text-sm py-2"
            >
              📍 Use Current Location
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: You can use GPS or type any address
          </p>
        </div>
      ),
      emoji: '📍',
      canProceed: () => location.trim().length > 0
    },
    {
      title: 'Step 2: Set Your Duration ⏰',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            How long until you'll be back? Your besties get notified if you don't check in by then.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  haptic.light();
                  setSelectedDuration(mins);
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedDuration === mins
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⏰ Timer set: {selectedDuration} minutes
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              If you don't mark yourself safe in {selectedDuration} minutes, your besties get an alert!
            </p>
          </div>
        </div>
      ),
      emoji: '⏰',
      canProceed: () => selectedDuration > 0
    },
    {
      title: 'Step 3: Select Your Besties 💜',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Choose which besties should be notified if you don't check back in.
          </p>
          {userData?.stats?.totalBesties > 0 ? (
            <div className="space-y-2">
              <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4">
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                  💜 Your Besties (Select one for this test)
                </p>
                <div className="space-y-2">
                  {[1, 2, 3].slice(0, Math.min(3, userData.stats.totalBesties)).map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        haptic.light();
                        setSelectedBestie(num);
                      }}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedBestie === num
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      👤 Bestie {num} {selectedBestie === num && '✓'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 In real check-ins, you can select multiple besties from your circle
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You need to add besties first! They'll appear here once you add them.
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                For this test, you can still continue to see how it works.
              </p>
            </div>
          )}
        </div>
      ),
      emoji: '💜',
      canProceed: () => {
        // Allow proceeding even without besties in test mode - just show them what it would look like
        if (userData?.stats?.totalBesties > 0) {
          return selectedBestie !== null;
        }
        return true; // Can proceed without besties in test mode
      }
    },
    {
      title: 'Step 4: What Happens Next? 🎯',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Here's what happens when you create a real check-in:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="text-2xl">1️⃣</div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Check-in Starts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your {selectedDuration}-minute timer begins counting down
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">2️⃣</div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">You Go About Your Day</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The app runs in the background - you don't need to keep it open
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">3️⃣</div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Mark Yourself Safe</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When you're back, tap "I'm Safe" and your besties get a notification that you're okay
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">4️⃣</div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">If You Don't Check In</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  After {selectedDuration} minutes, your besties get an SMS alert with your location ({location || 'your location'}) and any notes you added
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      emoji: '🎯'
    },
    {
      title: 'You\'re Ready! 🎉',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            You now know how check-ins work! When you're ready, create your first real check-in.
          </p>
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ What you learned:
            </p>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
              <li>How to set location and duration</li>
              <li>How to select besties to notify</li>
              <li>What happens when timer runs out</li>
              <li>How to mark yourself safe</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Ready to create your first real check-in? Use the buttons on the home page! 💜
          </p>
        </div>
      ),
      emoji: '🎉'
    }
  ];

  const currentStepData = steps[currentStep];
  const canProceed = currentStepData.canProceed ? currentStepData.canProceed() : true;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    haptic.light();
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    haptic.light();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{currentStepData.emoji}</div>
            <div>
              <h2 className="text-xl font-display text-gray-800 dark:text-gray-200">
                {currentStepData.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl transition-colors"
            title="Skip tutorial"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 btn btn-secondary"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 btn btn-primary ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canProceed ? 'Please complete this step to continue' : ''}
          >
            {isLastStep ? 'Complete Tutorial ✓' : canProceed ? 'Next →' : 'Complete this step →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCheckInWalkthrough;

