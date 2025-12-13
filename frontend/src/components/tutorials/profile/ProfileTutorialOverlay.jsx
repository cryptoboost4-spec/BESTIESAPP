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
        body: "This is how your besties see you - your vibe, your style, your personality. Make it uniquely yours so your friends know it's really you when they check in! 💜",
        buttonText: 'Next',
        position: 'below',
        highlightedElementRef: refs.profileCard
      },
      2: {
        title: 'Customize Your Background',
        body: "You can change your background from here! Choose from different styles, colors, and themes to make your profile stand out. Express yourself! ✨",
        buttonText: 'I\'ll do it later',
        position: 'below',
        highlightedElementRef: refs.customizerButton
      },
      3: {
        title: 'Complete Your Profile',
        body: isProfileComplete
          ? "Great job! Your profile is looking good. Don't worry about the rest - you can always come back here to complete more tasks whenever you're ready! 💪"
          : "Here's what you can still set up. Don't worry - you can complete these tasks later at your own pace! You can come back here anytime to finish them. 👍",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.profileCompletion
      },
      4: {
        title: 'Earn Badges',
        body: "Complete check-ins, add besties, and stay active to earn badges. Show off your achievements! You can come back later to explore how to earn each one. 🏆",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.badgesSection
      },
      5: {
        title: 'Track Your Progress',
        body: "See your check-in stats, login streak, and more. Watch your numbers grow as you use Besties to stay safe.",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.statsSection
      },
      6: {
        title: 'Settings',
        body: "Tap the Settings button below to manage notifications, privacy, security, and more - or finish the tutorial now and explore settings later. Your choice! ⚙️",
        buttonText: 'Finish Tutorial',
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

