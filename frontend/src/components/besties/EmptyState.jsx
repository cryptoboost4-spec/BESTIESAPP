import React from 'react';

const EmptyState = ({ besties, pendingRequests, onAddBestie }) => {
  // Only show empty state when there are no besties AND no pending requests
  if ((besties && besties.length > 0) || (pendingRequests && pendingRequests.length > 0)) {
    return null;
  }

  return (
    <div className="card p-8 md:p-12 text-center">
      <div className="text-5xl md:text-6xl mb-4">💜</div>
      <h2 className="text-xl md:text-2xl font-display text-text-primary mb-2">
        No besties yet!
      </h2>
      <p className="text-sm md:text-base text-text-secondary mb-6">
        Add friends who'll have your back when you need them
      </p>
      <button
        onClick={onAddBestie}
        className="btn btn-primary"
      >
        Add Your First Bestie
      </button>
    </div>
  );
};

export default EmptyState;
