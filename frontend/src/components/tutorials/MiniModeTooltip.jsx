import React from 'react';
import haptic from '../../utils/hapticFeedback';

/**
 * MiniModeTooltip - Compact tooltip for interactive tutorial steps
 * Appears in top-right corner when user is exploring features
 */
const MiniModeTooltip = ({
  message,
  progressDots,
  onContinue,
  onSkip
}) => {
  return (
    <div className="fixed top-4 right-4 z-[10003] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/95 dark:to-pink-900/95 rounded-xl shadow-2xl p-4 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-sm max-w-[280px] animate-slide-in-right">
      <div className="space-y-3">
        {/* Message */}
        <p className="text-sm font-semibold text-text-primary dark:text-gray-100">
          {message}
        </p>

        {/* Progress dots */}
        {progressDots && (
          <div className="flex gap-2 justify-center">
            {progressDots.map((dot, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  dot.filled
                    ? 'bg-purple-600 dark:bg-purple-400 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onSkip && (
            <button
              onClick={() => {
                haptic.light();
                onSkip();
              }}
              className="flex-1 btn btn-secondary text-xs py-2"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => {
              haptic.light();
              onContinue();
            }}
            className={`${onSkip ? 'flex-1' : 'w-full'} btn bg-gradient-primary text-white text-xs py-2 font-semibold`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniModeTooltip;

