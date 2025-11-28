import React from 'react';

const BestiesLeaderboard = ({ rankingsPeriod, setRankingsPeriod }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle sparkly background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-2 left-2 text-pink-200 text-sm">✨</div>
        <div className="absolute top-3 right-3 text-purple-200 text-sm">💫</div>
        <div className="absolute bottom-2 left-3 text-pink-200 text-sm">⭐</div>
      </div>

      <div className="card p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-600 shadow-lg relative">
        {/* Cute header with crown */}
        <div className="text-center mb-3">
          <div className="text-3xl mb-1">👑</div>
          <h2 className="text-lg font-display bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {rankingsPeriod === 'weekly' && "This Week's Queens"}
            {rankingsPeriod === 'monthly' && "This Month's Queens"}
            {rankingsPeriod === 'yearly' && "This Year's Queens"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Your amazing squad! 💕</p>
        </div>

        {/* Period Tabs - Compact */}
        <div className="flex gap-1.5 justify-center mb-3">
          <button
            onClick={() => setRankingsPeriod('weekly')}
            className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
              rankingsPeriod === 'weekly'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
            }`}
          >
            📅 Week
          </button>
          <button
            onClick={() => setRankingsPeriod('monthly')}
            className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
              rankingsPeriod === 'monthly'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
            }`}
          >
            🗓️ Month
          </button>
          <button
            onClick={() => setRankingsPeriod('yearly')}
            className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
              rankingsPeriod === 'yearly'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600'
            }`}
          >
            🎯 Year
          </button>
        </div>

        <div className="space-y-2">
          {/* Most Reliable - Pink gradient */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-rose-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-pink-200 dark:border-pink-600 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                    💖
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    🏆
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    Most Reliable
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Always there for you 💕</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fastest Responder - Purple gradient */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-fuchsia-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-purple-200 dark:border-purple-600 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-300 to-fuchsia-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                    ⚡
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    🏆
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                    Super Speedy
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Quick to the rescue 💜</div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Champion - Rose gradient */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-pink-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-rose-200 dark:border-rose-600 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                    🛡️
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    🏆
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                    Guardian Angel
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Keeping you safe 🌸</div>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Queen - Yellow gradient */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-300 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-md border border-yellow-200 dark:border-yellow-600 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center text-lg shadow-sm">
                    🔥
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    🏆
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                    Streak Queen
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">On fire lately! ✨</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cute footer */}
        <div className="mt-3 pt-2 border-t border-pink-200 dark:border-pink-600 text-center">
          <p className="text-xs font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            {rankingsPeriod === 'weekly' && '💫 Resets Monday'}
            {rankingsPeriod === 'monthly' && '💫 Resets on 1st'}
            {rankingsPeriod === 'yearly' && '💫 Resets Jan 1st'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BestiesLeaderboard;
