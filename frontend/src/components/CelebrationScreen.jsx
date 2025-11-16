import React from 'react';

const CelebrationScreen = () => {
  return (
    <div className="card p-8 bg-gradient-primary text-white text-center overflow-hidden relative">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {['🎉', '✨', '💜', '🎊', '⭐'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-6xl mb-4 animate-bounce">
          ✅
        </div>
        <h2 className="font-display text-3xl mb-2">
          You're Safe!
        </h2>
        <p className="text-lg opacity-90 mb-4">
          Your besties have been notified 💜
        </p>
        <div className="text-sm opacity-75">
          Check-in completed successfully
        </div>
      </div>
    </div>
  );
};

export default CelebrationScreen;
