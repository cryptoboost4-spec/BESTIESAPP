import React from 'react';
import { useNavigate } from 'react-router-dom';

const CircleStats = ({ circleBestiesLength, overallHealth, loadingConnections }) => {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-6 space-y-3">
      {circleBestiesLength < 5 && (
        <div className="inline-flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-md border-2 border-purple-200">
          <span className="text-2xl">⭐</span>
          <div className="text-left">
            <div className="font-display text-base md:text-lg text-gradient font-bold leading-tight">
              {circleBestiesLength}/5 In Your Circle
            </div>
            {circleBestiesLength > 0 && !loadingConnections && (
              <div className="text-xs text-gray-600">
                {overallHealth >= 90 && "Unbreakable vibes 🔥"}
                {overallHealth >= 70 && overallHealth < 90 && "Super strong energy ⚡"}
                {overallHealth >= 50 && overallHealth < 70 && "Solid connections 💪"}
                {overallHealth >= 30 && overallHealth < 50 && "Building momentum 🔆"}
                {overallHealth < 30 && "Just getting started 🌱"}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="text-xs md:text-sm text-gray-600">
        {circleBestiesLength === 5
          ? "Your circle is complete! Keep nurturing these connections 💜"
          : circleBestiesLength === 0
          ? "Your 5 closest people - the ones you can call at 3am. Start building your circle ✨"
          : circleBestiesLength === 1
          ? "Amazing start! Add 4 more to complete your inner circle 🌟"
          : `${5 - circleBestiesLength} more to go! You're building something special 💫`}
      </div>

      {circleBestiesLength > 0 && !loadingConnections && (
        <button
          onClick={() => navigate('/circle-health')}
          className="mt-2 px-6 py-2 bg-gradient-primary text-white rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
        >
          <span>See Your Stats</span>
          <span className="text-base">✨</span>
        </button>
      )}
    </div>
  );
};

export default CircleStats;
