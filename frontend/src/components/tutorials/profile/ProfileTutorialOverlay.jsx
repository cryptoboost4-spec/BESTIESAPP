import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * ProfileTutorialOverlay - Tutorial overlay for Profile page
 * Guides users through: Profile Card, Customization, Completion, Badges, Stats, Settings
 */
const ProfileTutorialOverlay = ({
  currentStep,
  onNext,
  onBack,
  onSkip,
  isPaused,
  onPause,
  onResume,
  refs,
  profileCompletion = 0
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  useEffect(() => {
    if (!currentStep || !refs) return;

    const isProfileComplete = profileCompletion >= 50;

    const configs = {
      1: {
        title: 'Your Profile',
        body: "This is how your besties see you. Customize your photo, colors, and style to make it yours. Tap the edit button to get started.",
        buttonText: 'Next',
        position: 'below',
        highlightedElementRef: refs.profileCard
      },
      2: {
        title: 'Make It Yours',
        body: "Customize your profile with different layouts, backgrounds, and themes. Express yourself! Your besties will see your unique style.",
        buttonText: 'Try It',
        position: 'auto',
        highlightedElementRef: refs.customizerButton,
        requiresInteraction: true, // Pause tutorial and allow interaction
        onTryIt: () => {
          onPause?.();
          // The customizer will be opened by the page component
        }
      },
      3: {
        title: 'Complete Your Profile',
        body: isProfileComplete
          ? "Great job! Your profile is looking good. You can always come back here to see what else you can add."
          : "See what's left to set up. Complete your profile to unlock badges and get the most out of Besties. Tap any item to jump to that setting.",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.profileCompletion
      },
      4: {
        title: 'Earn Badges',
        body: "Complete check-ins, add besties, and stay active to earn badges. Show off your achievements! Tap badges to see how to earn them.",
        buttonText: 'Try It',
        position: 'auto',
        highlightedElementRef: refs.badgesSection,
        requiresInteraction: true, // Pause tutorial and allow interaction
        onTryIt: () => {
          onPause?.();
        }
      },
      5: {
        title: 'Track Your Progress',
        body: "See your check-in stats, login streak, and more. Watch your numbers grow as you use Besties to stay safe.",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.statsSection
      },
      6: {
        title: 'Fine-Tune Settings',
        body: "Tap here to manage notifications, privacy, security, and more. Make Besties work exactly how you want it.",
        buttonText: 'Got It! ✨',
        position: 'auto',
        highlightedElementRef: refs.settingsButton
      }
    };

    // Smooth transition animation
    setTooltipConfig(null);
    setTimeout(() => {
      setTooltipConfig(configs[currentStep]);
    }, 150);
  }, [currentStep, refs, profileCompletion, onPause]);

  if (!currentStep || !tooltipConfig) return null;

  // Handle "Try It" button click for interactive steps
  const handleNext = () => {
    if (tooltipConfig.requiresInteraction && tooltipConfig.onTryIt) {
      // Pause tutorial and allow interaction
      tooltipConfig.onTryIt();
    } else {
      // Normal next step
      onNext();
    }
  };

  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={handleNext}
      onStepBack={onBack}
      onTutorialComplete={onSkip}
      highlightedElementRef={tooltipConfig.highlightedElementRef}
      tooltipConfig={tooltipConfig}
      stepNumber={currentStep}
      totalSteps={6}
      isPaused={isPaused}
    />
  );
};

export default ProfileTutorialOverlay;

