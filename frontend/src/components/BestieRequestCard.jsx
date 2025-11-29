import React, { useState } from 'react';
import apiService from '../services/api';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';

const BestieRequestCard = ({ request, onRequestHandled }) => {
  const [loading, setLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { executeOptimistic } = useOptimisticUpdate();

  // Use photo from request data instead of fetching from users collection
  const userPhoto = request?.requesterPhotoURL || null;

  const handleAccept = async () => {
    await executeOptimistic({
      optimisticUpdate: () => {
        // Hide card immediately
        setIsHidden(true);
        // Notify parent to remove from list
        if (onRequestHandled) {
          onRequestHandled(request.id);
        }
      },
      serverUpdate: async () => {
        setLoading(true);
        try {
          const result = await apiService.acceptBestieRequest(request.id);

          if (!result.success) {
            throw new Error('Failed to accept request');
          }

          // Track analytics
          const { logAnalyticsEvent } = require('../services/firebase');
          logAnalyticsEvent('bestie_request_accepted', {
            method: 'accept'
          });

          return result;
        } finally {
          setLoading(false);
        }
      },
      rollback: () => {
        // Show card again on error
        setIsHidden(false);
      },
      successMessage: `You're now besties with ${request.requesterName}! 💜`,
      errorMessage: 'Failed to accept request'
    });
  };

  const handleDecline = async () => {
    await executeOptimistic({
      optimisticUpdate: () => {
        // Hide card immediately
        setIsHidden(true);
        // Notify parent to remove from list
        if (onRequestHandled) {
          onRequestHandled(request.id);
        }
      },
      serverUpdate: async () => {
        setLoading(true);
        try {
          const result = await apiService.declineBestieRequest(request.id);

          if (!result.success) {
            throw new Error('Failed to decline request');
          }

          return result;
        } finally {
          setLoading(false);
        }
      },
      rollback: () => {
        // Show card again on error
        setIsHidden(false);
      },
      successMessage: 'Request declined',
      errorMessage: 'Failed to decline request'
    });
  };

  const getInitial = () => {
    if (request?.requesterName && typeof request.requesterName === 'string' && request.requesterName.length > 0) {
      return request.requesterName[0].toUpperCase();
    }
    return '?';
  };

  // Don't render if hidden optimistically
  if (isHidden) {
    return null;
  }

  return (
    <div className="card p-4 border-2 border-primary/20 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg overflow-hidden">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={request.requesterName || 'Bestie'}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitial()
          )}
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
