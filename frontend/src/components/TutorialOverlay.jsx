import React, { useEffect, useRef, useState } from 'react';
import TutorialTooltip from './TutorialTooltip';
import haptic from '../utils/hapticFeedback';

const TutorialOverlay = ({ 
  currentStep, 
  onStepComplete, 
  onTutorialComplete,
  onStepBack,
  highlightedElementRef,
  tooltipConfig,
  stepNumber,
  totalSteps,
  isPaused = false
}) => {
  const overlayRef = useRef(null);
  const [highlightRect, setHighlightRect] = useState(null);

  // Lock screen and update highlight position when element changes
  useEffect(() => {
    if (!highlightedElementRef?.current) {
      setHighlightRect(null);
      // Unlock screen if no element
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      return;
    }

    const element = highlightedElementRef.current;
    
    // Enhanced error handling: Verify element is in DOM
    if (!document.body.contains(element)) {
      console.warn('[Tutorial] Highlighted element is not in DOM, skipping highlight');
      setHighlightRect(null);
      return;
    }

    // Define updateHighlight first (before lockScreen uses it)
    const updateHighlight = () => {
      const rect = element.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    // FIRST: Scroll element into view to position just above bottom nav (before locking)
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const bottomNavHeight = 80; // Actual bottom nav height
    const bufferAboveNav = 20; // Small buffer space above nav
    const desiredBottomPosition = viewportHeight - bottomNavHeight - bufferAboveNav;

    // Calculate if element bottom is too low (would be hidden/covered by nav)
    const elementBottom = rect.bottom;

    // If element is too close to or below the safe zone, scroll it up
    if (elementBottom > desiredBottomPosition) {
      // Position element so its bottom is at the desired position
      const targetY = rect.top + window.scrollY - (desiredBottomPosition - rect.height);
      window.scrollTo({
        top: Math.max(0, targetY), // Don't scroll negative
        behavior: 'instant'
      });

      // Small delay to ensure DOM is settled after scroll
      requestAnimationFrame(() => {
        lockScreen();
      });
    } else {
      // Element is already visible in safe zone, lock immediately
      lockScreen();
    }

    function lockScreen() {
      // Lock screen - prevent scrolling
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      // Add class to elevate z-index of highlighted element
      element.classList.add('tutorial-highlighted-element');
      element.style.zIndex = '95';
      element.style.position = 'relative';

      updateHighlight();
    }

    // Only listen to resize, not scroll (since we're locking scroll)
    window.addEventListener('resize', updateHighlight);

    return () => {
      // Cleanup: remove class and z-index
      element.classList.remove('tutorial-highlighted-element');
      element.style.zIndex = '';
      element.style.position = '';
      window.removeEventListener('resize', updateHighlight);
      
      // Unlock screen
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [highlightedElementRef]);

  // Handle keyboard navigation - World-class UX
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentStep) return;

      // ESC to exit
      if (e.key === 'Escape') {
        haptic.light();
        const shouldExit = window.confirm('Exit tutorial? Don\'t worry - you can always start it again later! 💜');
        if (shouldExit) {
          onTutorialComplete?.();
        }
        return;
      }

      // Arrow keys for navigation (if enabled)
      if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        haptic.light();
        onStepComplete?.();
      } else if (e.key === 'ArrowLeft' && onStepBack && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        haptic.light();
        onStepBack?.();
      }

      // Enter to continue
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        haptic.light();
        onStepComplete?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onTutorialComplete, onStepComplete, onStepBack]);

  const handleNext = () => {
    if (tooltipConfig?.onNext) {
      tooltipConfig.onNext();
    } else {
      onStepComplete?.();
    }
  };

  if (!currentStep || !tooltipConfig) return null;

  return (
    <>
      {/* Dark Overlay - full screen, highlighted element will be above it */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          isPaused ? 'bg-black/40' : 'bg-black/75'
        }`}
        onClick={(e) => {
          // During quickCheckIns step, allow clicks through to buttons
          // Otherwise, prevent clicks outside highlighted area
          if (currentStep !== 'quickCheckIns') {
            e.stopPropagation();
          }
        }}
        style={{
          pointerEvents: currentStep === 'quickCheckIns' ? 'none' : 'auto'
        }}
        aria-hidden="true"
      />

      {/* Highlighted Element Glow - positioned above overlay */}
      {highlightedElementRef?.current && highlightRect && (
        <>
          {/* Glow effect around element - Enhanced */}
          <div
            className="fixed z-[92] pointer-events-none transition-all duration-500 tutorial-highlight-enhanced"
            style={{
              top: `${highlightRect.top - 4}px`,
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              borderRadius: '16px',
              filter: 'brightness(1.15)',
            }}
          />
          {/* Ensure highlighted element is clickable above overlay */}
          <div
            className="fixed z-[93] pointer-events-auto"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left}px`,
              width: `${highlightRect.width}px`,
              height: `${highlightRect.height}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}

      {/* Tooltip */}
      <TutorialTooltip
        title={tooltipConfig.title}
        body={tooltipConfig.body}
        buttonText={tooltipConfig.buttonText || 'Next'}
        onNext={handleNext}
        onBack={onStepBack}
        onSkip={tooltipConfig.onSkip || onTutorialComplete}
        showBack={stepNumber > 1}
        showSkip={true}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        targetElement={highlightedElementRef?.current}
        position={tooltipConfig.position}
      />
    </>
  );
};

export default TutorialOverlay;

