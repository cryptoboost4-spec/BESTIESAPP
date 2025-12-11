import React from 'react';
import haptic from '../../utils/hapticFeedback';

const DurationSelector = ({ duration, setDuration }) => {
  return (
    <div className="card p-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        How long? ⏰
      </label>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[15, 30, 60, 120].map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => {
              haptic.light();
              setDuration(mins);
            }}
            className={`py-3 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              duration === mins
                ? 'bg-gradient-primary text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
            }`}
            aria-label={`Set duration to ${mins < 60 ? `${mins} minutes` : `${mins / 60} hour${mins / 60 > 1 ? 's' : ''}`}`}
            aria-pressed={duration === mins}
          >
            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
          </button>
        ))}
      </div>

      <input
        type="range"
        min="15"
        max="180"
        step="15"
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="text-center mt-3">
        <div className="text-sm text-text-secondary">
          {duration} minutes
        </div>
        <div className="text-sm font-semibold text-primary mt-1">
          Alert at: {new Date(Date.now() + duration * 60 * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </div>
  );
};

export default DurationSelector;
