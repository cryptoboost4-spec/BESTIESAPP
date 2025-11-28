import React from 'react';

const HealthScoreCard = ({ healthScore, setShowPerfectCircle, showPerfectCircle }) => {
  return (
    <div className="card p-6 md:p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>

      <div className="relative z-10 text-center">
        <div className="text-sm font-semibold text-gray-600 mb-2">Your Overall Vibe</div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-6xl md:text-7xl font-display text-gradient">{healthScore}</span>
          <span className="text-3xl text-gray-400">/100</span>
        </div>

        {/* Visual Health Bar */}
        <div className="w-full max-w-md mx-auto h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-primary transition-all duration-1000 rounded-full"
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>

        <div className="text-lg font-semibold text-gray-700">
          {healthScore >= 90 && '🔥 Unbreakable! Your circle is goals fr'}
          {healthScore >= 70 && healthScore < 90 && '⚡ Super solid! Keep it up'}
          {healthScore >= 50 && healthScore < 70 && '💪 Pretty strong! You got this'}
          {healthScore >= 30 && healthScore < 50 && '🔆 Getting there! Keep building'}
          {healthScore < 30 && '🌱 Just starting! Lots of potential'}
        </div>

        <button
          onClick={() => setShowPerfectCircle(!showPerfectCircle)}
          className="mt-4 px-6 py-2 bg-white text-primary font-semibold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto border-2 border-purple-200"
        >
          {showPerfectCircle ? '← Back to my stats' : <>See the dream circle ✨</>}
        </button>
      </div>
    </div>
  );
};

export default HealthScoreCard;
