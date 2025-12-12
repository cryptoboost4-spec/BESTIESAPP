import React, { useEffect, useState, useRef } from 'react';

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
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0, rotation: 180 });
  const [showTooltip] = useState(true);

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  };

  // Store scroll position for mobile calculations
  const scrollYRef = useRef(0);

  // Lock body scroll when tutorial is active
  useEffect(() => {
    // Save current scroll position BEFORE locking
    scrollYRef.current = window.scrollY;
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = `-${scrollYRef.current}px`;
    });

    return () => {
      // Restore scroll position
      const savedScrollY = scrollYRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      // Use requestAnimationFrame to ensure styles are cleared before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollY);
      });
    };
  }, []);

  // Calculate tooltip and arrow positions
  useEffect(() => {
    if (!highlightedElementRef?.current) return;

    // Detect mobile device (outside function so it can be used in cleanup)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    const calculatePositions = () => {
      const element = highlightedElementRef.current;
      if (!element) return;

      // On mobile, getBoundingClientRect can be wrong after scroll lock
      // Use a small delay to ensure DOM is settled, or calculate before lock
      const elementRect = element.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // For map overlay, center the tooltip on screen
      if (tooltipConfig.overlayOnElement) {
        const tooltipWidth = Math.min(screenWidth - 40, 320);
        setTooltipPosition({
          top: screenHeight / 2 - 100, // Roughly centered
          left: (screenWidth - tooltipWidth) / 2,
        });
        setArrowPosition({ top: -1000, left: -1000, rotation: 0 }); // Hide arrow
        return;
      }

      // For all other sections, always position ABOVE (except map which can be centered)
      const tooltipWidth = Math.min(screenWidth - 40, Math.min(320, screenWidth - 40));
      const tooltipHeight = 180; // Approximate height
      const padding = 20;
      const minSpaceFromEdge = 20;

      // Always center horizontally
      const left = (screenWidth - tooltipWidth) / 2;

      // On mobile, elementRect.top might be wrong after scroll lock
      // Account for this by using the stored scroll position if needed
      let elementTop = elementRect.top;
      
      // If on mobile and element seems positioned incorrectly (negative or very large),
      // try to get position from element's offsetTop instead
      if (isMobile && (elementTop < 0 || elementTop > screenHeight * 2)) {
        // Fallback: use offsetTop relative to document, then subtract scroll
        const offsetTop = element.offsetTop;
        elementTop = offsetTop - scrollYRef.current;
        
        // If still wrong, use a safe default
        if (elementTop < 0 || elementTop > screenHeight * 2) {
          elementTop = screenHeight / 2; // Center as fallback
        }
      }

      // Always position above the element with padding
      let top = elementTop - tooltipHeight - padding;

      // Ensure doesn't go off top of screen
      if (top < minSpaceFromEdge) {
        top = minSpaceFromEdge;
      }

      setTooltipPosition({ top, left });

      // Calculate arrow position (always points down to element)
      const arrowLeft = screenWidth / 2;
      const arrowTop = elementTop - padding / 2;

      setArrowPosition({
        top: arrowTop,
        left: arrowLeft,
        rotation: 180, // Always points down
      });
    };

    // On mobile, add a small delay to ensure scroll lock is applied and DOM is settled
    const delay = isMobile ? 100 : 0;
    
    const timeoutId = setTimeout(() => {
      calculatePositions();
    }, delay);
    
    window.addEventListener('resize', calculatePositions);
    // Also listen to orientation changes on mobile
    if (isMobile) {
      window.addEventListener('orientationchange', calculatePositions);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePositions);
      if (isMobile) {
        window.removeEventListener('orientationchange', calculatePositions);
      }
    };
  }, [highlightedElementRef, tooltipConfig.overlayOnElement]);

  // Handle tooltip dismiss/continue (for map section)
  const handleDismissTooltip = () => {
    triggerHaptic();
    onStepComplete('continue');
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

      {/* Arrow pointing to element (hidden for map overlay) */}
      {!tooltipConfig.overlayOnElement && arrowPosition.top > 0 && (
        <div
          className="fixed w-0 h-0 pointer-events-none"
          style={{
            top: `${arrowPosition.top}px`,
            left: `${arrowPosition.left}px`,
            zIndex: 10001,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid white', // Always points down
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-200"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 10002,
            width: 'calc(100vw - 40px)',
            maxWidth: '320px',
            ...(tooltipConfig.overlayOnElement && {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }),
          }}
        >
          {/* Skip button - available on all steps */}
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
              disabled={tooltipConfig.canDismiss === false}
              className={`mt-4 w-full px-4 py-2 rounded-lg font-medium transition-all transform active:scale-95 ${
                tooltipConfig.canDismiss === false
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
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
