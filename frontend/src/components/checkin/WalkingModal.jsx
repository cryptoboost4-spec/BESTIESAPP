import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';

const WalkingModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(15); // Default 15 minutes

  const handleStart = () => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>🚶‍♀️</span> Walking Alone
        </h2>

        <p className="text-sm text-text-secondary mb-6">
          Select duration and start your check-in. You can add location details during your walk.
        </p>

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
                onClick={() => setDuration(mins)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  duration === mins
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
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
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 btn btn-primary"
          >
            Start Check-In
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkingModal;
