import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * SettingsTutorialOverlay - Tutorial overlay for Settings page
 * Guides users through: Notifications, Messenger, Privacy, Security, Preferences
 */
const SettingsTutorialOverlay = ({
  currentStep,
  onNext,
  onBack,
  onSkip,
  isPaused,
  onPause,
  onResume,
  refs,
  hasMessenger = false
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  useEffect(() => {
    if (!currentStep || !refs) return;

    // Smart step skipping will be handled by the page component
    // (checking if notifications are already configured)

    const configs = {
      1: {
        title: 'Stay Connected',
        body: "Enable notifications so your besties can reach you in emergencies. Choose how you want to be notified - email, SMS, or push notifications.",
        buttonText: 'Try It',
        position: 'below',
        highlightedElementRef: refs.notificationSettings,
        requiresInteraction: true, // Pause tutorial and allow interaction
        onTryIt: () => {
          onPause?.();
        }
      },
      2: {
        title: 'Connect Messenger',
        body: "Link your Facebook Messenger to get free alerts. Share your link with besties to connect via Messenger - it's free and unlimited!",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.messengerLink
      },
      3: {
        title: 'Control Your Privacy',
        body: "Decide who can see your check-ins and profile. Set default privacy levels and control what information is shared. Your privacy matters.",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.privacySettings
      },
      4: {
        title: 'Extra Security (Optional)',
        body: "Want extra protection? You can set up a safety passcode or duress code. These are completely optional - only set them up if you want extra security features.",
        buttonText: 'Skip',
        position: 'auto',
        highlightedElementRef: refs.securityPasscodes
      },
      5: {
        title: 'Customize Your Experience',
        body: "Adjust app preferences, quick access settings, and more. Make Besties work exactly how you want it.",
        buttonText: 'Got It! ⚙️',
        position: 'auto',
        highlightedElementRef: refs.preferences
      }
    };

    // Skip messenger step if not available
    const adjustedConfigs = { ...configs };
    if (!hasMessenger && currentStep >= 2) {
      // Shift steps after messenger
      if (currentStep === 2) {
        adjustedConfigs[2] = configs[3];
        adjustedConfigs[3] = configs[4];
        adjustedConfigs[4] = configs[5];
        delete adjustedConfigs[5];
      }
    }

    // Smooth transition animation
    setTooltipConfig(null);
    setTimeout(() => {
      setTooltipConfig(adjustedConfigs[currentStep] || configs[currentStep]);
    }, 150);
  }, [currentStep, refs, hasMessenger, onPause]);

  if (!currentStep || !tooltipConfig) return null;

  // Adjust total steps if messenger is not available
  const totalSteps = hasMessenger ? 5 : 4;

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
      totalSteps={totalSteps}
      isPaused={isPaused}
    />
  );
};

export default SettingsTutorialOverlay;

