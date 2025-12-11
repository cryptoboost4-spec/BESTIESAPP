import React from 'react';

/**
 * InlineError - For form validation errors and inline field errors
 * Displays directly below or next to the input/field
 * Enhanced with smooth animation and better visual feedback
 */
const InlineError = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div 
      className={`text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1.5 animate-slide-down ${className}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xs flex-shrink-0">⚠️</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default InlineError;

