import React, { useEffect, useState } from 'react';
import haptic from '../../utils/hapticFeedback';
import ConfettiCelebration from '../ConfettiCelebration';

/**
 * CelebrationToast - Shows celebration message when tutorial completes
 * World-class: Confetti, smooth animations, delightful details
 */
const CelebrationToast = ({
  message,
  icon = '🎉',
  duration = 4000,
  onComplete,
  showConfetti = true
}) => {
  const [visible, setVisible] = useState(true);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => {
    // Haptic feedback sequence for delight
    haptic.success();
    setTimeout(() => haptic.light(), 100);
    
    // Trigger confetti immediately
    if (showConfetti) {
      setConfettiTrigger(true);
    }
    
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete, showConfetti]);

  if (!visible) return null;

  return (
    <>
      {showConfetti && <ConfettiCelebration trigger={confettiTrigger} type="default" />}
      <div
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[10005] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-8 py-5 rounded-2xl shadow-2xl animate-bounce-in border-2 border-white/20 backdrop-blur-sm"
        role="alert"
        aria-live="polite"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite, bounce-in 0.5s ease-out'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce-gentle">{icon}</span>
          <p className="font-bold text-lg drop-shadow-lg">{message}</p>
        </div>
        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      </div>
    </>
  );
};

export default CelebrationToast;

