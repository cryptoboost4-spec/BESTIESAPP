import React, { useEffect, useState } from 'react';
import TutorialOverlay from '../../TutorialOverlay';

/**
 * BestiesTutorialOverlay - Tutorial overlay for Besties page
 * Guides users through: Activity Feed, Create Post, Leaderboard, Besties Grid
 */
const BestiesTutorialOverlay = ({
  currentStep,
  onNext,
  onSkip,
  isPaused,
  refs,
  activityFeedLength = 0
}) => {
  const [tooltipConfig, setTooltipConfig] = useState(null);

  useEffect(() => {
    if (!currentStep || !refs) return;

    // Check if activity feed is empty
    const activityFeedEmpty = activityFeedLength === 0;

    // World-class: Context-aware, delightful messaging
    const configs = {
      1: {
        title: '📱 Your Social Feed',
        body: activityFeedEmpty
          ? "This is where your besties' check-ins and posts will appear. Once you start sharing, it'll get lively! It's like a private timeline for your circle. 💜"
          : "This is where you see everything your besties share - check-ins, posts, milestones. It's like a private timeline just for your circle. Scroll down to see more! ✨",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.activityFeed
      },
      2: {
        title: '✍️ Share with Your Besties',
        body: "Want to post something? Tap this button to share updates, photos, or just say hi. Your besties will see it in their feed. Give it a try! 🎉",
        buttonText: 'Try Posting',
        position: 'right',
        highlightedElementRef: refs.postButton
      },
      3: {
        title: '🏆 Friendly Rankings',
        body: "See who's most reliable, who responds fastest, and celebrate together! Remember - everyone wins when we keep each other safe. Tap the tabs to explore! 💪",
        buttonText: 'Next',
        position: 'auto',
        highlightedElementRef: refs.leaderboard
      },
      4: {
        title: '👥 Your Safety Squad',
        body: "All your besties in one place! Tap any bestie card to view their profile, send a message, or check their recent activity. The symbols show who's active, reliable, and more. 💜",
        buttonText: 'Got It! ✨',
        position: 'auto',
        highlightedElementRef: refs.bestiesGrid
      }
    };

    // Smooth transition animation
    setTooltipConfig(null);
    setTimeout(() => {
      setTooltipConfig(configs[currentStep]);
    }, 150);
  }, [currentStep, refs, activityFeedLength]);

  if (!currentStep || !tooltipConfig) return null;

  return (
    <TutorialOverlay
      currentStep={currentStep}
      onStepComplete={onNext}
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

