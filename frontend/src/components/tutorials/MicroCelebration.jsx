import React, { useEffect, useState } from 'react';
import haptic from '../../utils/hapticFeedback';

/**
 * MicroCelebration - Small celebration for step completions
 * World-class: Subtle, delightful, non-intrusive
 */
const MicroCelebration = ({ trigger, message, icon = '✨' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setVisible(true);
    haptic.light();

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-[10004] bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce-in text-sm font-semibold flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="text-lg">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

export default MicroCelebration;

