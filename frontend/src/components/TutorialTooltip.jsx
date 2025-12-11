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
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Ensure tooltip stays within viewport
    let left, top, bottom, right;
    let transform = '';

    switch (calculatedPosition) {
      case 'above':
        left = Math.max(10, Math.min(rect.left + rect.width / 2, viewportWidth - 10));
        bottom = Math.max(tooltipHeight + 20, viewportHeight - rect.top + 10);
        transform = 'translateX(-50%)';
        return { bottom: `${bottom}px`, left: `${left}px`, transform, maxWidth: '90vw' };
      case 'below':
        left = Math.max(10, Math.min(rect.left + rect.width / 2, viewportWidth - 10));
        top = Math.min(rect.bottom + 10, viewportHeight - tooltipHeight - 20);
        transform = 'translateX(-50%)';
        return { top: `${top}px`, left: `${left}px`, transform, maxWidth: '90vw' };
      case 'left':
        right = Math.max(10, viewportWidth - rect.left + 10);
        top = Math.max(10, Math.min(rect.top + rect.height / 2, viewportHeight - tooltipHeight / 2));
        transform = 'translateY(-50%)';
        return { top: `${top}px`, right: `${right}px`, transform, maxWidth: '90vw' };
      case 'right':
        left = Math.min(rect.right + 10, viewportWidth - tooltipWidth - 10);
        top = Math.max(10, Math.min(rect.top + rect.height / 2, viewportHeight - tooltipHeight / 2));
        transform = 'translateY(-50%)';
        return { top: `${top}px`, left: `${left}px`, transform, maxWidth: '90vw' };
      default:
        left = Math.max(10, Math.min(rect.left + rect.width / 2, viewportWidth - 10));
        top = Math.min(rect.bottom + 10, viewportHeight - tooltipHeight - 20);
        transform = 'translateX(-50%)';
        return { top: `${top}px`, left: `${left}px`, transform, maxWidth: '90vw' };
    }
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

  if (!targetElement) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4"
      style={getPositionStyles()}
    >
      {/* Arrow */}
      <div style={getArrowStyles()} />

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

