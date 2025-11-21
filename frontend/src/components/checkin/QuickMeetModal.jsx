import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../../utils/hapticFeedback';

const QuickMeetModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60); // Default 60 minutes

  const handleStart = () => {
    if (!name.trim()) {
      return;
    }
    haptic.light();

    // Navigate to create page with quick meet data
    navigate('/create', {
      state: {
        quickType: 'quickmeet',
        meetingWith: name.trim(),
        duration: duration,
        activity: { name: '👤 Meeting Someone', emoji: '👤' }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display text-text-primary mb-4 flex items-center gap-2">
          <span>👤</span> Quick Meet
        </h2>

        <p className="text-sm text-text-secondary mb-6">
          Meeting someone new? Let your besties know who you're with
        </p>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Who are you meeting?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sarah from Marketplace"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none"
            autoFocus
          />
        </div>

        {/* Duration Slider */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            How long? <span className="text-primary">{duration} minutes</span>
          </label>
          <input
            type="range"
            min="15"
            max="180"
            step="15"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>15 min</span>
            <span>3 hours</span>
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setDuration(30)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              duration === 30
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            30m
          </button>
          <button
            onClick={() => setDuration(60)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              duration === 60
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1h
          </button>
          <button
            onClick={() => setDuration(90)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              duration === 90
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1.5h
          </button>
          <button
            onClick={() => setDuration(120)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              duration === 120
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            2h
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
            disabled={!name.trim()}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Check-In
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickMeetModal;
