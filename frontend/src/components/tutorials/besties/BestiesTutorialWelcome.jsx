import React from 'react';
import haptic from '../../../utils/hapticFeedback';

/**
 * BestiesTutorialWelcome - Welcome card before tutorial starts
 */
const BestiesTutorialWelcome = ({ onStart, onSkip }) => {
  const handleStart = () => {
    haptic.light();
    onStart?.();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip?.();
  };

  return (
    <div className="card p-6 mb-6 shadow-2xl ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50 animate-fade-slide-down relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-purple-50/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 pointer-events-none" />
      
      <div className="text-center relative z-10">
        <div className="text-5xl mb-3 animate-bounce-gentle">💜</div>
        <h3 className="font-display text-2xl text-text-primary mb-2 font-bold">
          Welcome to Your Besties Space!
        </h3>
        <p className="text-text-secondary mb-4 leading-relaxed text-base">
          This is your private social hub - only your besties see what's shared here. Let's take a quick look around! ✨
        </p>
        
        {/* Purple highlight box - Enhanced */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-2 border-purple-300 dark:border-purple-600 rounded-xl p-4 mb-4 shadow-lg">
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            🔒 Private & Safe - No algorithm, no strangers, just your circle
          </p>
        </div>
        
        {/* Time estimate - Enhanced */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-6">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
            ⏱️ About 90 seconds
          </p>
        </div>
        
        <button
          onClick={handleStart}
          className="btn bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-lg py-3 px-8 mb-3 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 w-full sm:w-auto font-bold relative overflow-hidden group"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite'
          }}
        >
          <span className="relative z-10">Show Me Around ✨</span>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </button>
        
        <div>
          <button
            onClick={handleSkip}
            className="text-sm text-text-secondary hover:text-primary underline transition-colors font-medium"
          >
            I'll Explore Myself
          </button>
        </div>
      </div>
    </div>
  );
};

export default BestiesTutorialWelcome;

