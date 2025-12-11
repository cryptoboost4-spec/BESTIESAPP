import React, { useEffect, useRef, useState } from 'react';
import TutorialTooltip from './TutorialTooltip';
import haptic from '../utils/hapticFeedback';

const TutorialOverlay = ({ 
  currentStep, 
  onStepComplete, 
  onTutorialComplete,
  highlightedElementRef,
  tooltipConfig 
}) => {
  const overlayRef = useRef(null);
  const [highlightRect, setHighlightRect] = useState(null);

  // Update highlight position when element changes
  useEffect(() => {
    if (!highlightedElementRef?.current) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const rect = highlightedElementRef.current.getBoundingClientRect();
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
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [highlightedElementRef]);

  // Handle ESC key to exit tutorial
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && currentStep) {
        haptic.light();
        // Ask user if they want to exit
        if (window.confirm('Exit tutorial? You can always start it again later.')) {
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
      {/* Dark Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90] transition-opacity duration-300"
        style={{
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightRect.left}px 100%, 
                ${highlightRect.left}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : undefined
        }}
        onClick={(e) => {
          // Prevent clicks outside highlighted area
          e.stopPropagation();
        }}
      />

      {/* Highlighted Element Glow */}
      {highlightedElementRef?.current && (
        <div
          className="fixed z-[91] pointer-events-none transition-all duration-300 tutorial-highlight"
          style={{
            top: highlightRect?.top ? `${highlightRect.top - 4}px` : 0,
            left: highlightRect?.left ? `${highlightRect.left - 4}px` : 0,
            width: highlightRect?.width ? `${highlightRect.width + 8}px` : 0,
            height: highlightRect?.height ? `${highlightRect.height + 8}px` : 0,
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
            filter: 'brightness(1.1)',
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipConfig && highlightedElementRef?.current && (
        <TutorialTooltip
          title={tooltipConfig.title}
          body={tooltipConfig.body}
          buttonText={tooltipConfig.buttonText || 'Next'}
          onNext={handleNext}
          targetElement={highlightedElementRef.current}
          position={tooltipConfig.position}
        />
      )}
    </>
  );
};

export default TutorialOverlay;

