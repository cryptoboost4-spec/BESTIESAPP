import React, { useEffect, useRef, useState } from 'react';
import haptic from '../utils/hapticFeedback';

const TutorialTooltip = ({ 
  title, 
  body, 
  buttonText = 'Next',
  onNext,
  onBack,
  onSkip,
  showBack = false,
  showSkip = false,
  stepNumber,
  totalSteps,
  targetElement,
  position = 'auto' // 'auto', 'above', 'below', 'left', 'right'
}) => {
  const tooltipRef = useRef(null);
  const [arrowPosition, setArrowPosition] = useState('top');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (onNext) {
          haptic.light();
          onNext();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onSkip) {
          haptic.light();
          onSkip();
        }
      } else if (e.key === 'ArrowLeft' && onBack && showBack) {
        e.preventDefault();
        haptic.light();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onBack, onSkip, showBack]);

  useEffect(() => {
    if (!targetElement || !tooltipRef.current) {
      // If no target element, set default arrow position
      setArrowPosition('top');
      return;
    }

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let arrowPos = 'top';

      if (position === 'below') {
        // Tooltip below button, arrow points up to button
        arrowPos = 'top';
      } else if (position === 'left') {
        // Tooltip above button, arrow points to LEFT side of button
        arrowPos = 'bottom-left';
      } else if (position === 'right') {
        // Tooltip above button, arrow points to RIGHT side of button
        arrowPos = 'bottom-right';
      } else if (position === 'auto') {
        // Auto-calculate based on available space
        const spaceAbove = rect.top;

        // Determine arrow position based on where tooltip will be positioned
        if (spaceAbove < tooltipRect.height + 20) {
          // Not enough space above, position below
          arrowPos = 'top'; // Arrow points up to button
        } else {
          // Enough space above, position above
          arrowPos = 'bottom'; // Arrow points down to button (center)
        }
      }

      setArrowPosition(arrowPos);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [targetElement, position]);

  const getPositionStyles = () => {
    const viewportWidth = window.innerWidth;

    // Get tooltip dimensions (use defaults if not yet rendered)
    const tooltipHeight = tooltipRef.current?.offsetHeight || 280;

    // If no target element, center in middle of screen
    if (!targetElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const buttonTop = rect.top;
    const buttonBottom = rect.bottom;
    const viewportHeight = window.innerHeight;
    const bottomNavHeight = 80; // Bottom nav bar height
    const bottomPadding = 20; // Padding above nav bar

    // Position tooltip based on position prop
    const spacing = 16; // Space between tooltip and button
    let top;

    if (position === 'below') {
      // Position tooltip BELOW the button - ALWAYS stay below
      top = buttonBottom + spacing;
      
      // If tooltip would overlap bottom nav, just position it as close as possible
      // but still below the button
      const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
      if (top + tooltipHeight > maxBottom) {
        // Instead of moving above button, just position higher but still below button
        top = Math.max(buttonBottom + 8, maxBottom - tooltipHeight);
      }
    } else {
      // ALWAYS position tooltip ABOVE the button (default behavior)
      top = buttonTop - tooltipHeight - spacing;

      // If tooltip would go off top of screen, try positioning below
      const minTop = 20; // Minimum distance from top of screen
      if (top < minTop) {
        // Try positioning below button instead
        const belowTop = buttonBottom + spacing;
        const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
        
        if (belowTop + tooltipHeight <= maxBottom) {
          // Can fit below, use that
          top = belowTop;
        } else {
          // Can't fit below either, position as high as possible without covering button
          top = Math.max(minTop, buttonTop - tooltipHeight - 8);
        }
      }

      // Ensure tooltip stays above button (failsafe)
      const maxTop = buttonTop - tooltipHeight - 8;
      top = Math.min(top, maxTop);
      
      // Final check: ensure tooltip doesn't go below nav bar
      const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
      if (top + tooltipHeight > maxBottom) {
        top = maxBottom - tooltipHeight;
      }
    }

    // Full width on mobile, centered with max-width on larger screens
    const isMobile = viewportWidth < 640; // sm breakpoint

    return {
      top: `${top}px`,
      left: isMobile ? '1rem' : '50%',
      right: isMobile ? '1rem' : 'auto',
      transform: isMobile ? 'none' : 'translateX(-50%)',
      width: isMobile ? 'auto' : '90%',
      maxWidth: isMobile ? 'none' : '500px'
    };
  };

  const getArrowStyles = () => {
    const baseStyles = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    // Match the gradient background color based on color scheme
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains('dark');
    const arrowColor = isDark ? '#581c87' : '#fdf2f8'; // purple-900 for dark, purple-50 for light

    switch (arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: `8px solid ${arrowColor}`,
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `8px solid ${arrowColor}`,
        };
      case 'bottom-left':
        // Arrow pointing down-left (for rideshare button on left)
        return {
          ...baseStyles,
          top: '100%',
          left: '20%', // Position arrow toward left side
          transform: 'translateX(-50%)',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `10px solid ${arrowColor}`,
        };
      case 'bottom-right':
        // Arrow pointing down-right (for quick meet button on right)
        return {
          ...baseStyles,
          top: '100%',
          right: '20%', // Position arrow toward right side
          transform: 'translateX(50%)',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `10px solid ${arrowColor}`,
        };
      case 'left':
        return {
          ...baseStyles,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: `8px solid ${arrowColor}`,
        };
      case 'right':
        return {
          ...baseStyles,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: `8px solid ${arrowColor}`,
        };
      default:
        return baseStyles;
    }
  };

  const handleNext = () => {
    haptic.light();
    onNext?.();
  };

  // Allow rendering without targetElement

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/95 dark:via-pink-900/95 dark:to-purple-900/95 rounded-2xl shadow-2xl p-6 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-md animate-step-transition"
      style={{
        ...getPositionStyles(),
        boxShadow: '0 20px 60px rgba(147, 51, 234, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
      }}
      role="dialog"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-body"
    >
      {/* Arrow - only show if we have a target element */}
      {targetElement && <div style={getArrowStyles()} />}

      {/* Content */}
      <div className="space-y-4">
        {title && (
          <h4 id="tutorial-title" className="text-xl font-display text-gradient flex items-center gap-2 font-bold">
            {title}
          </h4>
        )}
        {body && (
          <p id="tutorial-body" className="text-base text-text-primary dark:text-gray-100 leading-relaxed font-medium">
            {body}
          </p>
        )}

        {/* Progress dots */}
        {stepNumber && totalSteps && (
          <div className="flex gap-2 justify-center mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < stepNumber
                    ? 'bg-purple-600 dark:bg-purple-400 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Step ${i + 1} of ${totalSteps}`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {buttonText && (
            <div className="flex gap-3">
              {showBack && onBack && (
                <button
                  onClick={() => {
                    haptic.light();
                    onBack();
                  }}
                  className="flex-1 btn btn-secondary py-3 text-base"
                  aria-label="Go back to previous step"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                className={`${showBack && onBack ? "flex-1" : "w-full"} btn bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 text-white font-bold py-3 text-base shadow-xl animate-pulse-slow whitespace-nowrap relative overflow-hidden group`}
                aria-label={`${buttonText} - Step ${stepNumber} of ${totalSteps}`}
                style={{
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 3s ease infinite, pulse-slow 2s ease-in-out infinite'
                }}
              >
                <span className="relative z-10">{buttonText} ✨</span>
                {/* Shine effect on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </button>
            </div>
          )}
          {(showSkip || onSkip) && onSkip && (
            <button
              onClick={() => {
                haptic.light();
                onSkip();
              }}
              className="text-sm text-text-secondary hover:text-text-primary underline transition-colors text-center"
              aria-label="Skip tutorial"
            >
              Skip Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;

