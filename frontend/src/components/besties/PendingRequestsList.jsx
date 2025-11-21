import React from 'react';
import BestieRequestCard from '../BestieRequestCard';

const PendingRequestsList = ({ pendingRequests }) => {
  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
        🔔 Pending Requests ({pendingRequests.length})
      </h2>
      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <BestieRequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
};

export default PendingRequestsList;
