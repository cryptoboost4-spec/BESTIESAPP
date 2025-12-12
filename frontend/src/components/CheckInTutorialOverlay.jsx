import React, { useEffect, useState } from 'react';

/**
 * CheckInTutorialOverlay - Guides users through their first check-in
 * Displays tooltips for each section, one at a time
 * Highlights active section, dims/disables everything else
 */
const CheckInTutorialOverlay = ({
  currentStep,
  onStepComplete,
  onSkipTutorial,
  highlightedElementRef,
  tooltipConfig,
  isFirstStep = false,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0, rotation: 0 });
  const [showTooltip, setShowTooltip] = useState(true);

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  };

  // Lock body scroll when tutorial is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Calculate tooltip and arrow positions
  useEffect(() => {
    if (!highlightedElementRef?.current) return;

    const calculatePositions = () => {
      const element = highlightedElementRef.current;
      const elementRect = element.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      // For map section, position tooltip just below the map
      if (tooltipConfig.overlayOnElement) {
        const tooltipWidth = Math.min(screenWidth - 40, 320);
        const padding = 12;

        setTooltipPosition({
          top: elementRect.bottom + padding,
          left: (screenWidth - tooltipWidth) / 2,
        });

        // Arrow points up to map
        const arrowLeft = screenWidth / 2;
        const arrowTop = elementRect.bottom + padding / 2;

        setArrowPosition({
          top: arrowTop,
          left: arrowLeft,
          rotation: 0, // Points up
        });
        return;
      }

      // For all other sections, position tooltip ABOVE the section
      const tooltipWidth = Math.min(screenWidth - 40, 320);
      const tooltipHeight = 200; // Approximate height
      const padding = 20;

      // Always center horizontally
      const left = (screenWidth - tooltipWidth) / 2;

      // Position above the element with padding
      let top = elementRect.top - tooltipHeight - padding;

      // Ensure doesn't go off top of screen
      if (top < 20) {
        top = 20;
      }

      setTooltipPosition({ top, left });

      // Calculate arrow position (points down to element)
      const arrowLeft = screenWidth / 2;
      const arrowTop = elementRect.top - padding / 2;

      setArrowPosition({
        top: arrowTop,
        left: arrowLeft,
        rotation: 180, // Points down
      });
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);

    return () => {
      window.removeEventListener('resize', calculatePositions);
    };
  }, [highlightedElementRef, tooltipConfig.overlayOnElement]);

  // Handle tooltip dismiss (for map section)
  const handleDismissTooltip = () => {
    setShowTooltip(false);
    triggerHaptic();
  };

  // Handle skip tutorial
  const handleSkip = () => {
    triggerHaptic();
    onSkipTutorial();
  };

  // Handle button actions
  const handleButtonClick = (action) => {
    triggerHaptic();
    if (action === 'skip') {
      onStepComplete('skip');
    } else if (action === 'continue') {
      onStepComplete('continue');
    } else if (action === 'useDefault') {
      onStepComplete('useDefault');
    } else if (action === 'setCustom') {
      onStepComplete('setCustom');
    } else if (action === 'addSocial') {
      onStepComplete('addSocial');
    } else if (action === 'addDetails') {
      onStepComplete('addDetails');
    }
  };

  // Get highlighted element z-index boost
  useEffect(() => {
    if (!highlightedElementRef?.current) return;

    const element = highlightedElementRef.current;
    const originalZIndex = element.style.zIndex;
    const originalPosition = element.style.position;

    // Boost z-index to appear above overlay but below tooltip
    element.style.position = 'relative';
    element.style.zIndex = '10000'; // Above bottom nav (9999) and overlay (9998)

    return () => {
      element.style.zIndex = originalZIndex;
      element.style.position = originalPosition;
    };
  }, [highlightedElementRef]);

  return (
    <>
      {/* Dark overlay backdrop - dims everything */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 pointer-events-auto"
        style={{ zIndex: 9998 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Arrow pointing to element */}
      {arrowPosition.top > 0 && (
        <div
          className="fixed w-0 h-0 pointer-events-none"
          style={{
            top: `${arrowPosition.top}px`,
            left: `${arrowPosition.left}px`,
            zIndex: 10001,
            transform: 'translateX(-50%)',
          }}
        >
          {arrowPosition.rotation === 0 ? (
            // Upward arrow for map tooltip
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '10px solid white',
              }}
            />
          ) : (
            // Downward arrow for other sections
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '12px solid white',
              }}
            />
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-[320px] animate-in fade-in zoom-in duration-200 ${
            tooltipConfig.overlayOnElement ? 'p-4' : 'p-6'
          }`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 10002,
            width: 'calc(100vw - 40px)',
            maxWidth: '320px',
          }}
        >
          {/* Skip button - only on first step */}
          {isFirstStep && (
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Skip tutorial"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Icon */}
          {tooltipConfig.icon && (
            <div className="text-3xl mb-3 text-center">{tooltipConfig.icon}</div>
          )}

          {/* Title */}
          {tooltipConfig.title && (
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white text-center">
              {tooltipConfig.title}
            </h3>
          )}

          {/* Body */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line text-center">
            {tooltipConfig.body}
          </p>

          {/* Buttons */}
          {tooltipConfig.buttons && tooltipConfig.buttons.length > 0 && (
            <div className="flex gap-2 justify-center">
              {tooltipConfig.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleButtonClick(button.action)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all transform active:scale-95 ${
                    button.primary
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}

          {/* Dismiss button for map overlay */}
          {tooltipConfig.overlayOnElement && tooltipConfig.dismissible && (
            <button
              onClick={handleDismissTooltip}
              className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-all transform active:scale-95"
            >
              Got it
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default CheckInTutorialOverlay;
