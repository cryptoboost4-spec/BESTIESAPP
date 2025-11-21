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

  const timePresets = [
    { label: '10m', minutes: 10 },
    { label: '15m', minutes: 15 },
    { label: '30m', minutes: 30 },
    { label: '45m', minutes: 45 },
  ];

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

        {/* Time Preset Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {timePresets.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => setDuration(preset.minutes)}
                className={`py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                  duration === preset.minutes
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
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
