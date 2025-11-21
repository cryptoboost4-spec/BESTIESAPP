import React, { useState, useEffect } from 'react';

/**
 * Animated Profile Picture with Coin Flip Effect
 * - Shows profile picture for 2 seconds
 * - Flips like a coin (3-4 revolutions)
 * - Shows logo on back side during flip
 * - Lands back on profile picture
 * - Repeats continuously
 */
const AnimatedProfilePicture = ({ photoURL, name, size = 'md' }) => {
  const [isFlipping, setIsFlipping] = useState(false);

  // Size mappings
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  useEffect(() => {
    // Wait 2 seconds, then trigger flip
    const flipInterval = setInterval(() => {
      setIsFlipping(true);

      // Flip takes 1.5 seconds, then wait 2 seconds before next flip
      setTimeout(() => {
        setIsFlipping(false);
      }, 1500);
    }, 3500); // 2 seconds wait + 1.5 seconds flip = 3.5 seconds total cycle

    return () => clearInterval(flipInterval);
  }, []);

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <div
        className={`${sizes[size]} rounded-full relative transition-transform duration-1500 ease-in-out ${
          isFlipping ? 'animate-coin-flip' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front side - Profile Picture */}
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full overflow-hidden border-2 border-primary shadow-md`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Back side - Logo */}
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full overflow-hidden border-2 border-primary shadow-md bg-gradient-primary flex items-center justify-center`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="text-white font-display text-xs font-bold">B</span>
        </div>
      </div>

      <style>{`
        @keyframes coin-flip {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(1440deg); /* 4 full rotations (360 * 4) */
          }
        }

        .animate-coin-flip {
          animation: coin-flip 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .duration-1500 {
          transition-duration: 1500ms;
        }
      `}</style>
    </div>
  );
};

export default AnimatedProfilePicture;
