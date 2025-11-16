import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import CelebrationScreen from './CelebrationScreen';

const CheckInCard = ({ checkIn }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const alertTime = checkIn.alertTime.toDate();
      const now = new Date();
      const diff = alertTime - now;
      setTimeLeft(Math.max(0, diff));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [checkIn.alertTime]);

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
    const totalDuration = checkIn.duration * 60 * 1000;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const handleComplete = async () => {
    setLoading(true);
    const result = await apiService.completeCheckIn(checkIn.id);
    setLoading(false);

    if (result.success) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      toast.error('Failed to complete check-in');
    }
  };

  const handleExtend = async (minutes) => {
    setLoading(true);
    const result = await apiService.extendCheckIn(checkIn.id, minutes);
    setLoading(false);

    if (result.success) {
      toast.success(`Extended by ${minutes} minutes!`);
    } else {
      toast.error('Failed to extend check-in');
    }
  };

  const isAlerted = checkIn.status === 'alerted';

  if (showCelebration) {
    return <CelebrationScreen />;
  }

  return (
    <div className={`card p-6 ${isAlerted ? 'border-2 border-danger' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-text-primary">
              {checkIn.location}
            </h3>
            {isAlerted && (
              <span className="badge badge-warning text-xs">ALERTED</span>
            )}
          </div>
          {checkIn.notes && (
            <p className="text-sm text-text-secondary">{checkIn.notes}</p>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Time remaining:</span>
          <span className={`font-display text-xl ${timeLeft === 0 ? 'text-danger' : 'text-primary'}`}>
            {timeLeft === 0 ? 'EXPIRED' : formatTime(timeLeft)}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Besties */}
      <div className="mb-4">
        <div className="text-sm text-text-secondary mb-2">
          Watching over you: {checkIn.bestieIds?.length || 0} besties
        </div>
      </div>

      {/* Actions */}
      {!isAlerted && (
        <div className="space-y-3">
          {/* I'm Safe Button */}
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full btn btn-success text-lg"
          >
            ✅ I'm Safe!
          </button>

          {/* Extend Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExtend(15)}
              disabled={loading}
              className="btn btn-secondary text-sm"
            >
              +15m
            </button>
            <button
              onClick={() => handleExtend(30)}
              disabled={loading}
              className="btn btn-secondary text-sm"
            >
              +30m
            </button>
            <button
              onClick={() => handleExtend(60)}
              disabled={loading}
              className="btn btn-secondary text-sm"
            >
              +1h
            </button>
          </div>
        </div>
      )}

      {isAlerted && (
        <div className="bg-danger/10 border border-danger rounded-xl p-4 text-center">
          <p className="font-semibold text-danger mb-2">
            🚨 Your besties have been alerted!
          </p>
          <p className="text-sm text-text-secondary mb-4">
            They know you haven't checked in
          </p>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="btn btn-success w-full"
          >
            ✅ I'm Safe! (False Alarm)
          </button>
        </div>
      )}

      {/* Created Time */}
      <div className="mt-4 text-xs text-text-secondary text-center">
        Started {formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true })}
      </div>
    </div>
  );
};

export default CheckInCard;
