import React from 'react';

const ChallengeProgressCard = ({ challenge, currentUserId, onCancel }) => {

  // Get challenge template name (we'll need to load this)
  const challengeName = challenge.name || 'Challenge';
  const otherUserName = challenge.user1Id === currentUserId
    ? challenge.user2Name || 'Your bestie'
    : challenge.user1Name || 'Your bestie';

  const myProgress = challenge.user1Id === currentUserId
    ? challenge.user1Progress || 0
    : challenge.user2Progress || 0;
  const theirProgress = challenge.user1Id === currentUserId
    ? challenge.user2Progress || 0
    : challenge.user1Progress || 0;
  const target = challenge.target || 0;

  const myPercentage = target > 0 ? Math.min(100, (myProgress / target) * 100) : 0;
  const theirPercentage = target > 0 ? Math.min(100, (theirProgress / target) * 100) : 0;

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!challenge.expiresAt) return 'No time limit';
    const expiresAt = challenge.expiresAt.toDate();
    const now = new Date();
    const diffMs = expiresAt - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Less than 1 hour left';
  };

  return (
    <div className="card p-4 border-2 border-purple-200 dark:border-purple-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {challengeName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            with {otherUserName}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Your progress</span>
            <span>{myProgress}/{target}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${myPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{otherUserName}'s progress</span>
            <span>{theirProgress}/{target}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${theirPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Time Remaining */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Time left: {getTimeRemaining()}
        </p>
      </div>
    </div>
  );
};

export default ChallengeProgressCard;

