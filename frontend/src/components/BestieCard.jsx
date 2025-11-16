import React from 'react';

const BestieCard = ({ bestie }) => {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg flex-shrink-0">
          {bestie.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-primary truncate">
            {bestie.name}
          </div>
          <div className="text-sm text-text-secondary truncate">
            {bestie.phone}
          </div>
        </div>
      </div>

      {bestie.role && (
        <div className={`badge text-xs ${
          bestie.role === 'guardian' 
            ? 'badge-primary' 
            : 'badge-success'
        }`}>
          {bestie.role === 'guardian' ? '🛡️ Watching Over You' : '💜 You Watch Over'}
        </div>
      )}
    </div>
  );
};

export default BestieCard;
