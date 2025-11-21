import React, { useEffect, useState } from 'react';
import ConfettiCelebration from './ConfettiCelebration';

const ProfileCompletionModal = ({ isOpen, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-close confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Confetti */}
      {showConfetti && <ConfettiCelebration />}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        {/* Modal Card */}
        <div className="card max-w-lg w-full p-8 animate-scale-up relative overflow-hidden bg-white dark:bg-gray-800">
          {/* Floating decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-6 left-6 text-3xl animate-float opacity-60">⭐</div>
            <div className="absolute top-10 right-8 text-2xl animate-float delay-1s opacity-50">💫</div>
            <div className="absolute bottom-10 left-10 text-2xl animate-float delay-2s opacity-60">✨</div>
            <div className="absolute bottom-6 right-6 text-3xl animate-float delay-3s opacity-50">🎉</div>
          </div>

          <div className="relative z-10 text-center">
            {/* Badge Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full mb-6 shadow-2xl animate-bounce-slow">
              <span className="text-5xl">⭐</span>
            </div>

            {/* Congratulations Text */}
            <h2 className="text-4xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Congratulations!
            </h2>

            <h3 className="text-2xl font-display text-text-primary dark:text-white mb-4">
              Profile Perfectionist Unlocked!
            </h3>

            <p className="text-lg text-text-secondary dark:text-gray-300 mb-6 max-w-md mx-auto">
              You've completed your entire profile! Your besties can now see all your info, and you're all set to stay safe together.
            </p>

            {/* Badge Display */}
            <div className="inline-block bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl p-6 mb-6 border-2 border-pink-200 dark:border-pink-700 shadow-xl">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-xl font-display text-text-primary dark:text-white mb-1">Profile Perfectionist</div>
              <div className="text-sm text-text-secondary dark:text-gray-300">
                Completed your full profile
              </div>
            </div>

            {/* Fun Stats */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 rounded-xl p-4 mb-6 border border-pink-200 dark:border-pink-800">
              <div className="text-sm font-semibold text-text-primary dark:text-white mb-2">
                🎯 Profile Complete! Here's what you unlocked:
              </div>
              <div className="space-y-1 text-xs text-text-secondary dark:text-gray-300">
                <div>✅ Full profile visibility to your besties</div>
                <div>✅ Profile Perfectionist badge</div>
                <div>✅ Priority support access</div>
                <div>✅ Shareable profile cards</div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="btn btn-primary w-full max-w-xs mx-auto shadow-lg hover:shadow-xl transition-all"
            >
              Awesome! Let's Go! 🎉
            </button>

            <p className="text-xs text-text-secondary dark:text-gray-400 mt-4">
              Check your Notifications to see your new badge
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCompletionModal;
