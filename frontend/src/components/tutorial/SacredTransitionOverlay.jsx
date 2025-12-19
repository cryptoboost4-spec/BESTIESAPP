import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * SacredTransitionOverlay
 * Handles "Moment 0" of the Bestie Circle Tutorial.
 * 
 * Visual Experience:
 * 1. Joy Explosion (Confetti) from button center
 * 2. World Softening (Blur/Dim)
 * 3. Upward Drift (Rising ambient particles)
 */
const SacredTransitionOverlay = ({ 
  isActive, 
  onComplete, 
  originRef 
}) => {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isActive) {
      // 1. Joy Explosion
      triggerJoyExplosion(originRef);

      // 2. Start rising particles after delay
      const timer = setTimeout(() => {
        setShowParticles(true);
      }, 1000);

      // 3. Complete transition
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 1800);

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive, onComplete, originRef]);

  const triggerJoyExplosion = (ref) => {
    // Default to center if no ref provided
    let originX = 0.5;
    let originY = 0.5;

    if (ref?.current) {
      const rect = ref.current.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    }

    // Colors: Hot pink, Plum purple, Light lavender, Rose pink
    const colors = ['#FF69B4', '#DDA0DD', '#E6E6FA', '#FFB7C5'];

    // Soft "Pop" explosion
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: originX, y: originY },
      colors: colors,
      gravity: 0.8,
      scalar: 1, // varied sizes handled by default somewhat, but we can customize shapes
      ticks: 200,
      shapes: ['circle', 'square'], // approximating "hearts" and "stars" with available shapes or need custom SVG
      disableForReducedMotion: true
    });
    
    // Add a second burst for depth
     setTimeout(() => {
       confetti({
        particleCount: 40,
        angle: 90,
        spread: 120,
        origin: { x: originX, y: originY },
        colors: colors,
        gravity: 0.6,
        startVelocity: 45,
        scalar: 0.8,
       });
     }, 150);
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ 
            opacity: 1, 
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0,0,0,0.3)' // Dimming effect
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
           {/* Upward Drift Particles */}
           {showParticles && (
             <div className="absolute inset-0 overflow-hidden">
               {[...Array(15)].map((_, i) => (
                 <RisingParticle key={i} index={i} />
               ))}
             </div>
           )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RisingParticle = ({ index }) => {
  // Randomize initial position and size
  const randomLeft = Math.random() * 100; // 0-100%
  const size = Math.random() * 40 + 20; // 20-60px
  const duration = Math.random() * 2 + 2; // 2-4s
  const delay = Math.random() * 0.5;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${randomLeft}%`,
        bottom: '-10%',
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(230,230,250,0.4) 50%, rgba(255,255,255,0) 100%)',
        filter: 'blur(4px)',
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ 
        y: -window.innerHeight * 0.8, // Rise up 80% of screen
        opacity: [0, 0.6, 0], // Fade in then out
        x: [0, Math.random() * 40 - 20, 0] // Gentle S-curve
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
};

export default SacredTransitionOverlay;
