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
    <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50">
      <div className="text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-display text-xl text-text-primary mb-2">
          Ready to create your first check-in?
        </h3>
        <p className="text-text-secondary mb-6">
          Let's walk through it together - it only takes a minute! 💜
        </p>
        
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

