import React from 'react';
import { useNavigate } from 'react-router-dom';

const BestieCard = ({ bestie }) => {
  const navigate = useNavigate();

  // Safety check: return null if bestie is undefined/null
  if (!bestie) {
    return null;
  }

  const handleClick = () => {
    if (bestie.userId) {
      navigate(`/user/${bestie.userId}`);
    }
  };

  // Get first character safely
  const getInitial = () => {
    if (bestie.name && typeof bestie.name === 'string' && bestie.name.length > 0) {
      return bestie.name[0].toUpperCase();
    }
    if (bestie.phone && typeof bestie.phone === 'string' && bestie.phone.length > 0) {
      return bestie.phone[0];
    }
    return '?';
  };

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-lg transition-all"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg flex-shrink-0">
          {getInitial()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-primary truncate">
            {bestie.name || bestie.phone || 'Unknown'}
          </div>
          <div className="text-sm text-text-secondary truncate">
            {bestie.phone || 'No phone'}
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
