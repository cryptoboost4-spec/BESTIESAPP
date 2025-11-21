import React from 'react';

const NeedsAttentionSection = ({ missedCheckIns, requestsForAttention, besties }) => {
  const hasAlerts = missedCheckIns.length > 0 || requestsForAttention.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg md:text-xl font-display text-red-600 mb-3 flex items-center gap-2">
        <span className="animate-ping inline-block w-3 h-3 bg-red-600 rounded-full"></span>
        ⚠️ NEEDS ATTENTION
      </h2>

      {/* Missed Check-ins */}
      {missedCheckIns.length > 0 && (
        <div className="space-y-3 mb-4">
          {missedCheckIns.map((missed) => (
            <div key={missed.id} className="card p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="text-3xl flex-shrink-0">🚨</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 text-sm md:text-base">
                    {missed.userName} missed a check-in
                  </h3>
                  <p className="text-xs md:text-sm text-red-700 dark:text-red-300 break-words">
                    {missed.checkInData.activity?.name || 'Check-in'} • {
                      new Date(missed.timestamp).toLocaleString()
                    }
                  </p>
                  {missed.checkInData.location?.address && (
                    <p className="text-xs md:text-sm text-red-600 dark:text-red-400 mt-1 break-words">
                      📍 {missed.checkInData.location.address}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto flex-shrink-0"
                  onClick={() => window.location.href = `tel:${besties.find(b => b.userId === missed.userId)?.phone}`}
                >
                  Call Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Attention - Simplified */}
      {requestsForAttention.length > 0 && (
        <div className="space-y-2">
          {requestsForAttention.map((request) => (
            <div key={request.userId} className="flex items-center gap-3 p-3 border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 rounded animate-slide-up">
              <div className="text-2xl">💜</div>
              <div className="flex-1">
                <span className="font-semibold text-purple-900 dark:text-purple-200 text-sm">
                  {request.userName} needs support
                </span>
                <span className="mx-2 text-purple-600 dark:text-purple-400">•</span>
                <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full font-semibold">
                  {request.tag}
                </span>
              </div>
              <button
                className="btn btn-sm btn-primary flex-shrink-0"
                onClick={() => {
                  const bestie = besties.find(b => b.userId === request.userId);
                  if (bestie?.phone) {
                    window.location.href = `sms:${bestie.phone}`;
                  }
                }}
              >
                Reach Out
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeedsAttentionSection;
