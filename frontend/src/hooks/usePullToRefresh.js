import { useEffect, useState } from 'react';

/**
 * Pull-to-refresh hook for mobile
 * Reloads app data when user pulls down
 */
const usePullToRefresh = (onRefresh) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      // Only start if scrolled to top
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (window.scrollY !== 0 || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, 120)); // Max 120px

        // Prevent default scrolling when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80) {
        // Trigger refresh
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        }
        setTimeout(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        }, 1000);
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance, isRefreshing]);

  return { isPulling, pullDistance, isRefreshing };
};

export default usePullToRefresh;
