import React from 'react';

const BestiesLeaderboard = ({ rankingsPeriod, setRankingsPeriod }) => {
  return (
    <div className="card p-4 bg-white dark:bg-gray-800 border border-pink-100 dark:border-pink-900/30">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="text-3xl">👑</span>
        <h2 className="text-lg font-display text-pink-500 dark:text-pink-400 mt-1">
          {rankingsPeriod === 'weekly' && "This Week's Queens"}
          {rankingsPeriod === 'monthly' && "This Month's Queens"}
          {rankingsPeriod === 'yearly' && "This Year's Queens"}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">your amazing squad 💕</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 justify-center mb-4">
        {[
          { id: 'weekly', label: 'Week' },
          { id: 'monthly', label: 'Month' },
          { id: 'yearly', label: 'Year' }
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setRankingsPeriod(id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              rankingsPeriod === id
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-100 dark:hover:bg-pink-900/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Queen Cards */}
      <div className="space-y-2">
        {/* Most Reliable */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
          <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-800/40 flex items-center justify-center text-lg">
            💖
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-pink-600 dark:text-pink-400">Most Reliable</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">always there for you</p>
          </div>
        </div>

        {/* Super Speedy */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-800/40 flex items-center justify-center text-lg">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-purple-600 dark:text-purple-400">Super Speedy</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">quick to the rescue</p>
          </div>
        </div>

        {/* Guardian Angel */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
          <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-800/40 flex items-center justify-center text-lg">
            🛡️
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-rose-600 dark:text-rose-400">Guardian Angel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">keeping you safe</p>
          </div>
        </div>

        {/* Streak Queen */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center text-lg">
            🔥
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">Streak Queen</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">on fire lately</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-400">
          {rankingsPeriod === 'weekly' && 'resets every monday ✿'}
          {rankingsPeriod === 'monthly' && 'resets on the 1st ✿'}
          {rankingsPeriod === 'yearly' && 'resets jan 1st ✿'}
        </p>
      </div>
    </div>
  );
};

export default BestiesLeaderboard;
