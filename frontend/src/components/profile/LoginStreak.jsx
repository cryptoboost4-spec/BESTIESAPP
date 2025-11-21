import React from 'react';
import CountUp from '../CountUp';

const LoginStreak = ({ loginStreak }) => {
  if (loginStreak <= 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-gray-800 dark:text-gray-200 mb-1">Daily Login Streak</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Keep it going! 💪</p>
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
