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
          You're Doing the Right Thing
        </h3>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Creating your first check-in is quick and easy. We'll walk you through it together - it only takes a minute, and you'll feel so much more confident knowing your bestie has your back.
        </p>
        <p className="text-sm text-text-secondary mb-6">
          This is a safe space, and you're taking control of your safety. That's something to be proud of! ✨
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

