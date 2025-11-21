import React from 'react';

const ProfileCompletion = ({
  profileCompletion,
  animatedProgress,
  onTaskNavigation
}) => {
  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Hide when 100% complete
  if (profileCompletion.percentage >= 100) {
    return null;
  }

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-100 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-display text-gradient">Profile Completion ✨</h2>
        <span className="text-2xl font-bold text-gradient">
          {profileCompletion.completed}/{profileCompletion.total}
        </span>
      </div>

      {/* Animated Progress Bar with Shimmer Effect */}
      <div className="w-full h-4 bg-white dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner relative">
        <div
          className={`h-full ${getProgressColor(profileCompletion.percentage)} transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${animatedProgress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer-effect"></div>
        </div>
        {/* Progress percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 drop-shadow-sm">
            {Math.round(profileCompletion.percentage)}%
          </span>
        </div>
      </div>

      {/* Task List with Navigation */}
      <div className="space-y-2">
        {profileCompletion.tasks.map((task, index) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">
                {task.completed ? '✅' : '⭕'}
              </span>
              <span className={`text-sm ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300 font-semibold'}`}>
                {task.name}
              </span>
            </div>
            {!task.completed && (task.path || task.action) && (
              <button
                onClick={() => onTaskNavigation(task)}
                className="btn btn-sm btn-primary text-xs px-3 py-1"
              >
                Go →
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfileCompletion;
