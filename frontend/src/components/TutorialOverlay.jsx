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
  totalSteps
}) => {
  const overlayRef = useRef(null);
  const [highlightRect, setHighlightRect] = useState(null);

  // Update highlight position when element changes
  useEffect(() => {
    if (!highlightedElementRef?.current) {
      setHighlightRect(null);
      return;
    }

    const element = highlightedElementRef.current;
    
    // Add class to elevate z-index of highlighted element
    element.classList.add('tutorial-highlighted-element');
    element.style.zIndex = '95';
    element.style.position = 'relative';

    const updateHighlight = () => {
      const rect = element.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      // Cleanup: remove class and z-index
      element.classList.remove('tutorial-highlighted-element');
      element.style.zIndex = '';
      element.style.position = '';
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [highlightedElementRef]);

  // Handle ESC key to exit tutorial
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && currentStep) {
        haptic.light();
        // Ask user if they want to exit (but make it friendly)
        const shouldExit = window.confirm('Exit tutorial? Don\'t worry - you can always start it again later! 💜');
        if (shouldExit) {
          onTutorialComplete?.();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [currentStep, onTutorialComplete]);

  const handleNext = () => {
    if (tooltipConfig?.onNext) {
      tooltipConfig.onNext();
    } else {
      onStepComplete?.();
    }
  };

  if (!currentStep) return null;

  return (
    <>
      {/* Dark Overlay - full screen, highlighted element will be above it */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90] transition-opacity duration-300"
        onClick={(e) => {
          // Prevent clicks outside highlighted area
          e.stopPropagation();
        }}
      />

      {/* Highlighted Element Glow - positioned above overlay */}
      {highlightedElementRef?.current && highlightRect && (
        <>
          {/* Glow effect around element */}
          <div
            className="fixed z-[92] pointer-events-none transition-all duration-300 tutorial-highlight"
            style={{
              top: `${highlightRect.top - 4}px`,
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
              filter: 'brightness(1.1)',
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
      {tooltipConfig && highlightedElementRef?.current && (
        <TutorialTooltip
          title={tooltipConfig.title}
          body={tooltipConfig.body}
          buttonText={tooltipConfig.buttonText || 'Next'}
          onNext={handleNext}
          onBack={onStepBack}
          showBack={stepNumber > 1}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          targetElement={highlightedElementRef.current}
          position={tooltipConfig.position}
        />
      )}
    </>
  );
};

export default TutorialOverlay;

