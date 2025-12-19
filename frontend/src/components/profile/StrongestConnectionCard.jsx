import React from 'react';
import { useNavigate } from 'react-router-dom';

const StrongestConnectionCard = ({ bestie, score }) => {
  const navigate = useNavigate();

  if (!bestie || !score) {
    return null;
  }

  const getConnectionLevel = (score) => {
    if (score >= 90) return { label: 'Incredible', emoji: '🔥', color: 'from-green-600 to-emerald-600' };
    if (score >= 70) return { label: 'Strong', emoji: '💪', color: 'from-blue-600 to-cyan-600' };
    if (score >= 50) return { label: 'Good', emoji: '👍', color: 'from-purple-600 to-pink-600' };
    if (score >= 30) return { label: 'Developing', emoji: '🌱', color: 'from-yellow-600 to-orange-600' };
    return { label: 'Weak', emoji: '💤', color: 'from-gray-400 to-gray-600' };
  };

  const level = getConnectionLevel(score);

  return (
    <div
      onClick={() => navigate(`/user/${bestie.bestieId}`)}
      className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-2 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="absolute top-0 right-0 text-6xl opacity-10">💜</div>
      <div className="relative z-10">
        <h3 className="text-lg font-display text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>💪</span>
          <span>Strongest Connection</span>
        </h3>
        
        <div className="flex items-center gap-4 mb-4">
          {bestie.photoURL ? (
            <img
              src={bestie.photoURL}
              alt={bestie.bestieName}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-300 dark:border-purple-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-xl border-2 border-purple-300 dark:border-purple-600">
              {bestie.bestieName?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              {bestie.bestieName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-display bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                {score}/100
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {level.emoji} {level.label}
              </span>
            </div>
          </div>
        </div>

        <button className="w-full btn btn-sm btn-secondary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </button>
      </div>
    </div>
  );
};

export default StrongestConnectionCard;

