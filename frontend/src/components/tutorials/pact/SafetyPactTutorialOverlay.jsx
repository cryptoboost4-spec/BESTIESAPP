import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * Safety Pact Tutorial
 *
 * Guides users through the Safety Pact feature
 * Explains the significance and how to activate it
 */

const TUTORIAL_STEPS = {
  STEP_1: 1, // Highlight the button
  STEP_2: 2, // Explain the commitment
  STEP_3: 3, // After pact activated
};

const SafetyPactTutorialOverlay = ({ isActive, onComplete, hasActivePact = false }) => {
  const [step, setStep] = useState(TUTORIAL_STEPS.STEP_1);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Skip to step 3 if pact is already active
      if (hasActivePact) {
        setStep(TUTORIAL_STEPS.STEP_3);
      }
      setShowTooltip(true);
    }
  }, [isActive, hasActivePact]);

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
    // Heart-themed confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f472b6', '#fbbf24'],
      shapes: ['circle']
    });

    setTimeout(() => {
      localStorage.setItem('safetyPactTutorialSeen', 'true');
      if (onComplete) {
        onComplete();
      }
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('safetyPactTutorialSeen', 'true');
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
      icon: "💜",
      title: "Safety Pact",
      text: "This is special - make a promise to always use the app when you don't feel 100% safe. It's a commitment between you and your bestie.",
      btn: "Tell me more"
    },
    [TUTORIAL_STEPS.STEP_2]: {
      icon: "🤝",
      title: "Sacred Promise",
      text: "This is a commitment between you and your bestie - both must promise for it to activate. It's about looking out for each other.",
      btn: "I understand"
    },
    [TUTORIAL_STEPS.STEP_3]: {
      icon: "✨",
      title: "Your Pact is Active",
      text: "Your pact is active! You'll see gentle reminders when you honor it by checking in. Keep that promise strong! 💜",
      btn: "Perfect!"
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

export default SafetyPactTutorialOverlay;
