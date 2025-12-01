import React, { useState, useEffect } from 'react';

/**
 * Minimal elegant loading skeleton with no content hints
 * Luxury branded animations only
 */

const LUXURY_MESSAGES = [
  "Preparing something beautiful... ✨",
  "Crafting your experience... 💎",
  "Almost ready, darling... 🌸",
  "Creating magic for you... 💫",
  "Just a moment, please... 🦋",
  "We're preparing perfection... 🌺",
  "Your moment is coming... 💕",
  "Elegance in progress... 🎀",
  "Refining every detail... ✨",
  "Almost there, beautiful... 💜"
];

const LoadingSkeleton = ({ type = 'list', count = 3, message }) => {
  const [currentMessage, setCurrentMessage] = useState(
    message || LUXURY_MESSAGES[Math.floor(Math.random() * LUXURY_MESSAGES.length)]
  );

  // Rotate message every 3 seconds
  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(LUXURY_MESSAGES[Math.floor(Math.random() * LUXURY_MESSAGES.length)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Abstract gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-fuchsia-50/50 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-fuchsia-900/10 animate-gradient-shift"></div>

      {/* Floating abstract particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              background: `linear-gradient(135deg, 
                rgba(236, 72, 153, ${0.1 + Math.random() * 0.2}), 
                rgba(168, 85, 247, ${0.1 + Math.random() * 0.2}))`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Elegant message */}
        <div className="mb-8">
          <p className="text-lg md:text-xl font-display bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-pulse-slow">
            {currentMessage}
          </p>
        </div>

        {/* Abstract loading animation */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-fuchsia-400 animate-bounce-elegant"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.2s'
              }}
            />
          ))}
        </div>

        {/* Elegant progress bar */}
        <div className="relative w-full max-w-xs mx-auto h-1 bg-gradient-to-r from-pink-100 via-purple-100 to-fuchsia-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-fuchsia-900/30 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 via-fuchsia-400 to-pink-400 animate-silk-flow bg-[length:200%_100%]"></div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translateY(-20px) translateX(10px) scale(1.1);
            opacity: 0.5;
          }
          66% {
            transform: translateY(-10px) translateX(-10px) scale(0.9);
            opacity: 0.4;
          }
        }

        @keyframes bounce-elegant {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-12px) scale(1.1);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes silk-flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }

        .animate-float-particle {
          animation: float-particle 10s ease-in-out infinite;
        }

        .animate-bounce-elegant {
          animation: bounce-elegant 1.2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-silk-flow {
          animation: silk-flow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
