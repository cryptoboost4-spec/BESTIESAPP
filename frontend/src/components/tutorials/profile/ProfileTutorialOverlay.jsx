import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * ProfileTutorialOverlay - Simplified tutorial for Profile page
 * Only shows step 2: Customize Your Background
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
  profileCompletion = 0,
  onLater
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  useEffect(() => {
    if (!currentStep || !refs) return;

    // Only show step 2 (Customize Your Background)
    if (currentStep === 2) {
      const config = {
        title: 'Customize Your Background',
        body: "You can change your background from here! Choose from different styles, colors, and themes to make your profile stand out. Express yourself! ✨",
        buttonText: 'I\'ll do it later',
        position: 'below',
        highlightedElementRef: refs.customizerButton,
        onLater: onLater // Callback for "I'll do it later" button
      };

      // Smooth transition animation
      setTooltipConfig(null);
      setTimeout(() => {
        setTooltipConfig(config);
      }, 150);
    } else {
      setTooltipConfig(null);
    }
  }, [currentStep, refs, onLater]);

  if (!currentStep || currentStep !== 2 || !tooltipConfig) return null;

  // Handle "I'll do it later" button click
  const handleNext = () => {
    if (tooltipConfig.onLater) {
      tooltipConfig.onLater();
    } else {
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
      stepNumber={2}
      totalSteps={1}
      isPaused={isPaused}
    />
  );
};

export default ProfileTutorialOverlay;

