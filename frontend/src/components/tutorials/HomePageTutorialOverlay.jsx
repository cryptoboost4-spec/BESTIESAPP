import React from 'react';
import TutorialOverlay from '../TutorialOverlay';
import TutorialTooltip from '../TutorialTooltip';
import haptic from '../../utils/hapticFeedback';

/**
 * New Home Page Tutorial Flow:
 * 1. Welcome overlay - dark screen asking to show them around
 * 2. Highlight all 4 buttons - explain this is where they check in
 * 3. Highlight 3 quick check-ins - explain differences, tell them to pick one
 * 4. After quick check-in created - congratulate and guide to custom
 * 5. Guide through custom check-in
 */
const HomePageTutorialOverlay = ({
  currentStep,
  onNext,
  onSkip,
  highlightedElementRef,
  allButtonsRef,
  quickCheckInButtonsRef,
  customButtonRef,
  allowQuickCheckInClick = false,
  onQuickCheckInClick
}) => {
  const getTooltipConfig = () => {
    switch (currentStep) {
      case 'welcome':
        return {
          title: 'Welcome to Besties! 🛡️',
          body: "Let's show you around! This is where you'll create check-ins to keep yourself safe. Ready to learn?",
          buttonText: 'Show Me Around',
          onNext: onNext,
          position: 'auto',
          stepNumber: 1,
          totalSteps: 5
        };
      
      case 'allButtons':
        return {
          title: 'Your Check-In Hub',
          body: "These are your check-in buttons! You have 3 quick options (rideshare, walking, meeting) and one custom option. This is where you'll create all your safety check-ins.",
          buttonText: 'Got It',
          onNext: onNext,
          position: 'auto',
          stepNumber: 2,
          totalSteps: 5
        };
      
      case 'quickCheckIns':
        return {
          title: 'Quick Check-Ins',
          body: "These 3 buttons are quick check-ins - each one is slightly different:\n\n🚗 Rideshare - For Uber/Lyft rides\n🚶‍♀️ Walking - When walking alone\n💬 Quick Meet - Meeting someone new\n\nPick any one to try it out!",
          buttonText: 'I\'ll Pick One',
          onNext: () => {
            // Don't advance - wait for them to click a button
            // This step stays active until they click
          },
          position: 'auto',
          stepNumber: 3,
          totalSteps: 5
        };
      
      case 'afterQuickCheckIn':
        return {
          title: 'Great Job! 🎉',
          body: "You just created your first check-in! Now let's learn about the custom check-in option. It gives you full control over all the details.",
          buttonText: 'Show Me Custom',
          onNext: onNext,
          position: 'auto',
          stepNumber: 4,
          totalSteps: 5
        };
      
      case 'custom':
        return {
          title: 'Custom Check-In',
          body: "This is the custom check-in button! Use it when you need full control - set your own location, duration, notes, and more. Perfect for unique situations.",
          buttonText: 'Got It',
          onNext: onNext,
          position: 'auto',
          stepNumber: 5,
          totalSteps: 5
        };
      
      default:
        return null;
    }
  };

  const tooltipConfig = getTooltipConfig();
  
  if (!currentStep || !tooltipConfig) return null;

  // For welcome step, show full-screen dark overlay with centered message
  if (currentStep === 'welcome') {
    return (
      <>
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <TutorialTooltip
              title={tooltipConfig.title}
              body={tooltipConfig.body}
              buttonText={tooltipConfig.buttonText}
              onNext={tooltipConfig.onNext}
              onSkip={onSkip}
              stepNumber={tooltipConfig.stepNumber}
              totalSteps={tooltipConfig.totalSteps}
              targetElement={null}
              position="auto"
            />
          </div>
        </div>
      </>
    );
  }

  // For other steps, use normal overlay
  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={onNext}
      onTutorialComplete={onSkip}
      highlightedElementRef={highlightedElementRef}
      tooltipConfig={tooltipConfig}
      stepNumber={tooltipConfig.stepNumber}
      totalSteps={tooltipConfig.totalSteps}
    />
  );
};

export default HomePageTutorialOverlay;

