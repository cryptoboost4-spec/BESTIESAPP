import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';
import SmallTooltip from '../SmallTooltip';

/**
 * BestiesTutorialOverlay - Interactive tutorial for Besties page
 * Guides users through: Activity Feed, Post Button, Add Bestie, Besties Grid
 */
const BestiesTutorialOverlay = ({
  currentStep,
  onNext,
  onBack,
  onSkip,
  isPaused,
  onPause,
  onResume,
  refs,
  activityFeedLength = 0,
  activityFeedComponentRef = null,
  addBestieFabRef = null,
  bestiesGridComponentRef = null,
  onHighlightReactionButton = null,
  onHighlightAddButton = null,
  onHighlightBestieCard = null,
  highlightedReactionButton = null,
  highlightedAddButton = null,
  highlightedBestieCard = null
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  // Step 1: Activity Feed sub-steps
  const [activitySubStep, setActivitySubStep] = useState('initial'); // 'initial', 'showing-reactions', 'reacted'

  // Step 2: Post button (already handled by modal)
  const [postSubStep, setPostSubStep] = useState('initial');

  // Step 3: Add Bestie sub-steps
  const [addBestieSubStep, setAddBestieSubStep] = useState('initial'); // 'initial', 'showing-button'

  // Step 4: Besties Grid sub-steps
  const [gridSubStep, setGridSubStep] = useState('initial'); // 'initial', 'showing-card', 'showing-symbols'

  // Reset sub-steps when step changes
  useEffect(() => {
    if (currentStep !== 1) {
      setActivitySubStep('initial');
      onHighlightReactionButton?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 2) {
      setPostSubStep('initial');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 3) {
      setAddBestieSubStep('initial');
      onHighlightAddButton?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 4) {
      setGridSubStep('initial');
      onHighlightBestieCard?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle Add Bestie button highlight
  useEffect(() => {
    if (currentStep === 3 && addBestieSubStep === 'showing-button') {
      setTimeout(() => {
        onHighlightAddButton?.(true);
      }, 500);
    }
  }, [currentStep, addBestieSubStep, onHighlightAddButton]);

  // Handle Bestie card highlight
  useEffect(() => {
    if (currentStep === 4 && gridSubStep === 'showing-card') {
      setTimeout(() => {
        onHighlightBestieCard?.(true);
      }, 500);
    }
  }, [currentStep, gridSubStep, onHighlightBestieCard]);

  useEffect(() => {
    if (!currentStep || !refs) return;

    // Check if activity feed is empty
    const activityFeedEmpty = activityFeedLength === 0;

    const configs = {
      1: {
        title: '📱 Your Social Feed',
        body: activityFeedEmpty
          ? "This is where your besties' check-ins and posts will appear. Once you start sharing, it'll get lively! It's like a private timeline for your circle. 💜"
          : "This is where you see everything your besties share - check-ins, posts, milestones. It's like a private timeline just for your circle!",
        buttonText: 'Okay',
        secondaryButtonText: 'Skip Tutorial',
        position: 'below',
        highlightedElementRef: refs.activityFeed,
        onOkay: () => {
          // Show reaction buttons if feed has content
          if (!activityFeedEmpty) {
            setActivitySubStep('showing-reactions');
          } else {
            onNext();
          }
        },
        onSkip: () => {
          onSkip();
        }
      },
      2: {
        title: '✍️ Share with Your Besties',
        body: "Want to post something? Tap this button to share updates, photos, or just say hi. Your besties will see it in their feed. Give it a try! 🎉",
        buttonText: 'Try Posting',
        secondaryButtonText: 'Skip This',
        position: 'below',
        highlightedElementRef: refs.postButton,
        onOkay: () => {
          // Post button click is handled by parent component
          // It opens the modal and pauses tutorial
        },
        onSkip: () => {
          onNext();
        }
      },
      3: {
        title: '👥 Grow Your Safety Circle',
        body: "Add trusted friends to your safety circle. They'll be able to see your check-ins and help keep you safe. The more besties, the stronger your network!",
        buttonText: 'Okay',
        secondaryButtonText: 'Skip This',
        position: 'above',
        highlightedElementRef: refs.addBestieFab,
        onOkay: () => {
          setAddBestieSubStep('showing-button');
        },
        onSkip: () => {
          onNext();
        }
      },
      4: {
        title: '✨ Your Safety Squad',
        body: "All your besties in one place! Tap any bestie card to view their profile, send a message, or check their recent activity. The symbols show who's active, reliable, and more. 💜",
        buttonText: 'Okay',
        secondaryButtonText: 'Finish Tutorial',
        position: 'auto',
        highlightedElementRef: refs.bestiesGrid,
        onOkay: () => {
          setGridSubStep('showing-card');
        },
        onSkip: () => {
          onNext();
        }
      }
    };

    // Smooth transition animation
    setTooltipConfig(null);
    setTimeout(() => {
      setTooltipConfig(configs[currentStep]);
    }, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, refs, activityFeedLength]);

  if (!currentStep || !tooltipConfig) return null;

  // Custom render for step 1: Activity Feed with sub-steps
  if (currentStep === 1) {
    const handleActivityAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'continue') {
        onNext();
      }
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleActivityAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={4}
          isPaused={isPaused || activitySubStep !== 'initial'}
        />

        {activitySubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleActivityAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Skip Tutorial
            </button>
          </div>
        )}

        {activitySubStep === 'showing-reactions' && (
          <SmallTooltip
            message="React to posts with 💜 😮‍💨 🎉 to show your besties you care!"
            targetElement={refs.activityFeed?.current}
            position="auto"
            showAction={true}
            actionText="Got It"
            onAction={() => handleActivityAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Custom render for step 2: Post Button
  if (currentStep === 2) {
    const handlePostAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      }
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handlePostAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={4}
          isPaused={isPaused}
        />

        <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => handlePostAction('skip')}
            className="btn btn-secondary px-6 py-2 text-sm"
          >
            Skip This
          </button>
        </div>
      </>
    );
  }

  // Custom render for step 3: Add Bestie FAB
  if (currentStep === 3) {
    const handleAddBestieAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'continue') {
        onNext();
      }
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleAddBestieAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={4}
          isPaused={isPaused || addBestieSubStep !== 'initial'}
        />

        {addBestieSubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleAddBestieAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Skip This
            </button>
          </div>
        )}

        {addBestieSubStep === 'showing-button' && addBestieFabRef?.current && (
          <SmallTooltip
            message="Click here to invite friends via phone number, QR code, or share link!"
            targetElement={addBestieFabRef.current}
            position="auto"
            showAction={true}
            actionText="Got It"
            onAction={() => handleAddBestieAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Custom render for step 4: Besties Grid
  if (currentStep === 4) {
    const handleGridAction = (action) => {
      if (action === 'okay' && tooltipConfig.onOkay) {
        tooltipConfig.onOkay();
      } else if (action === 'skip' && tooltipConfig.onSkip) {
        tooltipConfig.onSkip();
      } else if (action === 'continue') {
        onNext();
      }
    };

    return (
      <>
        <TutorialOverlay
          currentStep={currentStep}
          onStepComplete={() => handleGridAction('okay')}
          onStepBack={onBack}
          onTutorialComplete={onSkip}
          highlightedElementRef={tooltipConfig.highlightedElementRef}
          tooltipConfig={tooltipConfig}
          stepNumber={currentStep}
          totalSteps={4}
          isPaused={isPaused || gridSubStep !== 'initial'}
        />

        {gridSubStep === 'initial' && (
          <div className="fixed z-[10002] bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleGridAction('skip')}
              className="btn btn-secondary px-6 py-2 text-sm"
            >
              Finish Tutorial
            </button>
          </div>
        )}

        {gridSubStep === 'showing-card' && refs.bestiesGrid?.current && (
          <SmallTooltip
            message="Tap any card to view profile, message, or manage your bestie connections!"
            targetElement={refs.bestiesGrid.current}
            position="auto"
            showAction={true}
            actionText="Finish"
            onAction={() => handleGridAction('continue')}
            delay={0}
          />
        )}
      </>
    );
  }

  // Normal flow fallback
  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={onNext}
      onStepBack={onBack}
      onTutorialComplete={onSkip}
      highlightedElementRef={tooltipConfig.highlightedElementRef}
      tooltipConfig={tooltipConfig}
      stepNumber={currentStep}
      totalSteps={4}
      isPaused={isPaused}
    />
  );
};

export default BestiesTutorialOverlay;
