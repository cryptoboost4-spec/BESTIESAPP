import React from 'react';

const CheckInTimer = ({
  timeLeft,
  duration,
  isAlerted,
  onExtend,
  extendingButton
}) => {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = () => {
    const totalDuration = duration * 60 * 1000;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-semibold text-text-secondary">Time remaining:</span>
        <span className={`font-display text-3xl ${timeLeft === 0 ? 'text-danger' : 'text-primary'}`}>
          {timeLeft === 0 ? 'EXPIRED' : formatTime(timeLeft)}
        </span>
      </div>
      <div className="progress-bar h-3">
        <div
          className="progress-fill"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Extend Buttons - Right under timer */}
      {!isAlerted && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            onClick={() => onExtend(15)}
            disabled={extendingButton !== null}
            className="btn btn-secondary text-sm py-2 active:scale-95"
          >
            +15m
          </button>
          <button
            onClick={() => onExtend(30)}
            disabled={extendingButton !== null}
            className="btn btn-secondary text-sm py-2 active:scale-95"
          >
            +30m
          </button>
          <button
            onClick={() => onExtend(60)}
            disabled={extendingButton !== null}
            className="btn btn-secondary text-sm py-2 active:scale-95"
          >
            +60m
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInTimer;
