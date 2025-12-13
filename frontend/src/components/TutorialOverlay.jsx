import React, { useEffect, useRef, useState } from 'react';
import TutorialTooltip from './TutorialTooltip';
import haptic from '../utils/hapticFeedback';

// Tutorial overlay with improved scrolling behavior

const TutorialOverlay = ({ 
  currentStep, 
  onStepComplete, 
  onTutorialComplete,
  onStepBack,
  highlightedElementRef,
  tooltipConfig,
  stepNumber,
  totalSteps,
  isPaused = false
}) => {
  const overlayRef = useRef(null);
  const [highlightRect, setHighlightRect] = useState(null);
  const [scrollComplete, setScrollComplete] = useState(false);

  // Lock screen and update highlight position when element changes
  useEffect(() => {
    // Reset scroll complete state when step changes
    setScrollComplete(false);
    
    if (!highlightedElementRef?.current) {
      setHighlightRect(null);
      // Unlock screen if no element
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      return;
    }

    const element = highlightedElementRef.current;
    
    // Enhanced error handling: Verify element is in DOM
    if (!document.body.contains(element)) {
      console.warn('[Tutorial] Highlighted element is not in DOM, skipping highlight');
      setHighlightRect(null);
      return;
    }

    // Define updateHighlight first (before lockScreen uses it)
    const updateHighlight = () => {
      const rect = element.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    // FIRST: Scroll element into view, ensuring it and tooltip are visible
    const scrollElementIntoView = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const bottomNavHeight = 80; // Bottom nav bar height
      const tooltipHeight = 300; // Estimated tooltip height (conservative estimate)
      const spacing = 16; // Space between element and tooltip
      const topPadding = 20; // Padding from top of screen
      const bottomPadding = 20; // Padding above nav bar
      
      // Get element's current position
      const elementTop = rect.top + window.scrollY;
      const elementBottom = elementTop + rect.height;
      const currentScrollY = window.scrollY;
      
      // Calculate ideal position: center the element in the safe zone
      // But ensure tooltip can fit above or below
      const safeZoneTop = topPadding + tooltipHeight + spacing;
      const safeZoneBottom = viewportHeight - bottomNavHeight - bottomPadding;
      const safeZoneCenter = (safeZoneTop + safeZoneBottom) / 2;
      
      // Target: position element so its center aligns with safe zone center
      const targetElementCenter = safeZoneCenter;
      const scrollOffset = targetElementCenter - (rect.top + rect.height / 2);
      let targetScrollY = currentScrollY + scrollOffset;
      
      // But ensure element doesn't go off screen
      // Minimum: element top should be at least at safeZoneTop
      const minScrollY = elementTop - safeZoneTop;
      // Maximum: element bottom should be at most at safeZoneBottom
      const maxScrollY = elementBottom - safeZoneBottom;
      
      // Clamp target scroll
      if (targetScrollY < minScrollY) {
        targetScrollY = minScrollY;
      } else if (targetScrollY > maxScrollY) {
        targetScrollY = maxScrollY;
      }
      
      // Also ensure we don't scroll beyond document bounds
      const maxDocumentScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
      targetScrollY = Math.max(0, Math.min(targetScrollY, maxDocumentScroll));
      
      // Only scroll if needed (more than 5px difference)
      if (Math.abs(targetScrollY - currentScrollY) > 5) {
        // Use smooth scroll for better UX
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
        
        // Wait for scroll to complete before locking and showing tooltip
        let scrollCheckCount = 0;
        const maxChecks = 50; // Max 2.5 seconds (50 * 50ms)
        
        const checkScrollComplete = () => {
          scrollCheckCount++;
          const currentY = window.scrollY;
          const scrollDiff = Math.abs(currentY - targetScrollY);
          
          // Check if scroll is complete (within 2px) or if we've waited too long
          if (scrollDiff < 2 || scrollCheckCount >= maxChecks) {
            // Scroll complete (or timeout), lock screen and show tooltip
            // Small delay to ensure DOM is settled and user sees the scroll
            setTimeout(() => {
              lockScreen();
              // Signal that scroll is complete and tooltip can show
              setScrollComplete(true);
            }, 100);
          } else {
            // Still scrolling, check again
            setTimeout(checkScrollComplete, 50);
          }
        };
        
        // Start checking after smooth scroll begins
        setTimeout(checkScrollComplete, 100);
      } else {
        // No scroll needed, lock immediately but still delay tooltip slightly
        requestAnimationFrame(() => {
          lockScreen();
          setTimeout(() => {
            setScrollComplete(true);
          }, 100);
        });
      }
    };
    
    // Start scrolling
    scrollElementIntoView();

    function lockScreen() {
      // Lock screen - prevent scrolling
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      // Add class to elevate z-index of highlighted element
      element.classList.add('tutorial-highlighted-element');
      element.style.zIndex = '95';
      element.style.position = 'relative';

      updateHighlight();
    }

    // Only listen to resize, not scroll (since we're locking scroll)
    window.addEventListener('resize', updateHighlight);

    return () => {
      // Cleanup: remove class and z-index
      element.classList.remove('tutorial-highlighted-element');
      element.style.zIndex = '';
      element.style.position = '';
      window.removeEventListener('resize', updateHighlight);
      
      // Unlock screen
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [highlightedElementRef]);

  // Handle keyboard navigation - World-class UX
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentStep) return;

      // ESC to exit
      if (e.key === 'Escape') {
        haptic.light();
        const shouldExit = window.confirm('Exit tutorial? Don\'t worry - you can always start it again later! 💜');
        if (shouldExit) {
          onTutorialComplete?.();
        }
        return;
      }

      // Arrow keys for navigation (if enabled)
      if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        haptic.light();
        onStepComplete?.();
      } else if (e.key === 'ArrowLeft' && onStepBack && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        haptic.light();
        onStepBack?.();
      }

      // Enter to continue
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        haptic.light();
        onStepComplete?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onTutorialComplete, onStepComplete, onStepBack]);

  const handleNext = () => {
    if (tooltipConfig?.onNext) {
      tooltipConfig.onNext();
    } else {
      onStepComplete?.();
    }
  };

  if (!currentStep || !tooltipConfig) return null;

  return (
    <>
      {/* Dark Overlay - full screen, highlighted element will be above it */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          isPaused ? 'bg-black/40' : 'bg-black/75'
        }`}
        onClick={(e) => {
          // During quickCheckIns step, allow clicks through to buttons
          // Otherwise, prevent clicks outside highlighted area
          if (currentStep !== 'quickCheckIns') {
            e.stopPropagation();
          }
        }}
        style={{
          pointerEvents: currentStep === 'quickCheckIns' ? 'none' : 'auto'
        }}
        aria-hidden="true"
      />

      {/* Highlighted Element Glow - positioned above overlay */}
      {highlightedElementRef?.current && highlightRect && (
        <>
          {/* Glow effect around element - Enhanced */}
          <div
            className="fixed z-[92] pointer-events-none transition-all duration-500 tutorial-highlight-enhanced"
            style={{
              top: `${highlightRect.top - 4}px`,
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              borderRadius: '16px',
              filter: 'brightness(1.15)',
            }}
          />
        </>
      )}

      {/* Tooltip - only show after scroll completes */}
      {scrollComplete && (
        <TutorialTooltip
          title={tooltipConfig.title}
          body={tooltipConfig.body}
          buttonText={tooltipConfig.buttonText === null ? null : (tooltipConfig.buttonText || 'Next')}
          onNext={handleNext}
          onBack={onStepBack}
          onSkip={tooltipConfig.onSkip || onTutorialComplete}
          showBack={stepNumber > 1}
          showSkip={true}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          targetElement={highlightedElementRef?.current}
          position={tooltipConfig.position}
        />
      )}
    </>
  );
};

export default TutorialOverlay;

