import React, { useState, useEffect } from 'react';

const ProfileCompletion = ({
  profileCompletion,
  animatedProgress,
  onTaskNavigation
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Split tasks into pages of 5
  const tasksPerPage = 5;
  const totalPages = Math.ceil(profileCompletion.tasks.length / tasksPerPage);
  const startIndex = currentPage * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentPageTasks = profileCompletion.tasks.slice(startIndex, endIndex);

  // Check if all tasks on current page are completed
  const currentPageCompleted = currentPageTasks.every(task => task.completed);
  const canGoNext = currentPageCompleted && currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  // Auto-advance to first incomplete page when component mounts
  useEffect(() => {
    // Find the first page that has incomplete tasks
    for (let page = 0; page < totalPages; page++) {
      const pageStart = page * tasksPerPage;
      const pageEnd = pageStart + tasksPerPage;
      const pageTasks = profileCompletion.tasks.slice(pageStart, pageEnd);
      const hasIncomplete = pageTasks.some(task => !task.completed);

      if (hasIncomplete) {
        setCurrentPage(page);
        break;
      }
    }
  }, [profileCompletion.tasks, totalPages]);

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

      {/* Page indicator */}
      {totalPages > 1 && (
        <div className="text-center mb-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Step {currentPage + 1} of {totalPages}
          </span>
          {!currentPageCompleted && currentPage > 0 && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Complete all tasks to unlock the next step
            </p>
          )}
        </div>
      )}

      {/* Task List with Navigation */}
      <div className="space-y-2 mb-4">
        {currentPageTasks.map((task, index) => (
          <div key={startIndex + index} className="flex items-center justify-between gap-2">
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-purple-200 dark:border-gray-600">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!canGoPrev}
            className={`btn btn-sm ${canGoPrev ? 'btn-secondary' : 'opacity-50 cursor-not-allowed'} text-xs px-4 py-2`}
          >
            ← Previous
          </button>

          {currentPageCompleted && currentPage === totalPages - 1 && (
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              🎉 All Done!
            </span>
          )}

          {!currentPageCompleted && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentPageTasks.filter(t => t.completed).length}/{currentPageTasks.length} complete
            </span>
          )}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!canGoNext}
            className={`btn btn-sm ${canGoNext ? 'btn-primary' : 'opacity-50 cursor-not-allowed'} text-xs px-4 py-2`}
          >
            Next →
          </button>
        </div>
      )}

      {!currentPageCompleted && currentPage < totalPages - 1 && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          ✨ Unlock the next step by completing all tasks above
        </p>
      )}

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
