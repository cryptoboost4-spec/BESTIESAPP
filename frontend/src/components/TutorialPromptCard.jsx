import React from 'react';
import haptic from '../utils/hapticFeedback';

const TutorialPromptCard = ({ onStartTutorial, onSkip }) => {
  const handleStart = () => {
    haptic.light();
    onStartTutorial?.();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip?.();
  };

  return (
    <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="text-center">
        <div className="text-4xl mb-3">💜</div>
        <h3 className="font-display text-xl text-text-primary mb-2">
          Let's Learn How to Create Check-Ins
        </h3>
        <p className="text-text-secondary mb-4 leading-relaxed">
          We'll walk you through the different check-in types together. It only takes a minute, and you'll feel so much more confident knowing your bestie has your back.
        </p>
        
        {/* Green highlight box */}
        <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
            ✅ This is a safe practice space
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            You're taking control of your safety. That's something to be proud of! ✨
          </p>
        </div>
        
        {/* Blue highlight box */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-6">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            ⏱️ This takes about 1 minute. You can skip anytime if you already know how it works.
          </p>
        </div>
        
        <button
          onClick={handleStart}
          className="btn btn-primary text-lg py-3 px-8 mb-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all w-full sm:w-auto"
        >
          Start Tutorial
        </button>
        
        <div>
          <button
            onClick={handleSkip}
            className="text-sm text-text-secondary hover:text-text-primary underline transition-colors"
          >
            Skip - I know how this works
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialPromptCard;

