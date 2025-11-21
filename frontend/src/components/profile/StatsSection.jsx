import React from 'react';
import CountUp from '../CountUp';

const StatsSection = ({
  bestiesCount,
  emergencyContactCount,
  daysActive,
  userData,
  badges,
  loginStreak,
  nighttimeCheckIns,
  weekendCheckIns
}) => {
  return (
    <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30">
      <h2 className="text-3xl font-display text-gradient mb-6 text-center">Your Impact ✨</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Besties Count */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">💜</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              <CountUp end={bestiesCount} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Besties</div>
          </div>
        </div>

        {/* Emergency Contact Count */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">🛡️</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              <CountUp end={emergencyContactCount} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Times Selected</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">as Emergency Contact</div>
          </div>
        </div>

        {/* Days Active */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">📅</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              <CountUp end={daysActive} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
        </div>

        {/* Completed Check-ins */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">✅</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              <CountUp end={userData?.stats?.completedCheckIns || 0} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Safe Check-ins</div>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">🏆</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
              <CountUp end={badges.length} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Badges Earned</div>
          </div>
        </div>

        {/* Login Streak */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">🔥</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              <CountUp end={loginStreak} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
        </div>

        {/* Nighttime Check-ins */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">🌙</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              <CountUp end={nighttimeCheckIns} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Night Check-ins</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">9 PM - 6 AM</div>
          </div>
        </div>

        {/* Weekend Check-ins */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 text-6xl opacity-10">🎉</div>
          <div className="relative z-10">
            <div className="text-4xl font-display bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              <CountUp end={weekendCheckIns} duration={1500} />
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Weekend Check-ins</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Sat & Sun</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
