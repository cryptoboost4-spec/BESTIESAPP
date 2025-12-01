import React, { useState, useEffect } from 'react';

/**
 * SubtleNotification - For non-critical errors that don't need immediate attention
 * Appears as a small, dismissible notification that doesn't block the UI
 */
const SubtleNotification = ({ 
  message, 
  type = 'error', // 'error' | 'warning' | 'info'
  duration = 5000,
  onDismiss = null,
  className = '' 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!visible || !message) return null;

  const typeStyles = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  };

  const icons = {
    error: '⚠️',
    warning: 'ℹ️',
    info: '💡',
  };

  return (
    <div className={`fixed bottom-20 right-4 z-40 max-w-sm ${typeStyles[type]} border rounded-lg p-3 shadow-lg transition-all ${className}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0">{icons[type]}</span>
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            if (onDismiss) onDismiss();
          }}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
    </div>
  );
};

export default SubtleNotification;

