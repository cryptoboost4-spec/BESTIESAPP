import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * BestiesTutorialOverlay - Simplified tutorial for Besties page
 * Shows mock posts and tells users to click profile button
 */
const BestiesTutorialOverlay = ({
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

    // Single step tutorial - simple tooltip
    const config = {
      title: '💜 Welcome to Your Besties Page!',
      body: `This is your private social space where you'll see check-ins and posts from your besties. Notice the Profile button (flashing at the bottom) - click it when you're ready to continue!`,
      buttonText: 'Got it',
      position: 'auto',
      highlightedElementRef: { current: null } // No specific element highlighted
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

export default BestiesTutorialOverlay;

