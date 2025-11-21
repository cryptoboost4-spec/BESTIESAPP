import React from 'react';
import usePullToRefresh from '../hooks/usePullToRefresh';

/**
 * Pull-to-refresh component with cute girly styling
 * Shows at top of page when pulling down
 */
const PullToRefresh = ({ onRefresh, children }) => {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(onRefresh);

  const getRefreshText = () => {
    if (isRefreshing) return '✨ Refreshing...';
    if (pullDistance > 80) return '💜 Release to refresh!';
    if (isPulling) return '👇 Keep pulling...';
    return '';
  };

  const rotation = Math.min((pullDistance / 120) * 360, 360);

  return (
    <>
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-40"
          style={{
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            background: 'linear-gradient(180deg, rgba(252,231,243,0.9) 0%, rgba(251,207,232,0) 100%)'
          }}
        >
          <div className="flex flex-col items-center">
            {isRefreshing ? (
              <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
            ) : (
              <div
                className="text-3xl transition-transform"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                💜
              </div>
            )}
            <p className="text-sm font-semibold text-pink-700 mt-2">
              {getRefreshText()}
            </p>
          </div>
        </div>
      )}

      {/* Page content */}
      {children}
    </>
  );
};

export default PullToRefresh;
