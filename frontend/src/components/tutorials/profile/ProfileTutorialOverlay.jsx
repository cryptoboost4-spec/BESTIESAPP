import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * ProfileTutorialOverlay - Single tooltip for Profile page
 * Explains this is the profile page and to go through it all, then click settings
 */
const ProfileTutorialOverlay = ({
  currentStep,
  onNext,
  onBack,
  onSkip,
  isPaused,
  refs
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  useEffect(() => {
    if (!currentStep || currentStep !== 1) return;

    // Single step tutorial - explain the profile page
    const config = {
      title: '💜 This is Your Profile Page!',
      body: `This is your profile! Scroll through everything here to explore all your stats, badges, and settings. When you're ready to move on, click the Settings button at the bottom.`,
      buttonText: 'Got it',
      position: 'auto',
      highlightedElementRef: refs?.profileCard || { current: null }
    };

    setTooltipConfig(config);
  }, [currentStep, refs]);

  if (!currentStep || currentStep !== 1 || !tooltipConfig) return null;

  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={onNext}
      onStepBack={onBack}
      onTutorialComplete={onSkip}
      highlightedElementRef={tooltipConfig.highlightedElementRef}
      tooltipConfig={tooltipConfig}
      stepNumber={1}
      totalSteps={1}
      isPaused={isPaused}
    />
  );
};

export default ProfileTutorialOverlay;

