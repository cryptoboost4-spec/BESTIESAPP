import React from 'react';

/**
 * ContextualError - For errors related to specific UI sections or actions
 * Displays within the context of the component (e.g., in a card, modal, section)
 */
const ContextualError = ({ 
  message, 
  title = 'Error',
  onRetry = null,
  className = '' 
}) => {
  if (!message) return null;

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-red-700 dark:text-red-400">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextualError;

