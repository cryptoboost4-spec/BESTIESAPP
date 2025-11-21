import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';

const WalkingModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(15); // Default 15 minutes

  const handleStart = () => {
    haptic.light();

    // Navigate to create page with walking data
    navigate('/create', {
      state: {
        quickType: 'walking',
        duration: duration,
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
          Let your besties watch over you while you walk. We'll alert them if you don't check in safe.
        </p>

        {/* Duration Slider */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            How long? <span className="text-primary">{duration} minutes</span>
          </label>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 min</span>
            <span>1 hour</span>
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setDuration(10)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              duration === 10
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            10 min
          </button>
          <button
            onClick={() => setDuration(15)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              duration === 15
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            15 min
          </button>
          <button
            onClick={() => setDuration(30)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              duration === 30
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            30 min
          </button>
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
