import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';
import SmallTooltip from '../SmallTooltip';

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
  hasMessenger = false,
  notificationSettingsRef = null, // Ref to NotificationSettings component
  userData = null,
  highlightedToggle = null, // Which toggle to highlight
  onToggleChange = null, // Callback when user toggles a notification
  onHighlightToggle = null, // Callback to set highlighted toggle
  onOpenTestModal = null // Callback to open test modal
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);
  const [notificationSubStep, setNotificationSubStep] = useState('initial'); // 'initial', 'ready-for-toggle-hint', 'showing-toggle-hint', 'congrats', 'test-prompt'
  const [previousNotificationState, setPreviousNotificationState] = useState(null);
  const [showToggleTooltip, setShowToggleTooltip] = useState(false);

  // Track notification state changes to detect when user toggles
  useEffect(() => {
    if (currentStep === 1 && userData && notificationSubStep === 'showing-toggle-hint') {
      const currentState = {
        telegram: userData?.notificationPreferences?.telegram || false,
        push: userData?.notificationsEnabled || false,
        sms: userData?.notificationPreferences?.sms || false
      };

      if (previousNotificationState) {
        // Check if any notification was just enabled
        const wasJustEnabled = 
          (!previousNotificationState.telegram && currentState.telegram) ||
          (!previousNotificationState.push && currentState.push) ||
          (!previousNotificationState.sms && currentState.sms);

        if (wasJustEnabled) {
          // User just enabled a notification, show congrats tooltip
          setNotificationSubStep('congrats');
          setShowToggleTooltip(false);
          onHighlightToggle?.(null);
        }
      }

      setPreviousNotificationState(currentState);
    }
  }, [userData, currentStep, notificationSubStep, previousNotificationState, onHighlightToggle]);

  // Handle toggle tooltip delay
  useEffect(() => {
    if (currentStep === 1 && notificationSubStep === 'ready-for-toggle-hint') {
      // Show toggle tooltip after 2 seconds
      const timer = setTimeout(() => {
        setShowToggleTooltip(true);
        setNotificationSubStep('showing-toggle-hint');
        // Highlight the first available toggle (prefer Telegram, then Push, then SMS)
        if (notificationSettingsRef?.current) {
          if (notificationSettingsRef.current.telegramToggle) {
            onHighlightToggle?.('telegram');
          } else if (notificationSettingsRef.current.pushToggle) {
            onHighlightToggle?.('push');
          } else if (notificationSettingsRef.current.smsToggle) {
            onHighlightToggle?.('sms');
          }
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notificationSubStep, currentStep, notificationSettingsRef, onHighlightToggle]);

  // Reset notification sub-step when step changes
  useEffect(() => {
    if (currentStep !== 1) {
      setNotificationSubStep('initial');
      onHighlightToggle?.(null);
      setPreviousNotificationState(null);
      setShowToggleTooltip(false);
    } else if (currentStep === 1 && notificationSubStep === 'initial') {
      // Reset to initial when entering step 1
      setNotificationSubStep('initial');
      // Initialize previous state
      if (userData) {
        setPreviousNotificationState({
          telegram: userData?.notificationPreferences?.telegram || false,
          push: userData?.notificationsEnabled || false,
          sms: userData?.notificationPreferences?.sms || false
        });
      }
    }
  }, [currentStep, userData, notificationSubStep, onHighlightToggle]);

  useEffect(() => {
    if (!currentStep || !refs) return;

    // Smart step skipping will be handled by the page component
    // (checking if notifications are already configured)

    const configs = {
      1: {
        title: 'Stay Connected',
        body: "We'll help you connect whatever notifications you want now. You can enable email, SMS, push notifications, or Telegram to stay in touch with your besties.",
        buttonText: 'Okay',
        secondaryButtonText: 'Add Notifications Later',
        position: 'above', // Show on top of notifications section
        highlightedElementRef: refs.notificationSettings,
        requiresInteraction: true,
        onOkay: () => {
          // User clicked "Okay" - proceed to show toggle hint
          setNotificationSubStep('ready-for-toggle-hint');
        },
        onSkip: () => {
          // User clicked "Add Notifications Later" - skip to next step
          onNext();
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
  }, [currentStep, refs, hasMessenger, onPause, onNext]);

  if (!currentStep || !tooltipConfig) return null;

  // Adjust total steps if messenger is not available
  const totalSteps = hasMessenger ? 5 : 4;

  // Handle button clicks for step 1
  const handleStep1Action = (action) => {
    if (action === 'okay' && tooltipConfig.onOkay) {
      tooltipConfig.onOkay();
    } else if (action === 'skip' && tooltipConfig.onSkip) {
      tooltipConfig.onSkip();
    }
  };

  // Handle notification sub-step actions
  const handleNotificationAction = (action) => {
    if (action === 'add-another') {
      // Reset to show toggle hint again
      setNotificationSubStep('ready-for-toggle-hint');
      onHighlightToggle?.(null);
      // Reset previous state to current state so we can detect the next toggle
      if (userData) {
        setPreviousNotificationState({
          telegram: userData?.notificationPreferences?.telegram || false,
          push: userData?.notificationsEnabled || false,
          sms: userData?.notificationPreferences?.sms || false
        });
      }
    } else if (action === 'move-on') {
      // Ask if they want to test notifications
      setNotificationSubStep('test-prompt');
    }
  };

  // Handle test notification prompt
  const handleTestPrompt = (wantsToTest) => {
    if (wantsToTest) {
      // Open test modal
      onOpenTestModal?.();
      onPause?.();
      // After test modal closes, continue to next step
      // This will be handled by the parent component
    } else {
      // Skip testing, go to next step
      onNext();
    }
  };

  // Get toggle ref for small tooltip
  const getToggleRef = () => {
    if (!notificationSettingsRef?.current) return null;
    if (highlightedToggle === 'telegram') return notificationSettingsRef.current.telegramToggle;
    if (highlightedToggle === 'push') return notificationSettingsRef.current.pushToggle;
    if (highlightedToggle === 'sms') return notificationSettingsRef.current.smsToggle;
    return null;
  };

  // Custom render for step 1 with sub-steps
  if (currentStep === 1) {
    return (
      <>
        {/* Main overlay for notifications section */}
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleStep1Action('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={{
            ...tooltipConfig,
            buttonText: 'Okay',
            // Custom button handler
            onNext: () => handleStep1Action('okay')
          }}
          stepNumber={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused || notificationSubStep !== 'initial'}
        />

        {/* Secondary "Add Notifications Later" button - custom tooltip */}
        {notificationSubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleStep1Action('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Add Notifications Later
            </button>
          </div>
        )}

        {/* Small tooltip pointing at toggle (after 2 seconds) */}
        {showToggleTooltip && notificationSubStep === 'showing-toggle-hint' && getToggleRef() && (
          <SmallTooltip
            message="Turn on a toggle for notifications you want to enable"
            targetElement={getToggleRef()}
            position="auto"
            delay={0}
          />
        )}

        {/* Congrats tooltip after user toggles a notification */}
        {notificationSubStep === 'congrats' && (
          <SmallTooltip
            message="Congrats on connecting! Did you want to add another one, or move on?"
            targetElement={refs.notificationSettings?.current}
            position="auto"
            showAction={true}
            actionText="Add Another"
            onAction={() => handleNotificationAction('add-another')}
            onClose={() => handleNotificationAction('move-on')}
            delay={0}
          />
        )}

        {/* Test notification prompt */}
        {notificationSubStep === 'test-prompt' && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border-2 border-purple-200 dark:border-purple-700">
              <h3 className="text-xl font-display text-text-primary mb-3">
                Test Your Notifications?
              </h3>
              <p className="text-text-secondary mb-6">
                Would you like to test your notification setup to make sure everything works?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTestPrompt(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleTestPrompt(true)}
                  className="flex-1 btn btn-primary"
                >
                  Test Now
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Normal flow for other steps
  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={onNext}
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

