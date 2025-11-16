import React from 'react';

const QuickButtons = ({ onQuickCheckIn }) => {
  const quickOptions = [
    { emoji: '☕', label: 'Coffee Date', minutes: 30, color: 'from-amber-400 to-orange-500' },
    { emoji: '🍽️', label: 'Dinner', minutes: 60, color: 'from-rose-400 to-pink-500' },
    { emoji: '🎬', label: 'Movie', minutes: 120, color: 'from-purple-400 to-indigo-500' },
    { emoji: '🍻', label: 'Drinks', minutes: 90, color: 'from-blue-400 to-cyan-500' },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Quick Check-In</h2>
      <div className="grid grid-cols-2 gap-4">
        {quickOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => onQuickCheckIn(option.minutes)}
            className={`card p-6 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${option.color} text-white`}
          >
            <div className="text-4xl mb-2">{option.emoji}</div>
            <div className="font-display text-lg mb-1">{option.label}</div>
            <div className="text-sm opacity-90">{option.minutes} minutes</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickButtons;
