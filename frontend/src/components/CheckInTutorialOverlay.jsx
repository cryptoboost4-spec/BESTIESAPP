import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: '400px' });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0, rotation: 180 });

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  };

  // Store scroll position for mobile calculations
  const scrollYRef = useRef(0);

  // Lock body scroll when tutorial is active (but not for 'final' step)
  useEffect(() => {
    // Don't lock scroll for 'final' step - user should be able to scroll and fill out form
    if (currentStep === 'final') {
      return;
    }

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
  }, [currentStep]);

  // Calculate tooltip and arrow positions
  useEffect(() => {
    if (!tooltipConfig) return;

    // Detect mobile device (outside function so it can be used in cleanup)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    const calculatePositions = () => {
      // If no element to highlight (e.g., afterSafe step), use centered positioning
      if (!highlightedElementRef?.current) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const bottomNavHeight = 84;
        const headerHeight = 80;
        const padding = 20;
        const availableHeight = screenHeight - headerHeight - bottomNavHeight - (padding * 2);
        const tooltipWidth = isMobile
          ? Math.min(screenWidth - 32, 400)
          : Math.min(400, screenWidth - 80);
        const estimatedTooltipHeight = Math.min(availableHeight - 40, 350);
        const left = (screenWidth - tooltipWidth) / 2;
        const availableTop = headerHeight + padding;
        const availableBottom = screenHeight - bottomNavHeight - padding;
        const centerY = (availableTop + availableBottom) / 2;
        let top = centerY - (estimatedTooltipHeight / 2);
        if (top < availableTop) top = availableTop;
        const tooltipBottom = top + estimatedTooltipHeight;
        if (tooltipBottom > availableBottom) {
          top = availableBottom - estimatedTooltipHeight;
          if (top < availableTop) top = availableTop;
        }
        setTooltipPosition({ top, left, width: `${tooltipWidth}px` });
        setArrowPosition({ top: -1000, left: -1000, rotation: 0 });
        return;
      }

      const element = highlightedElementRef.current;

      // On mobile, getBoundingClientRect can be wrong after scroll lock
      // Use a small delay to ensure DOM is settled, or calculate before lock
      const elementRect = element.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // For overlay on element, position tooltip on top of the element (full width)
      if (tooltipConfig.overlayOnElement) {
        const padding = 20;
        const tooltipHeight = 200; // Approximate tooltip height

        // Position tooltip on top of the element, full width of element
        const elementTop = elementRect.top;
        const elementLeft = elementRect.left;
        const elementWidth = elementRect.width;

        // Use full width of element, but ensure it doesn't go off screen
        const tooltipWidth = Math.min(elementWidth - (padding * 2), screenWidth - (padding * 2));
        const left = elementLeft + padding;
        const constrainedLeft = Math.max(padding, Math.min(left, screenWidth - tooltipWidth - padding));

        // Position tooltip near the top of the element, but ensure it's visible
        const top = elementTop + padding;
        const constrainedTop = Math.max(padding, Math.min(top, screenHeight - tooltipHeight - padding));

        setTooltipPosition({
          top: constrainedTop,
          left: constrainedLeft,
          width: `${tooltipWidth}px`,
        });
        setArrowPosition({ top: -1000, left: -1000, rotation: 0 }); // Hide arrow
        return;
      }

      // For all other sections, position centered on screen (especially for checkedIn step)
      const bottomNavHeight = 84; // Bottom nav bar height + safe area
      const headerHeight = 80; // Header height + buffer
      const padding = 20;

      // Calculate available space
      const availableHeight = screenHeight - headerHeight - bottomNavHeight - (padding * 2);

      // Tooltip width - responsive for mobile
      const tooltipWidth = isMobile
        ? Math.min(screenWidth - 32, 400) // 16px padding on each side
        : Math.min(400, screenWidth - 80);

      // Estimate tooltip height (will be adjusted by content)
      const estimatedTooltipHeight = Math.min(availableHeight - 40, 350);

      // Center horizontally
      const left = (screenWidth - tooltipWidth) / 2;

      // Position vertically - center in available space, but ensure it doesn't cover bottom nav
      // Calculate top position to center in available space
      const availableTop = headerHeight + padding;
      const availableBottom = screenHeight - bottomNavHeight - padding;
      const centerY = (availableTop + availableBottom) / 2;

      // Position tooltip centered vertically in available space
      let top = centerY - (estimatedTooltipHeight / 2);

      // Ensure it doesn't go above header or below bottom nav
      if (top < availableTop) {
        top = availableTop;
      }
      const tooltipBottom = top + estimatedTooltipHeight;
      if (tooltipBottom > availableBottom) {
        top = availableBottom - estimatedTooltipHeight;
        // If still too tall, position at top of available space
        if (top < availableTop) {
          top = availableTop;
        }
      }

      setTooltipPosition({ top, left, width: `${tooltipWidth}px` });

      // Hide arrow for centered tooltip (not positioned relative to element)
      setArrowPosition({ top: -1000, left: -1000, rotation: 0 });
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
  }, [highlightedElementRef, tooltipConfig]);

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
    } else if (action === 'continueTutorial') {
      onStepComplete('continueTutorial');
    } else if (action === 'useDefault') {
      onStepComplete('useDefault');
    } else if (action === 'setCustom') {
      onStepComplete('setCustom');
    } else if (action === 'addSocial') {
      onStepComplete('addSocial');
    } else if (action === 'addDetails') {
      onStepComplete('addDetails');
    } else if (action === 'useLocation') {
      onStepComplete('useLocation');
    } else if (action === 'enterManually') {
      onStepComplete('enterManually');
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
  }, [highlightedElementRef, tooltipConfig]);

  // Don't render if no tooltip config (check after all hooks to follow Rules of Hooks)
  if (!tooltipConfig) {
    return null;
  }

  // Render tooltip in portal for checkedIn and afterSafe steps to appear above modals and active check-ins
  const shouldUsePortal = currentStep === 'checkedIn' || currentStep === 'afterSafe';

  const tooltipContent = (
    <>
      {/* Dark overlay backdrop - dims everything and blocks all interactions (not for 'final' step) */}
      {currentStep !== 'final' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 pointer-events-auto"
          style={{ zIndex: 9998 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

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
      <div
        className="fixed z-[10002] bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/95 dark:via-purple-900/95 dark:to-pink-900/95 rounded-3xl shadow-[0_10px_40px_-10px_rgba(236,72,153,0.3)] p-6 border-[3px] border-pink-100 dark:border-pink-800 backdrop-blur-xl ring-4 ring-white/30 dark:ring-black/20 transition-opacity duration-300 animate-in fade-in zoom-in"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: tooltipPosition.width || (window.innerWidth < 768 ? 'calc(100vw - 32px)' : '400px'),
          maxWidth: tooltipConfig.overlayOnElement ? 'none' : '400px',
          maxHeight: 'calc(100vh - 180px)', // Leave space for header and bottom nav
          overflowY: 'auto',
          zIndex: 10003, // Ensure it's on top of everything
          ...(tooltipConfig.overlayOnElement && {
            backgroundColor: 'rgba(253, 242, 248, 0.95)',
            backdropFilter: 'blur(10px)',
          }),
        }}
      >
        {/* Decorative sparkle background */}
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none select-none">
          <span className="text-4xl animate-pulse-slow">✨</span>
        </div>
        <div className="absolute bottom-0 left-0 p-4 opacity-20 pointer-events-none select-none">
          <span className="text-3xl animate-bounce-gentle" style={{ animationDelay: '1s' }}>💖</span>
        </div>

        {/* Skip button - available on all steps */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-100 transition-colors z-10"
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

        {/* Content */}
        <div className="space-y-4 relative z-10">
          {/* Icon */}
          {tooltipConfig.icon && (
            <div className="text-3xl mb-3 text-center">{tooltipConfig.icon}</div>
          )}

          {/* Title */}
          {tooltipConfig.title && (
            <h4 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-300 dark:to-purple-300 flex items-center gap-2 drop-shadow-sm justify-center">
              <span className="animate-wiggle text-2xl">🌸</span> {tooltipConfig.title}
            </h4>
          )}

          {/* Body */}
          <p className="text-md text-gray-700 dark:text-pink-100 leading-relaxed font-medium tracking-wide whitespace-pre-line">
            {tooltipConfig.body}
          </p>

          {/* Buttons */}
          {tooltipConfig.buttons && tooltipConfig.buttons.length > 0 && (
            <div className="flex flex-col gap-2.5 mt-5">
              <div className={`flex ${tooltipConfig.verticalButtons ? 'flex-col' : ''} gap-2.5`}>
                {tooltipConfig.buttons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(button.action)}
                    className={`${tooltipConfig.buttons.length === 1 || tooltipConfig.verticalButtons ? 'w-full' : 'flex-1'} group relative px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg shadow-pink-500/30 overflow-hidden transform transition-all hover:scale-[1.02] active:scale-95`}
                  >
                    {button.primary ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient-x"></div>
                        <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                        <span className="relative flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {button.text} ➜
                        </span>
                      </>
                    ) : (
                      <span className="relative px-4 py-2.5 rounded-full text-sm font-bold text-pink-600 dark:text-pink-300 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 transition-all border-2 border-transparent hover:border-pink-200 whitespace-nowrap">
                        {button.text}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Skip text link */}
              {tooltipConfig.showSkipText && tooltipConfig.skipText && (
                <button
                  onClick={() => {
                    if (tooltipConfig.onSkipClick) {
                      tooltipConfig.onSkipClick();
                    } else {
                      handleSkip();
                    }
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors underline"
                >
                  {tooltipConfig.skipText}
                </button>
              )}
            </div>
          )}

          {/* Dismiss/Continue button for map overlay */}
          {tooltipConfig.overlayOnElement && tooltipConfig.showScrollMessage && (
            // Show scroll message with continue button
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={handleDismissTooltip}
                className="w-full group relative px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg shadow-pink-500/30 overflow-hidden transform transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient-x"></div>
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                <span className="relative flex items-center justify-center gap-1.5 whitespace-nowrap">
                  Continue ➜
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Add animations if not already in global CSS */}
        <style>{`
            @keyframes wiggle {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-3deg); }
              75% { transform: rotate(3deg); }
            }
            .animate-wiggle {
              animation: wiggle 1s ease-in-out infinite;
            }
            @keyframes gradient-x {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            .animate-gradient-x {
              animation: gradient-x 3s ease infinite;
            }
          `}</style>
      </div>
    </>
  );

  // Use portal for checkedIn step to appear above modals
  if (shouldUsePortal && typeof document !== 'undefined') {
    return createPortal(tooltipContent, document.body);
  }

  return tooltipContent;
};

export default CheckInTutorialOverlay;
