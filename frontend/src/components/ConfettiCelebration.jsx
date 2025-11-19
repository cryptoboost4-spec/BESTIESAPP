import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const ConfettiCelebration = ({ trigger = false, type = 'default' }) => {
  useEffect(() => {
    if (!trigger) return;

    const fireConfetti = () => {
      if (type === 'badge') {
        // Badge celebration - stars and hearts
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          shapes: ['circle', 'square'],
          colors: ['#FF69B4', '#DDA0DD', '#FFB6C1', '#FFC0CB', '#FF1493']
        };

        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });

        fire(0.2, {
          spread: 60,
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      } else if (type === 'milestone') {
        // Milestone - explosion from center
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF69B4', '#DDA0DD', '#FFB6C1', '#87CEEB', '#98FB98']
        });

        // Second burst
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FF69B4', '#DDA0DD', '#FFB6C1']
          });
        }, 200);

        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#87CEEB', '#98FB98', '#FFB6C1']
          });
        }, 400);
      } else {
        // Default celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF69B4', '#DDA0DD', '#FFB6C1', '#FFC0CB', '#FF1493']
        });
      }
    };

    fireConfetti();
  }, [trigger, type]);

  return null; // This component doesn't render anything
};

export default ConfettiCelebration;
