import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';
import TutorialTooltip from '../TutorialTooltip';

const WalkingModal = ({ onClose, isTutorialMode = false }) => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(15); // Default 15 minutes
  const [isClosing, setIsClosing] = useState(false);
  const [showTutorialTooltip, setShowTutorialTooltip] = useState(false);
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);
  const durationRef = useRef(null);

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
    
    // Show tutorial tooltip after modal opens
    if (isTutorialMode) {
      setTimeout(() => setShowTutorialTooltip(true), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

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
  }, [handleClose]);

  const handleStart = () => {
    if (isTutorialMode) {
      // In tutorial mode, just close after showing tooltip
      handleClose();
      return;
    }

    haptic.light();

    // Navigate to create page with walking data - NO LOCATION NEEDED
    navigate('/create', {
      state: {
        quickType: 'walking',
        duration: duration,
        skipLocation: true, // Skip location input
        activity: { name: '🚶‍♀️ Walking Alone', emoji: '🚶‍♀️' }
      }
    });
  };

  const handleTutorialNext = () => {
    handleClose();
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
        className={`bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="walking-modal-title" className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>🚶‍♀️</span> Walking Alone
        </h2>

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
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>10 min</span>
            <span>90 min</span>
          </div>
          {isTutorialMode && showTutorialTooltip && durationRef.current && (
            <TutorialTooltip
              body="Choose how long you'll be walking. Your bestie gets notified if you don't return on time."
              buttonText="Next"
              onNext={handleTutorialNext}
              targetElement={durationRef.current}
            />
          )}
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
            aria-label={isTutorialMode ? "Close tutorial" : "Start walking check-in"}
          >
            {isTutorialMode ? 'Got it!' : 'Start Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkingModal;
