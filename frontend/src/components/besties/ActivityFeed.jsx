import React from 'react';

const ActivityFeed = ({
  activityFeed,
  reactions,
  addReaction,
  setSelectedCheckIn,
  setShowComments,
  getTimeAgo
}) => {
  if (activityFeed.length === 0) {
    return (
      <div>
        <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
          📰 Activity Feed
        </h2>
        <div className="card p-6 md:p-8 text-center">
          <div className="text-3xl md:text-4xl mb-2">🌟</div>
          <p className="text-sm md:text-base text-text-secondary">No recent activity</p>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Check-ins from your besties will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-display text-text-primary mb-3">
        📰 Activity Feed
      </h2>

      <div className="space-y-3">
        {activityFeed.slice(0, 15).map((activity) => (
          <div key={activity.id} className="card p-3 md:p-4">
            {activity.type === 'checkin' && (
              <div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="text-2xl md:text-3xl flex-shrink-0">
                    {activity.checkInData.activity?.emoji || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                      <span className="text-primary">{activity.userName}</span>
                      {activity.status === 'completed' && ' completed check-in safely ✅'}
                      {activity.status === 'active' && ' is currently checked in 🔔'}
                      {activity.status === 'alerted' && ' MISSED check-in 🚨'}
                    </h3>
                    <p className="text-xs md:text-sm text-text-secondary">
                      {activity.checkInData.activity?.name || 'Check-in'} • {
                        getTimeAgo(activity.timestamp)
                      }
                    </p>
                    {activity.checkInData.location?.address && (
                      <p className="text-xs md:text-sm text-text-secondary mt-1 break-words">
                        📍 {activity.checkInData.location.address}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                    activity.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : activity.status === 'alerted'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {activity.status === 'completed' && '✓'}
                    {activity.status === 'alerted' && '⚠️'}
                    {activity.status === 'active' && '🔔'}
                  </div>
                </div>

                {/* Reactions */}
                {activity.status !== 'alerted' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <button
                        onClick={() => addReaction(activity.id, '💜')}
                        className="text-xl md:text-2xl hover:scale-110 transition-transform"
                        title="Proud"
                      >
                        💜
                      </button>
                      <button
                        onClick={() => addReaction(activity.id, '😮‍💨')}
                        className="text-xl md:text-2xl hover:scale-110 transition-transform"
                        title="Relieved"
                      >
                        😮‍💨
                      </button>
                      <button
                        onClick={() => addReaction(activity.id, '🎉')}
                        className="text-xl md:text-2xl hover:scale-110 transition-transform"
                        title="Celebrate"
                      >
                        🎉
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCheckIn(activity);
                          setShowComments(true);
                        }}
                        className="ml-auto text-xs md:text-sm text-primary hover:underline font-semibold"
                      >
                        💬 Comment
                      </button>
                    </div>
                    {/* Show reaction counts */}
                    {reactions[activity.id] && reactions[activity.id].length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {Object.entries(
                          reactions[activity.id].reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <span key={emoji} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activity.type === 'badge' && (
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-2xl md:text-3xl flex-shrink-0">{activity.badge.icon || '🏆'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                    <span className="text-primary">{activity.userName}</span>
                    {' earned the '}<span className="text-yellow-600">{activity.badge.name}</span> badge! 🎉
                  </h3>
                  <p className="text-xs md:text-sm text-text-secondary">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                  {activity.badge.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {activity.badge.description}
                    </p>
                  )}
                </div>
                <div className="text-3xl flex-shrink-0 animate-bounce-gentle">
                  🎉
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
