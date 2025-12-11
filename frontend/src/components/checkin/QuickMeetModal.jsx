import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';

const QuickMeetModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 minutes
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  }, [onClose]);

  // Focus management and keyboard trap
  useEffect(() => {
    // Focus first input when modal opens
    if (firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
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
  }, [handleClose]);

  const handleStart = () => {
    if (!name.trim()) {
      return;
    }
    haptic.light();

    // Navigate to create page with quick meet data - NO LOCATION NEEDED
    navigate('/create', {
      state: {
        quickType: 'quickmeet',
        meetingWith: name.trim(),
        duration: duration,
        skipLocation: true, // Skip location input
        activity: { name: '👤 Meeting Someone', emoji: '👤' }
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
      aria-labelledby="quickmeet-modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="quickmeet-modal-title" className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>👤</span> Quick Meet
        </h2>

        <p className="text-sm text-text-secondary mb-6">
          Enter who you're meeting and select duration
        </p>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Who are you meeting?
          </label>
          <input
            ref={firstInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (name.trim()) {
                  handleStart();
                } else {
                  e.target.blur(); // Close keyboard if invalid
                }
              }
            }}
            placeholder="e.g., Sarah from Marketplace"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
            aria-label="Name of person you're meeting"
            aria-required="true"
          />
        </div>

        {/* Duration Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Duration: {duration} minutes
          </label>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[10, 15, 30, 45].map((mins) => (
              <button
                key={mins}
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
            disabled={!name.trim()}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Start quick meet check-in"
          >
            Start Check-In
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickMeetModal;
