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
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let pos = position;
      let arrowPos = 'top';

      if (position === 'auto') {
        // Auto-calculate best position based on available space
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = viewportWidth - rect.right;

        // Determine arrow position based on where tooltip will be positioned
        if (spaceAbove < tooltipRect.height + 20) {
          // Not enough space above, position below
          arrowPos = 'top'; // Arrow points up to button
        } else {
          // Enough space above, position above
          arrowPos = 'bottom'; // Arrow points down to button
        }

        if (spaceBelow >= tooltipRect.height + 20) {
          pos = 'below';
          arrowPos = 'top';
        } else if (spaceAbove >= tooltipRect.height + 20) {
          pos = 'above';
          arrowPos = 'bottom';
        } else if (spaceRight >= tooltipRect.width + 20) {
          pos = 'right';
          arrowPos = 'left';
        } else if (spaceLeft >= tooltipRect.width + 20) {
          pos = 'left';
          arrowPos = 'right';
        } else {
          // Default to below if no space
          pos = 'below';
          arrowPos = 'top';
        }
      } else {
        pos = position;
        arrowPos = pos === 'above' ? 'bottom' : pos === 'below' ? 'top' : pos === 'left' ? 'right' : 'left';
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

    // Get tooltip dimensions (use defaults if not yet rendered)
    const tooltipHeight = tooltipRef.current?.offsetHeight || 250;

    // Account for bottom navigation menu (80px) + some padding
    const bottomNavHeight = 100;

    // If no target element, center in middle of screen
    if (!targetElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'calc(100vw - 2rem)',
        width: 'auto'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom - bottomNavHeight;

    // Position above the button with some spacing
    const spacing = 20; // Space between tooltip and button
    let top = rect.top - tooltipHeight - spacing;

    // Note: Arrow position is set in useEffect, not here (to avoid setState during render)
    // If not enough space above, position below instead (but above bottom nav)
    if (spaceAbove < tooltipHeight + spacing + 20) {
      // Check if there's enough space below (accounting for bottom nav)
      if (spaceBelow >= tooltipHeight + spacing) {
        top = rect.bottom + spacing;
      } else {
        // If neither above nor below works, position to avoid bottom nav
        top = viewportHeight - bottomNavHeight - tooltipHeight - spacing;
      }
    }

    // Ensure tooltip doesn't go off top or bottom of screen (accounting for bottom nav)
    top = Math.max(20, Math.min(top, viewportHeight - bottomNavHeight - tooltipHeight - 20));

    // Center horizontally on screen, accounting for margins
    return {
      top: `${top}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: 'calc(100vw - 2rem)',
      width: 'auto'
    };
  };

  const getArrowStyles = () => {
    const baseStyles = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    // Match the gradient background color
    const arrowColor = '#fdf2f8'; // purple-50 to match gradient

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
      className="fixed z-[100] mx-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/90 dark:to-pink-900/90 rounded-2xl shadow-2xl p-5 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-sm"
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

        <div className="flex gap-2 mt-4">
          {showBack && onBack && (
            <button
              onClick={() => {
                haptic.light();
                onBack();
              }}
              className="flex-1 btn btn-secondary text-sm"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${showBack && onBack ? "flex-1" : "w-full"} btn bg-gradient-primary hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-white font-bold py-3 text-lg shadow-xl animate-pulse-slow`}
          >
            {buttonText} ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;

