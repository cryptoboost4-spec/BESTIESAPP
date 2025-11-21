import React, { useState, useEffect } from 'react';

/**
 * Shows cute banner when user goes offline
 * Automatically hides when back online
 */
const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep banner visible for 2 seconds to show "You're back!" message
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-semibold shadow-lg transform transition-all duration-300 ${
        isOnline
          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white translate-y-0'
          : 'bg-gradient-to-r from-orange-400 to-red-500 text-white translate-y-0'
      }`}
      style={{
        animation: 'slide-down 0.3s ease-out'
      }}
    >
      {isOnline ? (
        <span>✨ You're back online! 💜</span>
      ) : (
        <span>📵 You're offline - Some features won't work</span>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineBanner;
