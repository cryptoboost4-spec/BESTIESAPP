import React from 'react';

const BestiesLeaderboard = ({ rankingsPeriod, setRankingsPeriod }) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-light/80 dark:bg-gray-800/80 shadow-soft backdrop-blur-sm">
      <div className="flex w-full grow flex-col items-stretch justify-center gap-4 p-5">
        {/* Header */}
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary dark:text-pink-400">workspace_premium</span>
          <h2 className="text-xl font-display text-text-primary dark:text-gray-100 mt-2 tracking-wide">
            {rankingsPeriod === 'weekly' && "This Week's Queens"}
            {rankingsPeriod === 'monthly' && "This Month's Queens"}
            {rankingsPeriod === 'yearly' && "This Year's Queens"}
          </h2>
          <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">your amazing squad</p>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 justify-center">
          {[
            { id: 'weekly', label: 'Week' },
            { id: 'monthly', label: 'Month' },
            { id: 'yearly', label: 'Year' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setRankingsPeriod(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                rankingsPeriod === id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'bg-slate-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Queen Cards */}
        <div className="space-y-3">
          {/* Most Reliable */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-50/80 to-rose-50/80 dark:from-pink-900/20 dark:to-rose-900/20 backdrop-blur-sm border border-pink-100/50 dark:border-pink-800/30 shadow-inner-soft">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 dark:from-pink-800/40 dark:to-rose-800/40 flex items-center justify-center text-xl shadow-sm">
              <span className="material-symbols-outlined text-pink-600 dark:text-pink-400">favorite</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-pink-700 dark:text-pink-300">Most Reliable</p>
              <p className="text-xs text-text-secondary dark:text-gray-400">always there for you</p>
            </div>
          </div>

          {/* Super Speedy */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur-sm border border-purple-100/50 dark:border-purple-800/30 shadow-inner-soft">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800/40 dark:to-indigo-800/40 flex items-center justify-center text-xl shadow-sm">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">bolt</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-purple-700 dark:text-purple-300">Super Speedy</p>
              <p className="text-xs text-text-secondary dark:text-gray-400">quick to the rescue</p>
            </div>
          </div>

          {/* Guardian Angel */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20 backdrop-blur-sm border border-rose-100/50 dark:border-rose-800/30 shadow-inner-soft">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 dark:from-rose-800/40 dark:to-pink-800/40 flex items-center justify-center text-xl shadow-sm">
              <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">shield</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-rose-700 dark:text-rose-300">Guardian Angel</p>
              <p className="text-xs text-text-secondary dark:text-gray-400">keeping you safe</p>
            </div>
          </div>

          {/* Streak Queen */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm border border-amber-100/50 dark:border-amber-800/30 shadow-inner-soft">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800/40 dark:to-orange-800/40 flex items-center justify-center text-xl shadow-sm">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">local_fire_department</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-amber-700 dark:text-amber-300">Streak Queen</p>
              <p className="text-xs text-text-secondary dark:text-gray-400">on fire lately</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
        <p className="text-xs text-text-secondary dark:text-gray-400">
          {rankingsPeriod === 'weekly' && 'resets every monday ✿'}
          {rankingsPeriod === 'monthly' && 'resets on the 1st ✿'}
          {rankingsPeriod === 'yearly' && 'resets jan 1st ✿'}
        </p>
      </div>
    </div>
  );
};

export default BestiesLeaderboard;
