import React from 'react';

const CircleCenterScore = ({
  loadingConnections,
  circleBestiesLength,
  overallHealth,
  showVibeTooltip,
  setShowVibeTooltip
}) => {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-primary rounded-full flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white ring-4 ring-purple-200 animate-breathe relative group">
        {loadingConnections ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : circleBestiesLength === 0 ? (
          <div className="text-center px-2">
            <div className="text-2xl mb-0.5">💜</div>
            <div className="text-[10px] font-semibold leading-tight">Begin<br/>Here</div>
          </div>
        ) : (
          <>
            <div className="text-2xl md:text-3xl font-bold leading-none">{overallHealth}</div>
            <div className="text-xs font-semibold opacity-90">Your Vibe</div>

            {/* Info Tooltip for Context - Mobile & Desktop Friendly */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVibeTooltip(!showVibeTooltip);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 md:w-5 md:h-5 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform active:scale-95 z-40"
            >
              <span className="text-sm md:text-xs">ℹ️</span>
            </button>
            {showVibeTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 animate-fade-in">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl max-w-xs">
                  <div className="font-bold mb-1">Your Circle Strength</div>
                  <div className="text-white/90 text-xs whitespace-normal w-48">
                    {overallHealth >= 90 && "🔥 Unbreakable - You and your circle are inseparable!"}
                    {overallHealth >= 70 && overallHealth < 90 && "⚡ Powerful - Strong bonds, keep nurturing them!"}
                    {overallHealth >= 50 && overallHealth < 70 && "💪 Strong - Solid friendships, growing stronger!"}
                    {overallHealth >= 30 && overallHealth < 50 && "🔆 Growing - Building momentum together!"}
                    {overallHealth < 30 && "🌱 Spark - Just getting started, lots of potential!"}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-pink-600"></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CircleCenterScore;
