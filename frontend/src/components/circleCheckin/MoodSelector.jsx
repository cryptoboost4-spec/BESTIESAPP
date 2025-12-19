import React from 'react';

const MOODS = [
  { emoji: '🌟', label: 'Amazing', value: 5 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Not great', value: 2 },
  { emoji: '😢', label: 'Struggling', value: 1 },
];

const MoodSelector = ({ onSelect }) => {
  return (
    <div className="flex gap-2 md:gap-3 justify-center">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onSelect(mood)}
          className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all active:scale-95"
        >
          <span className="text-3xl md:text-4xl">{mood.emoji}</span>
          <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;

