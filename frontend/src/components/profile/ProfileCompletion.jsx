import React, { useState, useEffect } from 'react';

const ProfileCompletion = ({
  profileCompletion,
  animatedProgress,
  onTaskNavigation
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const getProgressColor = (percentage) => {
    // Gradient from red → orange → yellow → green → blue → purple → pink
    if (percentage === 0) return 'from-red-500 to-red-600';
    if (percentage < 15) return 'from-red-500 to-orange-500';
    if (percentage < 30) return 'from-orange-500 to-yellow-500';
    if (percentage < 45) return 'from-yellow-500 to-green-500';
    if (percentage < 60) return 'from-green-500 to-blue-500';
    if (percentage < 75) return 'from-blue-500 to-indigo-500';
    if (percentage < 90) return 'from-indigo-500 to-purple-500';
    if (percentage < 100) return 'from-purple-500 to-pink-500';
    return 'from-pink-500 to-purple-600';
  };

  // Split tasks into pages of 5
  const tasksPerPage = 5;
  const totalPages = Math.ceil(profileCompletion.tasks.length / tasksPerPage);
  const startIndex = currentPage * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentPageTasks = profileCompletion.tasks.slice(startIndex, endIndex);

  // Check if all tasks on current page are completed
  const currentPageCompleted = currentPageTasks.every(task => task.completed);

  // Auto-advance to next page when current page is completed
  useEffect(() => {
    if (currentPageCompleted && currentPage < totalPages - 1) {
      // Automatically advance to next page after a short delay
      const timer = setTimeout(() => {
        setCurrentPage(currentPage + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPageCompleted, currentPage, totalPages]);

  // Auto-navigate to first incomplete page when component mounts
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
      </div>

      {/* Animated Progress Bar with Color Gradient and Fizzing Effect */}
      <div className="w-full h-4 bg-white dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner relative">
        <div
          className={`h-full bg-gradient-to-r ${getProgressColor(profileCompletion.percentage)} transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${animatedProgress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer-effect"></div>

          {/* Enhanced sizzling/sparking effect at the end of the bar */}
          {animatedProgress < 100 && animatedProgress > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-12 fizz-effect">
              {/* Spark particles */}
              <div className="fizz-particle fizz-1"></div>
              <div className="fizz-particle fizz-2"></div>
              <div className="fizz-particle fizz-3"></div>
              <div className="fizz-particle fizz-4"></div>
              <div className="fizz-particle fizz-5"></div>
              <div className="fizz-particle fizz-6"></div>
              <div className="fizz-particle fizz-7"></div>
              {/* Sizzle lines */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 sizzle-line sizzle-1"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 sizzle-line sizzle-2"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 sizzle-line sizzle-3"></div>
            </div>
          )}
        </div>
        {/* Progress percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 drop-shadow-sm">
            {Math.round(profileCompletion.percentage)}%
          </span>
        </div>
      </div>

      {/* Task List */}
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

        /* Fizzing effect */
        .fizz-effect {
          position: relative;
          pointer-events: none;
        }

        .fizz-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: fizz 1.5s infinite;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }

        .fizz-1 {
          right: 20%;
          animation-delay: 0s;
        }

        .fizz-2 {
          right: 40%;
          animation-delay: 0.3s;
        }

        .fizz-3 {
          right: 60%;
          animation-delay: 0.6s;
        }

        .fizz-4 {
          right: 10%;
          animation-delay: 0.9s;
        }

        .fizz-5 {
          right: 50%;
          animation-delay: 1.2s;
        }

        .fizz-6 {
          right: 30%;
          animation-delay: 0.4s;
        }

        .fizz-7 {
          right: 70%;
          animation-delay: 0.8s;
        }

        @keyframes fizz {
          0% {
            bottom: 0;
            opacity: 0;
            transform: translateX(0) scale(0);
          }
          10% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
          100% {
            bottom: 150%;
            opacity: 0;
            transform: translateX(15px) scale(2.5);
          }
        }

        /* Sizzle lines effect */
        .sizzle-line {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          animation: sizzle 0.6s infinite;
          border-radius: 2px;
        }

        .sizzle-1 {
          animation-delay: 0s;
          transform: translateY(-50%) rotate(45deg);
        }

        .sizzle-2 {
          animation-delay: 0.2s;
          transform: translateY(-50%) rotate(-45deg);
        }

        .sizzle-3 {
          animation-delay: 0.4s;
          transform: translateY(-50%) rotate(90deg);
        }

        @keyframes sizzle {
          0%, 100% {
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileCompletion;
