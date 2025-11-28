import React from 'react';

const EmptySlot = ({ index, circleBestiesLength, setShowShareModal }) => {
  const slotColors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
  ];

  const angle = (index * 72 - 90) * (Math.PI / 180);
  const radius = 45;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <button
        onClick={() => setShowShareModal(true)}
        className={`w-14 h-14 md:w-16 md:h-16 border-4 border-dashed ${slotColors[index].replace('bg-', 'border-')} rounded-full flex flex-col items-center justify-center ${slotColors[index].replace('bg-', 'text-')} font-bold hover:scale-110 hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl animate-pulse-slow relative group`}
        title="Add someone who has your back"
      >
        <span className="text-2xl">+</span>
        <span className="text-[8px] opacity-70 mt-0.5">Add</span>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl">
            {circleBestiesLength === 0 ? "Your first bestie ✨" : "Add another one 💜"}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-600"></div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default EmptySlot;
