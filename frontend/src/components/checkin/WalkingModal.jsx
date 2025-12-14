import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';
import TestModeBadge from '../TestModeBadge';

const WalkingModal = ({ onClose, isTutorialMode = false, onTutorialComplete }) => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(15); // Default 15 minutes
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);
  const durationRef = useRef(null);

  // Tutorial hint state
  const [showTimeHint, setShowTimeHint] = useState(false);
  const [showButtonHint, setShowButtonHint] = useState(false);
  const [hasChangedDuration, setHasChangedDuration] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  }, [onClose]);

  // Focus management and keyboard trap
  useEffect(() => {
    // Focus first button when modal opens (only if not in tutorial mode)
    if (!isTutorialMode && firstButtonRef.current) {
      setTimeout(() => firstButtonRef.current?.focus(), 100);
    }

    // Trap focus within modal
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleClose, isTutorialMode]);

  // Tutorial hint system - only active when isTutorialMode is true
  useEffect(() => {
    if (!isTutorialMode) return;

    // Hint 1: Show time hint after 2 seconds
    const timeHintTimer = setTimeout(() => {
      setShowTimeHint(true);
    }, 2000);

    return () => clearTimeout(timeHintTimer);
  }, [isTutorialMode]);

  useEffect(() => {
    if (!isTutorialMode) return;

    // Hint 2: Show button hint after duration changed OR after 10 seconds
    const buttonHintTimer = setTimeout(() => {
      setShowButtonHint(true);
      setShowTimeHint(false);
    }, 10000);

    if (hasChangedDuration) {
      clearTimeout(buttonHintTimer);
      setShowButtonHint(true);
      setShowTimeHint(false);
    }

    return () => clearTimeout(buttonHintTimer);
  }, [isTutorialMode, hasChangedDuration]);

  const handleStart = () => {
    haptic.light();

    if (isTutorialMode) {
      // In tutorial mode, DON'T navigate to /create
      // Just close modal and return to home page
      // Tutorial will advance to next step automatically
      if (onTutorialComplete) {
        onTutorialComplete();
      }
      handleClose();
      return;
    }

    // Normal mode - navigate to create page
    navigate('/create', {
      state: {
        quickType: 'walking',
        duration: duration,
        skipLocation: true,
        activity: { name: '🚶‍♀️ Walking Alone', emoji: '🚶‍♀️' }
      }
    });
  };


  return (
    <div 
      className={`fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="walking-modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-200 max-h-[calc(100vh-2rem)] overflow-y-auto ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="walking-modal-title" className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>🚶‍♀️</span> Walking Alone
        </h2>

        {isTutorialMode && <TestModeBadge />}

        <p className="text-sm text-text-secondary mb-6">
          Select duration and start your check-in. You can add location details during your walk.
        </p>

        {/* Duration Selection */}
        <div className="mb-6" ref={durationRef}>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Duration: {duration} minutes
          </label>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[10, 15, 30, 45].map((mins, index) => (
              <button
                key={mins}
                ref={index === 0 ? firstButtonRef : null}
                type="button"
                onClick={() => {
                  haptic.light();
                  setDuration(mins);
                  if (!hasChangedDuration) {
                    setHasChangedDuration(true);
                  }
                }}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  duration === mins
                    ? 'bg-gradient-primary text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
                }`}
                aria-label={`Set duration to ${mins} minutes`}
                aria-pressed={duration === mins}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Fine-tune slider */}
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={duration}
            onChange={(e) => {
              setDuration(parseInt(e.target.value));
              if (!hasChangedDuration) {
                setHasChangedDuration(true);
              }
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>10 min</span>
            <span>90 min</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 btn btn-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Cancel and close modal"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 btn btn-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isTutorialMode ? "Continue tutorial" : "Start walking check-in"}
          >
            {isTutorialMode ? 'Ready for Next Step' : 'Start Check-In'}
          </button>
        </div>

        {/* Tutorial Hints */}
        {isTutorialMode && showButtonHint && (
          <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 bg-purple-600 text-white text-sm px-4 py-2 rounded-lg shadow-xl animate-bounce z-[60] whitespace-nowrap">
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-600"></div>
            👇 Press to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkingModal;
