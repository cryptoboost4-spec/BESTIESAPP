import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import haptic from '../utils/hapticFeedback';

/**
 * Cute dark mode toggle button
 * Shows sun/moon icon with smooth transition
 */
const DarkModeToggle = ({ className = '' }) => {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={() => {
        haptic.selection();
        toggle();
      }}
      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
        isDark ? 'bg-indigo-600' : 'bg-yellow-400'
      } ${className}`}
      aria-label="Toggle dark mode"
    >
      {/* Toggle knob */}
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {/* Icon */}
        <span className="text-sm">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
};

export default DarkModeToggle;
