import React from 'react';
import haptic from '../../utils/hapticFeedback';

const EmptyState = ({ besties, pendingRequests, onAddBestie }) => {
  // Only show empty state when there are no besties AND no pending requests
  if ((besties && besties.length > 0) || (pendingRequests && pendingRequests.length > 0)) {
    return null;
  }

  return (
    <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 animate-fade-in">
      {/* Animated emoji */}
      <div className="text-5xl md:text-6xl mb-4 animate-bounce-slow">💜</div>
      
      <h2 className="text-xl md:text-2xl font-display text-text-primary mb-3">
        No besties yet!
      </h2>
      
      <p className="text-sm md:text-base text-text-secondary mb-6 max-w-md mx-auto">
        Add friends who'll have your back when you need them. Your safety network starts here! ✨
      </p>

      {/* Benefits list */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 max-w-md mx-auto">
        <p className="text-xs font-semibold text-text-primary mb-2">Why add besties?</p>
        <ul className="text-xs text-text-secondary space-y-1 text-left">
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>They'll get notified if you miss a check-in</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>You can watch out for each other</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Build a stronger safety network together</span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => {
          haptic.medium();
          onAddBestie();
        }}
        className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Add your first bestie"
      >
        ➕ Add Your First Bestie
      </button>
    </div>
  );
};

export default EmptyState;
