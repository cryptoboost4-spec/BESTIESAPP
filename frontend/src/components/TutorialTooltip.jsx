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
        maxWidth: '400px',
        maxHeight: '80vh',
        overflowY: 'auto'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const buttonTop = rect.top;
    const buttonBottom = rect.bottom;
    const viewportHeight = window.innerHeight;
    const bottomNavHeight = 84; // Bottom nav bar height + safe area buffer
    const headerHeight = 80; // Approximate header height + buffer
    const bottomPadding = 12; // Reduced padding
    const minHeight = 150; // Minimum usable tooltip height

    // Position tooltip based on position prop
    const spacing = 12; // Space between tooltip and button
    let top;
    let maxHeight;

    if (position === 'below') {
      // Position tooltip BELOW the button - ALWAYS stay below
      top = buttonBottom + spacing;

      // Calculate max height available below
      maxHeight = viewportHeight - top - bottomNavHeight - bottomPadding;

      // If tooltip would overlap bottom nav, just position it as close as possible
      // but still below the button
      const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
      if (top + tooltipHeight > maxBottom) {
        // Instead of moving above button, just position higher but still below button
        // But respect the button bottom!
        // If we can't fit it, we MUST shrink it.
      }
    } else {
      // ALWAYS position tooltip ABOVE the button (default behavior)
      top = buttonTop - tooltipHeight - spacing;

      // Calculate safe boundaries
      const safeTop = headerHeight + 10;
      const safeBottom = viewportHeight - bottomNavHeight - bottomPadding;

      // If tooltip would go off top of screen, try positioning below
      if (top < safeTop) {
        // Try positioning below button instead
        const belowTop = buttonBottom + spacing;

        // Check if there's more space below than above
        const spaceBelow = safeBottom - belowTop;
        const spaceAbove = buttonTop - safeTop - spacing;

        if (spaceBelow > spaceAbove && spaceBelow > minHeight) {
          // Position BELOW
          top = belowTop;
          maxHeight = spaceBelow;
        } else {
          // Position ABOVE (cramped but better than nothing)
          // align bottom of tooltip with top of button
          // top is calculated such that (top + height) = buttonTop - spacing
          // so top = buttonTop - spacing - height
          // BUT if we constrain height, we set top = safeTop
          top = safeTop;
          maxHeight = Math.max(minHeight, buttonTop - safeTop - spacing);
        }
      } else {
        // It fits above initially, but let's set a max height just in case
        maxHeight = Math.max(minHeight, buttonTop - safeTop - spacing);
      }
    }

    // Ensure we don't return negative values or weird floats
    maxHeight = Math.floor(maxHeight || viewportHeight * 0.5);

    // Full width on mobile, centered with max-width on larger screens
    const isMobile = viewportWidth < 640; // sm breakpoint

    return {
      top: `${top}px`,
      left: isMobile ? '1rem' : '50%',
      right: isMobile ? '1rem' : 'auto',
      transform: isMobile ? 'none' : 'translateX(-50%)',
      width: isMobile ? 'auto' : '90%',
      maxWidth: isMobile ? 'none' : '400px',
      maxHeight: `${maxHeight}px`,
      overflowY: 'auto'
    };
  };

  const getArrowStyles = () => {
    const baseStyles = {
      position: 'absolute',
      width: 0,
      height: 0,
      zIndex: 50
    };

    // Match the gradient background color based on color scheme
    // We'll use the pink-50 for light and pink-900 for dark to blend with the container
    const isDark = document.documentElement.classList.contains('dark');
    const arrowColor = isDark ? '#831843' : '#fdf2f8'; // pink-900 / pink-50

    switch (arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderBottom: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(0 -4px 3px rgba(0,0,0,0.05))'
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.05))'
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          top: '100%',
          left: '20%',
          transform: 'translateX(-50%)',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.05))'
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          top: '100%',
          right: '20%',
          transform: 'translateX(50%)',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.05))'
        };
      case 'left':
        return {
          ...baseStyles,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '12px solid transparent',
          borderBottom: '12px solid transparent',
          borderRight: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(-4px 0 3px rgba(0,0,0,0.05))'
        };
      case 'right':
        return {
          ...baseStyles,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '12px solid transparent',
          borderBottom: '12px solid transparent',
          borderLeft: `12px solid ${arrowColor}`,
          filter: 'drop-shadow(4px 0 3px rgba(0,0,0,0.05))'
        };
      default:
        return baseStyles;
    }
  };

  const handleNext = () => {
    haptic.light();
    onNext?.();
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10002] bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/95 dark:via-purple-900/95 dark:to-pink-900/95 rounded-3xl shadow-[0_10px_40px_-10px_rgba(236,72,153,0.3)] p-6 border-[3px] border-pink-100 dark:border-pink-800 backdrop-blur-xl animate-step-transition ring-4 ring-white/30 dark:ring-black/20"
      style={{
        ...getPositionStyles(),
      }}
      role="dialog"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-body"
    >
      {/* Decorative sparkle background */}
      <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none select-none">
        <span className="text-4xl animate-pulse-slow">✨</span>
      </div>
      <div className="absolute bottom-0 left-0 p-4 opacity-20 pointer-events-none select-none">
        <span className="text-3xl animate-bounce-gentle" style={{ animationDelay: '1s' }}>💖</span>
      </div>

      {/* Arrow - only show if we have a target element */}
      {targetElement && <div style={getArrowStyles()} />}

      {/* Content */}
      <div className="space-y-4 relative z-10">
        {title && (
          <h4 id="tutorial-title" className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-300 dark:to-purple-300 flex items-center gap-2 drop-shadow-sm">
            <span className="animate-wiggle text-2xl">🌸</span> {title}
          </h4>
        )}
        {body && (
          <p id="tutorial-body" className="text-md text-gray-700 dark:text-pink-100 leading-relaxed font-medium tracking-wide">
            {body}
          </p>
        )}

        {/* Progress dots - Cute style */}
        {stepNumber && totalSteps && (
          <div className="flex gap-2 justify-center mt-6">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`transition-all duration-300 rounded-full ${i < stepNumber
                  ? 'w-6 h-2 bg-gradient-to-r from-pink-500 to-purple-500 shadow-md scale-100'
                  : 'w-2 h-2 bg-pink-200 dark:bg-pink-800'
                  }`}
                aria-label={`Step ${i + 1} of ${totalSteps}`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          {buttonText && (
            <div className="flex gap-3">
              {showBack && onBack && (
                <button
                  onClick={() => {
                    haptic.light();
                    onBack();
                  }}
                  className="px-4 py-3 rounded-full font-bold text-pink-600 dark:text-pink-300 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 transition-all border-2 border-transparent hover:border-pink-200"
                  aria-label="Go back to previous step"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className={`${showBack && onBack ? "flex-1" : "w-full"} group relative px-8 py-3.5 rounded-full font-bold text-white shadow-lg shadow-pink-500/30 overflow-hidden transform transition-all hover:scale-[1.02] active:scale-95`}
                aria-label={`${buttonText} - Step ${stepNumber} of ${totalSteps}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient-x"></div>
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {buttonText} {stepNumber === totalSteps ? '🎉' : '➜'}
                </span>
              </button>
            </div>
          )}
          {(showSkip || onSkip) && onSkip && (
            <button
              onClick={() => {
                haptic.light();
                onSkip();
              }}
              className="text-sm font-semibold text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-100 transition-colors py-1"
              aria-label="Skip tutorial"
            >
              Skip this for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;

