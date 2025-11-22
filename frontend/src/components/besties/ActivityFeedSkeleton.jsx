import React from 'react';

const ActivityFeedSkeleton = () => {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
        📰 Activity Feed
      </h2>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-3 md:p-4 animate-pulse">
            <div className="flex items-start gap-2 md:gap-3">
              {/* Icon skeleton */}
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>

              {/* Content skeleton */}
              <div className="flex-1 min-w-0">
                {/* Title line */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                {/* Subtitle line */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                {/* Optional third line */}
                {i % 2 === 0 && (
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                )}
              </div>

              {/* Badge skeleton */}
              <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
            </div>

            {/* Reactions skeleton */}
            {i % 3 !== 0 && (
              <div className="mt-3 flex gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeedSkeleton;
