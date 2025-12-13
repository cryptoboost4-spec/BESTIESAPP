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
  notificationSettingsRef = null,
  messengerLinkComponentRef = null,
  privacySettingsComponentRef = null,
  securityPasscodesComponentRef = null,
  preferencesComponentRef = null,
  userData = null,
  highlightedToggle = null,
  highlightedMessengerButton = null,
  highlightedPrivacyElement = null,
  highlightedSecurityElement = null,
  highlightedPreferenceElement = null,
  onToggleChange = null,
  onHighlightToggle = null,
  onHighlightMessengerButton = null,
  onHighlightPrivacyElement = null,
  onHighlightSecurityElement = null,
  onHighlightPreferenceElement = null,
  onOpenTestModal = null
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  // Step 1: Notifications sub-steps
  const [notificationSubStep, setNotificationSubStep] = useState('initial');
  const [previousNotificationState, setPreviousNotificationState] = useState(null);
  const [showToggleTooltip, setShowToggleTooltip] = useState(false);

  // Step 2: Messenger sub-steps
  const [messengerSubStep, setMessengerSubStep] = useState('initial'); // 'initial', 'showing-copy-hint', 'copied'

  // Step 3: Privacy sub-steps
  const [privacySubStep, setPrivacySubStep] = useState('initial'); // 'initial', 'showing-toggle-hint', 'showing-radio-hint'

  // Step 4: Security sub-steps
  const [securitySubStep, setSecuritySubStep] = useState('initial'); // 'initial', 'showing-learn-more', 'showing-passcode-card'

  // Step 5: Preferences sub-steps
  const [preferencesSubStep, setPreferencesSubStep] = useState('initial'); // 'initial', 'showing-dark-mode', 'showing-data-retention'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, currentStep, notificationSubStep, previousNotificationState]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSubStep, currentStep, notificationSettingsRef]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, userData]);

  // Reset messenger sub-step when step changes
  useEffect(() => {
    if (currentStep !== 2) {
      setMessengerSubStep('initial');
      onHighlightMessengerButton?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Reset privacy sub-step when step changes
  useEffect(() => {
    if (currentStep !== 3) {
      setPrivacySubStep('initial');
      onHighlightPrivacyElement?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Reset security sub-step when step changes
  useEffect(() => {
    if (currentStep !== 4) {
      setSecuritySubStep('initial');
      onHighlightSecurityElement?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Reset preferences sub-step when step changes
  useEffect(() => {
    if (currentStep !== 5) {
      setPreferencesSubStep('initial');
      onHighlightPreferenceElement?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle Messenger copy button highlight
  useEffect(() => {
    if (currentStep === 2 && messengerSubStep === 'showing-copy-hint') {
      setTimeout(() => {
        onHighlightMessengerButton?.('copy');
      }, 500);
    }
  }, [currentStep, messengerSubStep, onHighlightMessengerButton]);

  // Handle Privacy toggle highlight
  useEffect(() => {
    if (currentStep === 3 && privacySubStep === 'showing-toggle-hint') {
      setTimeout(() => {
        onHighlightPrivacyElement?.('statsToggle');
      }, 500);
    }
  }, [currentStep, privacySubStep, onHighlightPrivacyElement]);

  // Handle Security learn more button highlight
  useEffect(() => {
    if (currentStep === 4 && securitySubStep === 'showing-learn-more') {
      setTimeout(() => {
        onHighlightSecurityElement?.('learnMoreButton');
      }, 500);
    }
  }, [currentStep, securitySubStep, onHighlightSecurityElement]);

  // Handle Preferences dark mode toggle highlight
  useEffect(() => {
    if (currentStep === 5 && preferencesSubStep === 'showing-dark-mode') {
      setTimeout(() => {
        onHighlightPreferenceElement?.('darkModeToggle');
      }, 500);
    }
  }, [currentStep, preferencesSubStep, onHighlightPreferenceElement]);

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
        title: 'Share Your Safety Link',
        body: "Copy and share your personal Messenger link with trusted contacts. When they message you, they'll be connected for 20 hours and can receive your safety alerts.",
        buttonText: 'Okay',
        secondaryButtonText: 'Skip This',
        position: 'auto',
        highlightedElementRef: refs.messengerLink,
        onOkay: () => {
          setMessengerSubStep('showing-copy-hint');
        },
        onSkip: () => {
          onNext();
        }
      },
      3: {
        title: 'Control Your Privacy',
        body: "Decide who can see your check-ins. You can share with all besties, just your circle, or keep them private until alerts.",
        buttonText: 'Okay',
        secondaryButtonText: 'Skip This',
        position: 'auto',
        highlightedElementRef: refs.privacySettings,
        onOkay: () => {
          setPrivacySubStep('showing-toggle-hint');
        },
        onSkip: () => {
          onNext();
        }
      },
      4: {
        title: 'Extra Security (Optional)',
        body: "Want extra protection? You can set up a safety passcode or duress code. These are completely optional - only set them up if you want extra security features.",
        buttonText: 'Okay',
        secondaryButtonText: 'Skip This',
        position: 'auto',
        highlightedElementRef: refs.securityPasscodes,
        onOkay: () => {
          setSecuritySubStep('showing-learn-more');
        },
        onSkip: () => {
          onNext();
        }
      },
      5: {
        title: 'Customize Your Experience',
        body: "Adjust dark mode, data retention, and more. Make Besties work exactly how you want it.",
        buttonText: 'Okay',
        secondaryButtonText: 'Finish Tutorial',
        position: 'auto',
        highlightedElementRef: refs.preferences,
        onOkay: () => {
          setPreferencesSubStep('showing-dark-mode');
        },
        onSkip: () => {
          onNext();
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, refs, hasMessenger, onPause]);

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

  // Custom render for step 2: Messenger with sub-steps
  if (currentStep === 2) {
    const handleMessengerAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'continue') {
        onNext();
      }
    };

    const getCopyButtonRef = () => {
      if (!messengerLinkComponentRef?.current) return null;
      return messengerLinkComponentRef.current.copyButton;
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleMessengerAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused || messengerSubStep !== 'initial'}
        />

        {messengerSubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleMessengerAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Skip This
            </button>
          </div>
        )}

        {messengerSubStep === 'showing-copy-hint' && getCopyButtonRef() && (
          <SmallTooltip
            message="Click to copy your link, then share it with trusted contacts!"
            targetElement={getCopyButtonRef()}
            position="auto"
            showAction={true}
            actionText="Got It"
            onAction={() => handleMessengerAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Custom render for step 3: Privacy with sub-steps
  if (currentStep === 3) {
    const handlePrivacyAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'show-radio') {
        setPrivacySubStep('showing-radio-hint');
        onHighlightPrivacyElement?.('circleRadio');
      } else if (action === 'continue') {
        onNext();
      }
    };

    const getStatsToggleRef = () => {
      if (!privacySettingsComponentRef?.current) return null;
      return privacySettingsComponentRef.current.statsToggle;
    };

    const getCircleRadioRef = () => {
      if (!privacySettingsComponentRef?.current) return null;
      return privacySettingsComponentRef.current.circleRadio;
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handlePrivacyAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused || privacySubStep !== 'initial'}
        />

        {privacySubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handlePrivacyAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Skip This
            </button>
          </div>
        )}

        {privacySubStep === 'showing-toggle-hint' && getStatsToggleRef() && (
          <SmallTooltip
            message="Control whether besties can see your stats and check-in history"
            targetElement={getStatsToggleRef()}
            position="auto"
            showAction={true}
            actionText="Next"
            onAction={() => handlePrivacyAction('show-radio')}
            delay={0}
          />
        )}

        {privacySubStep === 'showing-radio-hint' && getCircleRadioRef() && (
          <SmallTooltip
            message="We recommend 'Bestie Circle Only' for the best balance of privacy and connection"
            targetElement={getCircleRadioRef()}
            position="auto"
            showAction={true}
            actionText="Got It"
            onAction={() => handlePrivacyAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Custom render for step 4: Security with sub-steps
  if (currentStep === 4) {
    const handleSecurityAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'show-passcode') {
        setSecuritySubStep('showing-passcode-card');
        onHighlightSecurityElement?.('safetyPasscodeCard');
      } else if (action === 'continue') {
        onNext();
      }
    };

    const getLearnMoreButtonRef = () => {
      if (!securityPasscodesComponentRef?.current) return null;
      return securityPasscodesComponentRef.current.learnMoreButton;
    };

    const getSafetyPasscodeCardRef = () => {
      if (!securityPasscodesComponentRef?.current) return null;
      return securityPasscodesComponentRef.current.safetyPasscodeCard;
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleSecurityAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused || securitySubStep !== 'initial'}
        />

        {securitySubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleSecurityAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Skip This
            </button>
          </div>
        )}

        {securitySubStep === 'showing-learn-more' && getLearnMoreButtonRef() && (
          <SmallTooltip
            message="Click to learn how passcodes protect you from coercion"
            targetElement={getLearnMoreButtonRef()}
            position="auto"
            showAction={true}
            actionText="Next"
            onAction={() => handleSecurityAction('show-passcode')}
            delay={0}
          />
        )}

        {securitySubStep === 'showing-passcode-card' && getSafetyPasscodeCardRef() && (
          <SmallTooltip
            message="Set this up anytime to prevent others from canceling your alerts"
            targetElement={getSafetyPasscodeCardRef()}
            position="auto"
            showAction={true}
            actionText="Got It"
            onAction={() => handleSecurityAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Custom render for step 5: Preferences with sub-steps
  if (currentStep === 5) {
    const handlePreferencesAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'show-data-retention') {
        setPreferencesSubStep('showing-data-retention');
        onHighlightPreferenceElement?.('dataRetentionToggle');
      } else if (action === 'continue') {
        onNext();
      }
    };

    const getDarkModeToggleRef = () => {
      if (!preferencesComponentRef?.current) return null;
      return preferencesComponentRef.current.darkModeToggle;
    };

    const getDataRetentionToggleRef = () => {
      if (!preferencesComponentRef?.current) return null;
      return preferencesComponentRef.current.dataRetentionToggle;
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handlePreferencesAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused || preferencesSubStep !== 'initial'}
        />

        {preferencesSubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handlePreferencesAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Finish Tutorial
            </button>
          </div>
        )}

        {preferencesSubStep === 'showing-dark-mode' && getDarkModeToggleRef() && (
          <SmallTooltip
            message="Toggle between light and dark themes - try it now!"
            targetElement={getDarkModeToggleRef()}
            position="auto"
            showAction={true}
            actionText="Next"
            onAction={() => handlePreferencesAction('show-data-retention')}
            delay={0}
          />
        )}

        {preferencesSubStep === 'showing-data-retention' && getDataRetentionToggleRef() && (
          <SmallTooltip
            message="Choose whether to keep all your check-in history or auto-delete after 7 days for privacy"
            targetElement={getDataRetentionToggleRef()}
            position="auto"
            showAction={true}
            actionText="Finish"
            onAction={() => handlePreferencesAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Normal flow fallback (shouldn't reach here with current design)
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

