import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';

const RideshareModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [rego, setRego] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 minutes

  const handleStart = () => {
    if (!rego.trim()) {
      return;
    }
    haptic.light();

    // Navigate to create page with rideshare data - NO LOCATION NEEDED
    navigate('/create', {
      state: {
        quickType: 'rideshare',
        rego: rego.trim(),
        duration: duration,
        skipLocation: true, // Skip location input
        activity: { name: '🚗 Rideshare', emoji: '🚗' }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>🚗</span> Rideshare Check-In
        </h2>

        <p className="text-sm text-text-secondary mb-6">
          Enter your vehicle registration and select duration
        </p>

        {/* Rego Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Registration / License Plate
          </label>
          <input
            type="text"
            value={rego}
            onChange={(e) => setRego(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none text-lg font-semibold text-center"
            autoFocus
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
            disabled={!rego.trim()}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Check-In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideshareModal;
