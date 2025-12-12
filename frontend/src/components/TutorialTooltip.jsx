import React, { useEffect, useRef, useState } from 'react';
import haptic from '../utils/hapticFeedback';

const TutorialTooltip = ({ 
  title, 
  body, 
  buttonText = 'Next',
  onNext,
  onBack,
  showBack = false,
  stepNumber,
  totalSteps,
  targetElement,
  position = 'auto' // 'auto', 'above', 'below', 'left', 'right'
}) => {
  const tooltipRef = useRef(null);
  const [arrowPosition, setArrowPosition] = useState('top');

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

      if (position === 'left') {
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
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Get tooltip dimensions (use defaults if not yet rendered)
    const tooltipHeight = tooltipRef.current?.offsetHeight || 280;

    // Account for bottom navigation menu + buffer zone
    const bottomNavHeight = 80;
    const bufferAboveNav = 20;
    const reservedBottomSpace = bottomNavHeight + bufferAboveNav;

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
    const buttonHeight = rect.height;

    // ALWAYS position tooltip ABOVE the button
    const spacing = 16; // Space between tooltip and button
    let top = buttonTop - tooltipHeight - spacing;

    // If tooltip would go off top of screen, shift it down slightly
    // but NEVER let it cover the button
    const minTop = 20; // Minimum distance from top of screen
    if (top < minTop) {
      // Shift down but ensure we don't cover button
      top = Math.min(minTop, buttonTop - tooltipHeight - 8);
    }

    // Ensure tooltip stays above button (failsafe)
    const maxTop = buttonTop - tooltipHeight - 8;
    top = Math.min(top, maxTop);

    // Full width on mobile, centered with max-width on larger screens
    const isMobile = viewportWidth < 640; // sm breakpoint

    return {
      top: `${Math.max(minTop, top)}px`,
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
      className="fixed z-[100] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/90 dark:to-pink-900/90 rounded-2xl shadow-2xl p-6 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-sm"
      style={getPositionStyles()}
    >
      {/* Arrow - only show if we have a target element */}
      {targetElement && <div style={getArrowStyles()} />}

      {/* Content */}
      <div className="space-y-4">
        {title && (
          <h4 className="text-xl font-display text-gradient flex items-center gap-2">
            ✨ {title}
          </h4>
        )}
        {body && (
          <p className="text-base text-text-primary dark:text-gray-100 leading-relaxed font-medium">
            {body}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          {showBack && onBack && (
            <button
              onClick={() => {
                haptic.light();
                onBack();
              }}
              className="flex-1 btn btn-secondary py-3 text-base"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${showBack && onBack ? "flex-1" : "w-full"} btn bg-gradient-primary hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-white font-bold py-3 text-base shadow-xl animate-pulse-slow whitespace-nowrap`}
          >
            {buttonText} ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;

