import React, { useEffect, useRef, useState } from 'react';
import haptic from '../../utils/hapticFeedback';

/**
 * SmallTooltip - Small tooltip that points at specific elements
 * Used for inline guidance during tutorials
 */
const SmallTooltip = ({
  message,
  targetElement,
  position = 'auto', // 'auto', 'top', 'bottom', 'left', 'right'
  onClose,
  onAction,
  actionText,
  showAction = false,
  delay = 0 // Delay before showing (in ms)
}) => {
  const tooltipRef = useRef(null);
  const [arrowPosition, setArrowPosition] = useState('top');
  const [visible, setVisible] = useState(false);

  // Handle delay
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [delay]);

  useEffect(() => {
    if (!targetElement || !tooltipRef.current || !visible) {
      setArrowPosition('top');
      return;
    }

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let arrowPos = 'top';

      if (position === 'below') {
        arrowPos = 'top';
      } else if (position === 'above') {
        arrowPos = 'bottom';
      } else if (position === 'left') {
        arrowPos = 'right';
      } else if (position === 'right') {
        arrowPos = 'left';
      } else if (position === 'auto') {
        // Auto-calculate based on available space
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        // Prefer positioning above or below
        if (spaceAbove > tooltipRect.height + 20) {
          arrowPos = 'bottom'; // Tooltip above, arrow points down
        } else if (spaceBelow > tooltipRect.height + 20) {
          arrowPos = 'top'; // Tooltip below, arrow points up
        } else if (spaceRight > tooltipRect.width + 20) {
          arrowPos = 'left'; // Tooltip right, arrow points left
        } else if (spaceLeft > tooltipRect.width + 20) {
          arrowPos = 'right'; // Tooltip left, arrow points right
        } else {
          // Default to bottom if no space
          arrowPos = 'bottom';
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
  }, [targetElement, position, visible]);

  const getPositionStyles = () => {
    if (!targetElement || !visible) {
      return { display: 'none' };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipHeight = tooltipRect?.height || 100;
    const tooltipWidth = tooltipRect?.width || 200;
    const spacing = 12;

    let top, left;

    if (position === 'below' || (position === 'auto' && arrowPosition === 'top')) {
      // Position below element
      top = rect.bottom + spacing;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (position === 'above' || (position === 'auto' && arrowPosition === 'bottom')) {
      // Position above element
      top = rect.top - tooltipHeight - spacing;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (position === 'right' || (position === 'auto' && arrowPosition === 'left')) {
      // Position to the right
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + spacing;
    } else if (position === 'left' || (position === 'auto' && arrowPosition === 'right')) {
      // Position to the left
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - spacing;
    } else {
      // Default: below
      top = rect.bottom + spacing;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    // Horizontal constraints
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Vertical constraints
    if (top < padding) {
      top = padding;
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: '280px'
    };
  };

  const getArrowStyles = () => {
    if (!targetElement || !visible) return { display: 'none' };

    const baseStyles = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    const isDark = document.documentElement.classList.contains('dark');
    const arrowColor = isDark ? '#581c87' : '#fdf2f8';

    switch (arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `6px solid ${arrowColor}`,
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${arrowColor}`,
        };
      case 'left':
        return {
          ...baseStyles,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: `6px solid ${arrowColor}`,
        };
      case 'right':
        return {
          ...baseStyles,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: `6px solid ${arrowColor}`,
        };
      default:
        return baseStyles;
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10001] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/95 dark:via-pink-900/95 dark:to-purple-900/95 rounded-xl shadow-xl p-4 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-md transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={getPositionStyles()}
      role="tooltip"
    >
      {/* Arrow */}
      {targetElement && <div style={getArrowStyles()} />}

      {/* Content */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary dark:text-gray-100">
          {message}
        </p>

        {/* Action buttons */}
        {showAction && (
          <div className="flex gap-2">
            {onClose && (
              <button
                onClick={() => {
                  haptic.light();
                  onClose();
                }}
                className="flex-1 btn btn-secondary text-xs py-1.5"
              >
                {actionText === 'Move On' ? 'Move On' : 'Later'}
              </button>
            )}
            {onAction && (
              <button
                onClick={() => {
                  haptic.light();
                  onAction();
                }}
                className={`${onClose ? 'flex-1' : 'w-full'} btn bg-gradient-primary text-white text-xs py-1.5 font-semibold`}
              >
                {actionText || 'Add Another'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmallTooltip;

