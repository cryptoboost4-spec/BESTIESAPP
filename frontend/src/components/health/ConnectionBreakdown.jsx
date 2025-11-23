import React from 'react';

const ConnectionBreakdown = ({ avgAlertResponse, avgRecency, circleSize }) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-gradient mb-4">What Makes You Close</h2>

      <div className="space-y-4">
        {/* Alert Response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              <span className="font-semibold text-text-primary">Show Up Factor</span>
            </div>
            <span className="font-bold text-gradient">{Math.round(avgAlertResponse)}/50</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
              style={{ width: `${(avgAlertResponse / 50) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">They drop everything when you need them</p>
        </div>

        {/* Story Engagement - Coming Soon */}
        <div className="relative">
          <div className="opacity-40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📸</span>
                <span className="font-semibold text-text-primary">Story Vibes</span>
                <span className="text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  Coming Soon
                </span>
              </div>
              <span className="font-bold text-gray-400">-/25</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-300 to-gray-300"
                style={{ width: '0%' }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Share moments with your circle (launching soon!)</p>
          </div>
        </div>

        {/* Featured Circle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold text-text-primary">Top 5 Status</span>
            </div>
            <span className="font-bold text-gradient">{circleSize}/5 members</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${(circleSize / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Being in each other's top 5 matters</p>
        </div>

        {/* Recency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="font-semibold text-text-primary">Staying Current</span>
            </div>
            <span className="font-bold text-gradient">{Math.round(avgRecency)}/10</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${(avgRecency / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Keeping the connection alive with regular check-ins</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionBreakdown;
