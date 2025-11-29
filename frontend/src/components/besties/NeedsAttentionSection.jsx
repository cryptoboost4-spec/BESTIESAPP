import React, { useState } from 'react';

const NeedsAttentionSection = ({ missedCheckIns, requestsForAttention, besties }) => {
  const [dismissedItems, setDismissedItems] = useState(new Set());
  
  // Filter out dismissed items
  const visibleMissed = missedCheckIns.filter(m => !dismissedItems.has(`missed-${m.id}`));
  const visibleRequests = requestsForAttention.filter(r => !dismissedItems.has(`request-${r.userId}`));
  
  const hasAlerts = visibleMissed.length > 0 || visibleRequests.length > 0;

  const dismissItem = (type, id) => {
    setDismissedItems(prev => new Set([...prev, `${type}-${id}`]));
  };

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
      {visibleMissed.length > 0 && (
        <div className="space-y-3 mb-4">
          {visibleMissed.map((missed) => (
            <div key={missed.id} className="card p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 relative">
              {/* Dismiss X button */}
              <button
                onClick={() => dismissItem('missed', missed.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 flex items-center justify-center text-red-600 dark:text-red-300 text-sm font-bold transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 pr-6">
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
                  onClick={() => {
                    dismissItem('missed', missed.id);
                    window.location.href = `tel:${besties.find(b => b.userId === missed.userId)?.phone}`;
                  }}
                >
                  Call Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Attention - Speech Bubble Style */}
      {visibleRequests.length > 0 && (
        <div className="space-y-3">
          {visibleRequests.map((request) => (
            <div key={request.userId} className="flex items-start gap-3 relative">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {request.photoURL ? (
                  <img 
                    src={request.photoURL} 
                    alt={request.userName} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {request.userName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              
              {/* Speech Bubble */}
              <div className="flex-1 relative">
                {/* Dismiss X button */}
                <button
                  onClick={() => dismissItem('request', request.userId)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold transition-colors z-10"
                  title="Dismiss"
                >
                  ✕
                </button>
                
                <div className="relative bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/30 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                  {/* Triangle pointer */}
                  <div className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-purple-100 dark:border-r-purple-900/40"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-purple-900 dark:text-purple-200 text-sm">
                        {request.userName}
                      </span>
                      <span className="mx-2 text-purple-400">•</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {request.tag === 'needs to vent' ? '💭 needs to vent' : request.tag}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm btn-primary flex-shrink-0 ml-2"
                      onClick={() => {
                        dismissItem('request', request.userId);
                        const bestie = besties.find(b => b.userId === request.userId);
                        if (bestie?.phone) {
                          window.location.href = `sms:${bestie.phone}`;
                        }
                      }}
                    >
                      💜 Reach Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeedsAttentionSection;
