import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * Bestie Challenges Tutorial
 *
 * Guides users through challenges page
 * Shows how to invite besties and track progress
 */

const TUTORIAL_STEPS = {
  STEP_1: 1, // Show challenge library
  STEP_2: 2, // Highlight invite button
  STEP_3: 3, // Show progress tracking
};

const ChallengesTutorialOverlay = ({ isActive, onComplete }) => {
  const [step, setStep] = useState(TUTORIAL_STEPS.STEP_1);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowTooltip(true);
    }
  }, [isActive, step]);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.STEP_3) {
      setShowTooltip(false);
      setTimeout(() => {
        setStep(step + 1);
      }, 300);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f472b6', '#a855f7']
    });

    setTimeout(() => {
      localStorage.setItem('challengesTutorialSeen', 'true');
      if (onComplete) {
        onComplete();
      }
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('challengesTutorialSeen', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" />

      {/* Tutorial tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            <TutorialTooltip
              step={step}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const TutorialTooltip = ({ step, onNext, onSkip }) => {
  const content = {
    [TUTORIAL_STEPS.STEP_1]: {
      icon: "🏆",
      title: "Bestie Challenges",
      text: "Pick a challenge to do with a bestie - you'll both work toward the same goal and earn rewards together!",
      btn: "Show me"
    },
    [TUTORIAL_STEPS.STEP_2]: {
      icon: "👥",
      title: "Both Must Accept",
      text: "When you pick a challenge, your bestie gets an invitation. Both of you must accept for the challenge to start!",
      btn: "Got it"
    },
    [TUTORIAL_STEPS.STEP_3]: {
      icon: "📊",
      title: "Track Together",
      text: "Track your progress together with live progress bars. When you both complete it, you both earn rewards! 💜",
      btn: "Let's do this!"
    },
  }[step];

  if (!content) return null;

  return (
    <motion.div
      className="w-11/12 max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border border-purple-200 dark:border-purple-700"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", bounce: 0.4 }}
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Skip tutorial"
      >
        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Icon */}
      <div className="text-4xl mb-4 animate-bounce-gentle">{content.icon}</div>

      {/* Title */}
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-2">
        {content.title}
      </h3>

      {/* Body */}
      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-sm">
        {content.text}
      </p>

      {/* Button */}
      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
      >
        <span className="relative z-10">{content.btn}</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
      </button>
    </motion.div>
  );
};

export default ChallengesTutorialOverlay;
