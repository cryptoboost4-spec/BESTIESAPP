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
  const [calculatedPosition, setCalculatedPosition] = useState('below');
  const [arrowPosition, setArrowPosition] = useState('top');

  useEffect(() => {
    if (!targetElement || !tooltipRef.current) return;

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let pos = position;
      let arrowPos = 'top';

      if (position === 'auto') {
        // Auto-calculate best position
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = viewportWidth - rect.right;

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

      setCalculatedPosition(pos);
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
    const viewportHeight = window.innerHeight;
    
    // Get tooltip dimensions (use defaults if not yet rendered)
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200;

    // If no target element (intro step), center in middle of screen
    if (!targetElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        width: 'auto'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    
    // Position above the button with some spacing
    const spacing = 20; // Space between tooltip and button
    let top = rect.top - tooltipHeight - spacing;
    
    // If not enough space above, position below instead
    if (spaceAbove < tooltipHeight + spacing + 20) {
      top = rect.bottom + spacing;
      setArrowPosition('top'); // Arrow points up to button
    } else {
      setArrowPosition('bottom'); // Arrow points down to button
    }
    
    // Ensure tooltip doesn't go off top or bottom of screen
    top = Math.max(20, Math.min(top, viewportHeight - tooltipHeight - 20));
    
    // Center horizontally on screen
    return {
      top: `${top}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '90vw',
      width: 'auto'
    };
  };

  const getArrowStyles = () => {
    const baseStyles = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    switch (arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid white',
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white',
        };
      case 'left':
        return {
          ...baseStyles,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid white',
        };
      case 'right':
        return {
          ...baseStyles,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid white',
        };
      default:
        return baseStyles;
    }
  };

  const handleNext = () => {
    haptic.light();
    onNext?.();
  };

  // Allow rendering without targetElement for intro step

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4"
      style={getPositionStyles()}
    >
      {/* Arrow - only show if we have a target element */}
      {targetElement && <div style={getArrowStyles()} />}

      {/* Content */}
      <div className="space-y-3">
        {/* Progress indicator */}
        {stepNumber && totalSteps && (
          <div className="text-xs text-text-secondary text-center mb-1">
            Step {stepNumber} of {totalSteps}
          </div>
        )}
        
        {title && (
          <h4 className="text-lg font-display text-text-primary">
            {title}
          </h4>
        )}
        {body && (
          <p className="text-base text-text-secondary leading-relaxed">
            {body}
          </p>
        )}
        
        <div className="flex gap-2 mt-2">
          {showBack && onBack && (
            <button
              onClick={() => {
                haptic.light();
                onBack();
              }}
              className="flex-1 btn btn-secondary text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={showBack && onBack ? "flex-1 btn btn-primary" : "w-full btn btn-primary"}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;

