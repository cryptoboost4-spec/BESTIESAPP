import React, { useState, useRef, useEffect } from 'react';

const InfoButton = ({ message, detailedMessage }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate tooltip position to stay within viewport
  useEffect(() => {
    if (showTooltip && buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobileNavHeight = 80; // Approximate height of mobile bottom nav
      const padding = 16; // 1rem padding
      const tooltipGap = 8; // Gap between button and tooltip
      
      // Find the card container (parent with 'card' class)
      let cardElement = buttonRef.current.closest('.card');
      if (!cardElement) {
        // Fallback: find the nearest container with max-width
        cardElement = buttonRef.current.closest('[class*="max-w"]');
      }
      
      const cardRect = cardElement ? cardElement.getBoundingClientRect() : null;
      const cardWidth = cardRect ? cardRect.width : viewportWidth - (padding * 2);
      const cardLeft = cardRect ? cardRect.left : padding;
      
      // Calculate tooltip width (full card width minus padding)
      const tooltipWidth = Math.min(cardWidth - (padding * 2), viewportWidth - (padding * 2));
      
      // Calculate horizontal position (center of card)
      const tooltipLeft = cardLeft + (cardWidth / 2) - (tooltipWidth / 2);
      
      // Always position tooltip below the button
      const top = buttonRect.bottom + tooltipGap;
      const arrowPosition = buttonRect.left + (buttonRect.width / 2) - tooltipLeft;
      const arrowDirection = 'up';
      
      // Calculate available space below button (accounting for mobile nav)
      const availableSpaceBelow = viewportHeight - buttonRect.bottom - mobileNavHeight - tooltipGap - padding;
      
      // Ensure tooltip doesn't go off screen horizontally
      const clampedLeft = Math.max(padding, Math.min(tooltipLeft, viewportWidth - tooltipWidth - padding));
      
      setTooltipStyle({
        position: 'fixed',
        left: `${clampedLeft}px`,
        width: `${tooltipWidth}px`,
        top: `${top}px`,
        maxHeight: `${Math.max(100, availableSpaceBelow)}px`, // Ensure at least 100px height, but respect available space
        zIndex: 9998,
        arrowLeft: `${arrowPosition}px`,
        arrowDirection: arrowDirection
      });
    }
  }, [showTooltip, expanded, detailedMessage]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // Close tooltip on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showTooltip) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [showTooltip]);

  const handleClick = (e) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
    if (!showTooltip) {
      setExpanded(false); // Reset expanded state when opening tooltip
    }
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div ref={containerRef} className="relative inline-block ml-2">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-primary dark:text-purple-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
        title="Learn more"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Full-Width Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="fixed animate-scale-up overflow-y-auto"
          style={tooltipStyle}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-primary dark:border-purple-400 p-4 transition-all duration-200">
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">ℹ️</span>
              <div className="flex-1 min-w-0">
                {!expanded ? (
                  <>
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed break-words">{message}</p>
                    {detailedMessage && (
                      <button
                        onClick={handleToggleExpand}
                        className="mt-3 text-primary dark:text-purple-400 text-sm font-semibold underline hover:no-underline flex items-center gap-1"
                      >
                        More info →
                      </button>
                    )}
                    {!detailedMessage && (
                      <button
                        onClick={() => setShowTooltip(false)}
                        className="mt-3 text-primary dark:text-purple-400 text-sm font-semibold underline hover:no-underline"
                      >
                        Got it!
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed break-words">{detailedMessage}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={handleToggleExpand}
                        className="text-primary dark:text-purple-400 text-sm font-semibold underline hover:no-underline flex items-center gap-1"
                      >
                        ← Less info
                      </button>
                      <button
                        onClick={() => setShowTooltip(false)}
                        className="text-primary dark:text-purple-400 text-sm font-semibold underline hover:no-underline"
                      >
                        Got it!
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Arrow pointing to button */}
            {tooltipStyle.arrowDirection === 'up' ? (
              <div 
                className="absolute bottom-full w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-primary dark:border-b-purple-400"
                style={{
                  left: `${tooltipStyle.arrowLeft || 0}px`,
                  transform: 'translateX(-50%)'
                }}
              ></div>
            ) : (
              <div 
                className="absolute top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-primary dark:border-t-purple-400"
                style={{
                  left: `${tooltipStyle.arrowLeft || 0}px`,
                  transform: 'translateX(-50%)'
                }}
              ></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoButton;
