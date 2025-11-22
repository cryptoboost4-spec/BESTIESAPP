import React, { useState } from 'react';
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
  const [showTooltip, setShowTooltip] = useState(null);

  const StatCard = ({ emoji, value, label, sublabel, gradient, tooltip, id }) => (
    <div
      className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow group cursor-help"
      onMouseEnter={() => setShowTooltip(id)}
      onMouseLeave={() => setShowTooltip(null)}
      onClick={() => setShowTooltip(showTooltip === id ? null : id)}
    >
      <div className="absolute top-0 right-0 text-6xl opacity-10">{emoji}</div>
      <div className="relative z-10">
        <div className={`text-4xl font-display bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
          <CountUp end={value} duration={1500} />
        </div>
        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</div>
        {sublabel && <div className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</div>}
      </div>

      {/* Tooltip */}
      {showTooltip === id && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-purple-600 text-white text-xs p-3 rounded-lg shadow-xl z-50 pointer-events-none">
          <p className="leading-relaxed">{tooltip}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30">
      <h2 className="text-3xl font-display text-gradient mb-6 text-center">Your Impact ✨</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Besties Count */}
        <StatCard
          id="besties"
          emoji="💜"
          value={bestiesCount}
          label="Besties"
          gradient="from-purple-600 to-pink-600"
          tooltip="These are your people! Every bestie you add makes your safety net stronger. The more besties you have, the more people looking out for you. 💜"
        />

        {/* Emergency Contact Count */}
        <StatCard
          id="emergency"
          emoji="🛡️"
          value={emergencyContactCount}
          label="Times Selected"
          sublabel="as Emergency Contact"
          gradient="from-blue-600 to-cyan-600"
          tooltip="Your besties trust you! This shows how many times your friends chose you as their emergency contact. You're making a real difference in their lives. 🛡️"
        />

        {/* Days Active */}
        <StatCard
          id="days"
          emoji="📅"
          value={daysActive}
          label="Days Active"
          gradient="from-green-600 to-emerald-600"
          tooltip="This is how long you've been part of the Besties family! Every day you're here, you're building safer habits and stronger connections. Keep going! ✨"
        />

        {/* Completed Check-ins */}
        <StatCard
          id="checkins"
          emoji="✅"
          value={userData?.stats?.completedCheckIns || 0}
          label="Safe Check-ins"
          gradient="from-pink-600 to-rose-600"
          tooltip="Every check-in you complete safely is a win! This number shows how many times you've made it home safe and let your besties know. You're doing amazing! 💕"
        />

        {/* Badges Earned */}
        <StatCard
          id="badges"
          emoji="🏆"
          value={badges.length}
          label="Badges Earned"
          gradient="from-yellow-600 to-orange-600"
          tooltip="These are your trophies for being an awesome bestie! Each badge celebrates your commitment to staying safe and supporting your friends. Collect them all! 🌟"
        />

        {/* Login Streak */}
        <StatCard
          id="streak"
          emoji="🔥"
          value={loginStreak}
          label="Day Streak"
          gradient="from-orange-600 to-red-600"
          tooltip="You're on fire! This shows how many days in a row you've checked in with Besties. Consistency is key to building strong safety habits. Keep that streak alive! 🔥"
        />

        {/* Nighttime Check-ins */}
        <StatCard
          id="night"
          emoji="🌙"
          value={nighttimeCheckIns}
          label="Night Check-ins"
          sublabel="9 PM - 6 AM"
          gradient="from-indigo-600 to-purple-600"
          tooltip="Late night adventures? These are your check-ins between 9 PM and 6 AM. Whether it's a night out or just getting home late, you're staying smart and safe! 🌙"
        />

        {/* Weekend Check-ins */}
        <StatCard
          id="weekend"
          emoji="🎉"
          value={weekendCheckIns}
          label="Weekend Check-ins"
          sublabel="Sat & Sun"
          gradient="from-teal-600 to-cyan-600"
          tooltip="Weekend warrior! These are all your Saturday and Sunday check-ins. You know how to have fun and stay safe at the same time. That's the bestie way! 🎉"
        />
      </div>
    </div>
  );
};

export default StatsSection;
