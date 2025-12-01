import React from 'react';

/**
 * InlineError - For form validation errors and inline field errors
 * Displays directly below or next to the input/field
 */
const InlineError = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 ${className}`}>
      <span className="text-xs">⚠️</span>
      <span>{message}</span>
    </div>
  );
};

export default InlineError;

