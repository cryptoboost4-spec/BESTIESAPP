import React, { useState } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const BestieRequestCard = ({ request }) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const result = await apiService.acceptBestieRequest(request.id);
    setLoading(false);

    if (result.success) {
      toast.success(`You're now besties with ${request.requesterName}! 💜`);
    } else {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async () => {
    // TODO: Implement decline functionality
    toast('Decline feature coming soon');
  };

  return (
    <div className="card p-4 border-2 border-primary/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg">
          {request.requesterName[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-text-primary">
            {request.requesterName}
          </div>
          <div className="text-sm text-text-secondary">
            {request.requesterPhone}
          </div>
        </div>
      </div>

      {request.personalMessage && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-text-secondary italic">
          "{request.personalMessage}"
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex-1 btn btn-secondary text-sm"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 btn btn-primary text-sm"
        >
          {loading ? 'Accepting...' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

export default BestieRequestCard;
