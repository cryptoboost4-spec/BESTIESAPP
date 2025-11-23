import React from 'react';
import { useNavigate } from 'react-router-dom';

const LevelUpTips = ({ tips }) => {
  const navigate = useNavigate();

  return (
    <div className="card p-6">
      <h2 className="text-xl font-display text-gradient mb-4">Level Up Your Circle 🚀</h2>

      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border-2 ${
              tip.priority === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                : tip.priority === 'high'
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
                : tip.priority === 'medium'
                ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{tip.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">{tip.title}</h3>
                <p className="text-sm text-gray-700 mb-2">{tip.description}</p>
                {tip.action && tip.link && (
                  <button
                    onClick={() => navigate(tip.link)}
                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {tip.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelUpTips;
