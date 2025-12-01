import React from 'react';

const ActivityFeedSkeleton = () => {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-display text-text-primary mb-6">
        📰 Activity Feed
      </h2>

      {/* Minimal elegant loading animation */}
      <div className="flex items-center justify-center py-12 relative overflow-hidden">
        {/* Abstract gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-fuchsia-50/30 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-fuchsia-900/10 rounded-xl"></div>

        {/* Floating abstract particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float-gentle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${15 + Math.random() * 25}px`,
                height: `${15 + Math.random() * 25}px`,
                background: `linear-gradient(135deg, 
                  rgba(236, 72, 153, ${0.15 + Math.random() * 0.15}), 
                  rgba(168, 85, 247, ${0.15 + Math.random() * 0.15}))`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${6 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Central loading animation */}
        <div className="relative z-10 text-center">
          <p className="text-sm font-display bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent mb-4">
            Loading activity...
          </p>
          <div className="flex justify-center items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-fuchsia-400 animate-bounce-subtle"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-15px) translateX(8px) scale(1.05);
            opacity: 0.4;
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-8px) scale(1.1);
            opacity: 1;
          }
        }

        .animate-float-gentle {
          animation: float-gentle 8s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ActivityFeedSkeleton;
