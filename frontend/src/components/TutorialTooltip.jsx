import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [positionStyles, setPositionStyles] = useState(null);
  const [measured, setMeasured] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

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

  // Phase 1: Calculate position with invisible pre-render
  // useLayoutEffect runs synchronously after DOM update but before browser paint
  useLayoutEffect(() => {
    // Reset measured state when targetElement or position changes
    setMeasured(false);

    if (!tooltipRef.current) {
      return;
    }

    // If no target element, calculate position immediately (centered)
    if (!targetElement) {
      // Use triple RAF for initial mount to ensure everything is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const styles = {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '500px'
            };
            setPositionStyles(styles);
            setArrowPosition('top');
            setMeasured(true);
            setIsInitialMount(false);
          });
        });
      });
      return;
    }

    const calculatePosition = () => {
      if (!tooltipRef.current || !targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current.offsetHeight;

      // If tooltip height is still 0, use triple RAF to ensure browser has painted (especially on initial mount)
      if (tooltipHeight === 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // NOW browser has definitely painted
              calculatePosition();
            });
          });
        });
        return;
      }

      // On initial mount, verify element position is stable (not animating/transitioning)
      if (isInitialMount && (rect.top === 0 && rect.left === 0)) {
        // Element might not be positioned yet, wait a bit longer
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            calculatePosition();
          });
        });
        return;
      }

      const viewportWidth = window.innerWidth;
      const buttonTop = rect.top;
      const buttonBottom = rect.bottom;
      const viewportHeight = window.innerHeight;
      const bottomNavHeight = 80;
      const bottomPadding = 20;
      const spacing = 16;
      let top;

      // Calculate tooltip position
      if (position === 'below') {
        top = buttonBottom + spacing;
        const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
        if (top + tooltipHeight > maxBottom) {
          top = Math.max(buttonBottom + 8, maxBottom - tooltipHeight);
        }
      } else {
        top = buttonTop - tooltipHeight - spacing;
        const minTop = 20;
        if (top < minTop) {
          const belowTop = buttonBottom + spacing;
          const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
          if (belowTop + tooltipHeight <= maxBottom) {
            top = belowTop;
          } else {
            top = Math.max(minTop, buttonTop - tooltipHeight - 8);
          }
        }
        const maxTop = buttonTop - tooltipHeight - 8;
        top = Math.min(top, maxTop);
        const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
        if (top + tooltipHeight > maxBottom) {
          top = maxBottom - tooltipHeight;
        }
      }

      const isMobile = viewportWidth < 640;
      const styles = {
        top: `${top}px`,
        left: isMobile ? '1rem' : '50%',
        right: isMobile ? '1rem' : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: isMobile ? 'auto' : '90%',
        maxWidth: isMobile ? 'none' : '500px'
      };

      // Calculate arrow position
      let arrowPos = 'top';
      if (position === 'below') {
        arrowPos = 'top';
      } else if (position === 'left') {
        arrowPos = 'bottom-left';
      } else if (position === 'right') {
        arrowPos = 'bottom-right';
      } else if (position === 'auto') {
        const spaceAbove = rect.top;
        if (spaceAbove < tooltipHeight + 20) {
          arrowPos = 'top';
        } else {
          arrowPos = 'bottom';
        }
      }

      setArrowPosition(arrowPos);
      
      // Set position styles first, then use RAF to show it
      setPositionStyles(styles);
      
      // Use triple RAF on initial mount, double RAF otherwise
      const rafCount = isInitialMount ? 3 : 2;
      let rafChain = () => {
        setMeasured(true);
        setIsInitialMount(false);
      };
      
      for (let i = 0; i < rafCount; i++) {
        const next = rafChain;
        rafChain = () => requestAnimationFrame(next);
      }
      
      rafChain();
    };

    // Use triple RAF on initial mount to ensure browser has completed layout and paint
    // Double RAF for subsequent measurements
    // Add a small timeout on initial mount to ensure everything is settled
    if (isInitialMount) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(calculatePosition);
          });
        });
      }, 16); // One frame delay
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(calculatePosition);
      });
    }
  }, [targetElement, position]);

  // Handle resize and scroll events
  useEffect(() => {
    if (!targetElement || !tooltipRef.current || !measured) return;

    const calculatePosition = () => {
      if (!tooltipRef.current || !targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current.offsetHeight;
      if (tooltipHeight === 0) return;

      const viewportWidth = window.innerWidth;
      const buttonTop = rect.top;
      const buttonBottom = rect.bottom;
      const viewportHeight = window.innerHeight;
      const bottomNavHeight = 80;
      const bottomPadding = 20;
      const spacing = 16;
      let top;

      if (position === 'below') {
        top = buttonBottom + spacing;
        const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
        if (top + tooltipHeight > maxBottom) {
          top = Math.max(buttonBottom + 8, maxBottom - tooltipHeight);
        }
      } else {
        top = buttonTop - tooltipHeight - spacing;
        const minTop = 20;
        if (top < minTop) {
          const belowTop = buttonBottom + spacing;
          const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
          if (belowTop + tooltipHeight <= maxBottom) {
            top = belowTop;
          } else {
            top = Math.max(minTop, buttonTop - tooltipHeight - 8);
          }
        }
        const maxTop = buttonTop - tooltipHeight - 8;
        top = Math.min(top, maxTop);
        const maxBottom = viewportHeight - bottomNavHeight - bottomPadding;
        if (top + tooltipHeight > maxBottom) {
          top = maxBottom - tooltipHeight;
        }
      }

      const isMobile = viewportWidth < 640;
      const styles = {
        top: `${top}px`,
        left: isMobile ? '1rem' : '50%',
        right: isMobile ? '1rem' : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: isMobile ? 'auto' : '90%',
        maxWidth: isMobile ? 'none' : '500px'
      };

      setPositionStyles(styles);
    };

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [targetElement, position, measured]);


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

  // Position off-screen initially until measured to prevent any visual jump
  // Keep it in the DOM but invisible so we can measure dimensions
  const offScreenStyles = {
    top: '-9999px',
    left: '-9999px',
    width: '90%',
    maxWidth: '500px'
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/95 dark:via-pink-900/95 dark:to-purple-900/95 rounded-2xl shadow-2xl p-6 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-md"
      style={{
        ...(measured && positionStyles ? positionStyles : offScreenStyles),
        boxShadow: '0 20px 60px rgba(147, 51, 234, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        opacity: measured ? 1 : 0,
        visibility: measured ? 'visible' : 'hidden',
        pointerEvents: measured ? 'auto' : 'none',
        transition: measured ? 'opacity 0.2s ease-in-out' : 'none'
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

