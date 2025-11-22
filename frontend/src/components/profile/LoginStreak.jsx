import React, { useState } from 'react';
import CountUp from '../CountUp';

const LoginStreak = ({ loginStreak }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (loginStreak <= 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl font-display text-gray-800 dark:text-gray-200 mb-1">Daily Login Streak</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Keep it going! 💪</p>
          </div>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-orange-600 transition-colors cursor-help"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-orange-500 text-white text-xs p-3 rounded-lg shadow-xl z-50">
                <div className="font-semibold mb-1">Keep That Fire Burning! 🔥</div>
                <p className="leading-relaxed">
                  Your streak shows how many days in a row you've checked in with Besties. The longer your streak, the stronger your safety habits! Don't break the chain! 💪
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl mb-1">🔥</div>
          <div className="text-3xl font-display text-orange-600 dark:text-orange-400">
            <CountUp end={loginStreak} duration={1500} />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">days</div>
        </div>
      </div>
    </div>
  );
};

export default LoginStreak;
