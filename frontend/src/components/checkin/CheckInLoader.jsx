import React, { useState } from 'react';

// Luxury girly skeleton loader for check-in creation
const CheckInLoader = () => {
  const messages = [
    "Wrapping you in safety... Your besties will watch over you 💖",
    "Building your protection... We've got your back, always ✨",
    "Setting up your safety circle... You're never alone with us 🌸",
    "Preparing your safety net... Because you deserve to feel secure 💕",
  ];

  // Pick one random message for this check-in
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 via-purple-50 to-indigo-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-indigo-900/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elegant floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-elegant"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.3,
            }}
          >
            <span className="text-2xl">
              {['✨', '💎', '🌸', '🦋', '💫', '🌺', '🏵️', '🎀'][Math.floor(Math.random() * 8)]}
            </span>
          </div>
        ))}
      </div>

      {/* Luxury content card */}
      <div className="w-full max-w-lg text-center relative z-10">
        <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 dark:border-gray-600/50">
        {/* Message */}
        <h2 className="font-display text-3xl text-gradient mb-4">
          Creating your check-in!
        </h2>

        <p className="text-xl text-text-secondary font-semibold mb-8 animate-fade-in">
          {message}
        </p>

        {/* Cute loading animation */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>

          {/* Elegant loading animation */}
          <div className="flex justify-center items-center gap-2 mb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-wave"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>

          {/* Silk ribbon progress bar */}
          <div className="relative w-full h-2 bg-gradient-to-r from-pink-100 via-purple-100 to-fuchsia-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-fuchsia-900/50 rounded-full overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 via-fuchsia-400 to-pink-400 animate-silk-shimmer bg-[length:300%_100%] opacity-80"></div>
            <div className="absolute inset-0 bg-white/30 dark:bg-white/10 animate-silk-shine"></div>
          </div>

          {/* Gentle reminder */}
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-6 italic">
            Taking care of you, always 💕
          </p>
        </div>
      </div>
    </div>

      <style>{`
        @keyframes float-elegant {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(10px) rotate(5deg);
            opacity: 0.6;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes silk-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes silk-shine {
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
        }
        @keyframes draw-check {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        .animate-float-elegant {
          animation: float-elegant 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
        .animate-silk-shimmer {
          animation: silk-shimmer 3s linear infinite;
        }
        .animate-silk-shine {
          animation: silk-shine 3s ease-in-out infinite;
        }
        .animate-draw-check {
          animation: draw-check 2s ease-in-out infinite;
          stroke-dasharray: 100;
        }
      `}</style>
    </>
  );
};

export default CheckInLoader;
