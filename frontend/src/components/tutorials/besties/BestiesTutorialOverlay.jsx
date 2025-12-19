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

    // Single step tutorial - mobile-optimized tooltip over activity feed
    const config = {
      title: '💜 This is Your Besties Page!',
      body: `This is your private social space! Scroll through the activity feed below to learn more about what you can do here. When you're ready to move on, click the Profile button (now flashing) at the bottom.`,
      buttonText: 'Got it',
      position: 'below', // Position below/over the activity feed
      highlightedElementRef: refs?.activityFeed || { current: null }
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

