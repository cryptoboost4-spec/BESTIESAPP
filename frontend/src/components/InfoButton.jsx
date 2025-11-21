import React, { useState, useRef, useEffect } from 'react';

const InfoButton = ({ message }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState('left');
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

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

  // Calculate optimal tooltip position to keep it on screen
  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 200; // maxWidth from styling

      // Check if tooltip would go off right edge
      if (buttonRect.left + tooltipWidth > viewportWidth - 20) {
        setTooltipPosition('right');
      } else {
        setTooltipPosition('left');
      }
    }
  }, [showTooltip]);

  const handleClick = (e) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  return (
    <div className="relative inline-block ml-2">
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

      {/* Tooltip Bubble */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute ${tooltipPosition === 'right' ? 'right-0' : 'left-0'} top-full mt-2 z-50 animate-scale-up`}
          style={{ minWidth: '160px', maxWidth: '200px' }}
        >
          <div className="bg-white dark:bg-gray-800 bg-opacity-100 dark:bg-opacity-100 rounded-lg shadow-xl border-2 border-primary dark:border-purple-400 p-2.5">
            <div className="flex items-start gap-1.5">
              <span className="text-sm flex-shrink-0">ℹ️</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 dark:text-gray-100 leading-snug font-medium">{message}</p>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="mt-1.5 text-primary dark:text-purple-400 text-xs font-semibold underline hover:no-underline"
                >
                  Got it!
                </button>
              </div>
            </div>
            {/* Arrow pointing up */}
            <div className={`absolute bottom-full ${tooltipPosition === 'right' ? 'right-3' : 'left-3'} w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-primary dark:border-b-purple-400`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoButton;
