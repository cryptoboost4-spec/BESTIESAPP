import React from 'react';

const ProgressToNextLevel = ({ healthScore, circleBestiesLength }) => {
  if (healthScore >= 90 || circleBestiesLength === 0) return null;

  const getLevelInfo = () => {
    if (healthScore < 30) {
      return {
        nextLevel: 'Growing 🔆',
        pointsToGo: 30 - healthScore,
        progress: (healthScore / 30) * 100,
        gradient: 'from-pink-400 to-orange-400',
        message: 'Keep building! Every interaction counts.',
      };
    } else if (healthScore < 50) {
      return {
        nextLevel: 'Strong 💪',
        pointsToGo: 50 - healthScore,
        progress: ((healthScore - 30) / 20) * 100,
        gradient: 'from-orange-400 to-purple-400',
        message: "You're doing great! Keep the momentum going.",
      };
    } else if (healthScore < 70) {
      return {
        nextLevel: 'Powerful ⚡',
        pointsToGo: 70 - healthScore,
        progress: ((healthScore - 50) / 20) * 100,
        gradient: 'from-purple-400 to-blue-400',
        message: "So close to powerful! You're crushing it.",
      };
    } else {
      return {
        nextLevel: 'Unbreakable 🔥',
        pointsToGo: 90 - healthScore,
        progress: ((healthScore - 70) / 20) * 100,
        gradient: 'from-blue-400 to-green-400',
        message: 'Almost there! Unbreakable status is within reach.',
      };
    }
  };

  const levelInfo = getLevelInfo();

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200">
      <h2 className="text-xl font-display text-gradient mb-4 flex items-center gap-2">
        Next Level
        <span className="text-2xl">🎯</span>
      </h2>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">{levelInfo.nextLevel}</span>
          <span className="text-sm text-gray-600">{levelInfo.pointsToGo} points to go</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-500`}
            style={{ width: `${levelInfo.progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{levelInfo.message}</p>
      </div>
    </div>
  );
};

export default ProgressToNextLevel;
