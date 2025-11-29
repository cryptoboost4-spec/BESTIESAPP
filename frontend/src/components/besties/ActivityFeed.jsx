import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostReactions from './PostReactions';
import PostComments from './PostComments';

const ActivityFeed = ({
  activityFeed,
  reactions,
  addReaction,
  setSelectedCheckIn,
  setShowComments,
  getTimeAgo,
  initialPostId = null
}) => {
  const navigate = useNavigate();
  const [showPostComments, setShowPostComments] = useState(initialPostId); // Store post ID
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Open post comments if initialPostId is provided
  React.useEffect(() => {
    if (initialPostId && !showPostComments) {
      setShowPostComments(initialPostId);
    }
  }, [initialPostId]);

  // Calculate pagination
  const totalPages = Math.ceil(activityFeed.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFeed = activityFeed.slice(startIndex, startIndex + itemsPerPage);

  if (activityFeed.length === 0) {
    return (
      <div className="card p-6 md:p-8 text-center">
        <div className="text-3xl md:text-4xl mb-2">🌟</div>
        <p className="text-sm md:text-base text-text-secondary">No recent activity</p>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          Check-ins from your besties will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {paginatedFeed.map((activity) => (
          <div key={activity.id} className="card p-3 md:p-4">
            {activity.type === 'checkin' && (
              <div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="text-2xl md:text-3xl flex-shrink-0">
                    {activity.checkInData.activity?.emoji || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                      <button
                        onClick={() => navigate(`/user/${activity.userId}`)}
                        className="text-primary hover:underline font-semibold"
                      >
                        {activity.userName}
                      </button>
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

                {/* Reactions - Always show for non-alerted check-ins */}
                {activity.status !== 'alerted' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Reaction and comment counts - Always visible */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {['💜', '😮‍💨', '🎉'].map(emoji => {
                        const count = reactions[activity.id]?.filter(r => r.emoji === emoji).length || 0;
                        return (
                          <button
                            key={emoji}
                            onClick={() => addReaction(activity.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all hover:scale-105 ${
                              count > 0
                                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                            }`}
                          >
                            <span className="text-base">{emoji}</span>
                            {count > 0 && <span className="font-semibold">{count}</span>}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          setSelectedCheckIn(activity);
                          setShowComments(true);
                        }}
                        className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-full transition-all hover:scale-105 ${
                          activity.checkInData?.commentCount > 0
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className="text-base">💬</span>
                        <span className="font-semibold">{activity.checkInData?.commentCount || 0}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activity.type === 'badge' && (
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-2xl md:text-3xl flex-shrink-0">{activity.badge.icon || '🏆'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary text-sm md:text-base break-words">
                    <button
                      onClick={() => navigate(`/user/${activity.userId}`)}
                      className="text-primary hover:underline font-semibold"
                    >
                      {activity.userName}
                    </button>
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

            {activity.type === 'post' && (
              <div>
                {/* Support Request - Special styling */}
                {activity.postData.isSupportRequest ? (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-pink-300 dark:border-pink-600">
                    <div className="flex items-start gap-2 md:gap-3 mb-3">
                      {activity.postData.userPhoto ? (
                        <img
                          src={activity.postData.userPhoto}
                          alt={activity.userName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-pink-300 dark:ring-pink-600"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display flex-shrink-0 ring-2 ring-pink-300 dark:ring-pink-600">
                          {activity.userName?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-text-primary text-sm md:text-base">
                            {activity.userName}
                          </h3>
                          <span className="text-lg">💜</span>
                        </div>
                        <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide">
                          Requesting Support
                        </p>
                        <p className="text-xs md:text-sm text-text-secondary mt-1">
                          {getTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Support request content */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-base md:text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
                        {activity.postData.supportTag}
                      </p>
                      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                        Reach out if you can help! 💜
                      </p>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex gap-2">
                      <a
                        href={`sms:${activity.postData.userPhone || ''}`}
                        className="flex-1 btn btn-sm bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-2 flex items-center justify-center gap-2"
                      >
                        <span>💬</span>
                        <span>Send Message</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Regular post */
                  <>
                    <div className="flex items-start gap-2 md:gap-3 mb-3">
                      {activity.postData.userPhoto ? (
                        <img
                          src={activity.postData.userPhoto}
                          alt={activity.userName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display flex-shrink-0">
                          {activity.userName?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary text-sm md:text-base">
                          <button
                            onClick={() => navigate(`/user/${activity.userId}`)}
                            className="text-primary hover:underline font-semibold"
                          >
                            {activity.userName}
                          </button>
                        </h3>
                        <p className="text-xs md:text-sm text-text-secondary">
                          {getTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                      <div className="text-xl flex-shrink-0">✍️</div>
                    </div>

                    {/* Post Content */}
                    {activity.postData.text && (
                      <p className="text-sm md:text-base text-text-primary mb-3 whitespace-pre-wrap break-words">
                        {activity.postData.text}
                      </p>
                    )}

                    {/* Post Photo */}
                    {activity.postData.photoURL && (
                      <img
                        src={activity.postData.photoURL}
                        alt="Post"
                        className="w-full rounded-xl mb-2 max-h-96 object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Post Reactions and Comments - Side by Side */}
                    <div className="flex items-center justify-between mt-1">
                      <PostReactions
                        postId={activity.id}
                        initialCounts={activity.postData.reactionCounts}
                      />

                      {/* Comments Button on Right */}
                      <button
                        onClick={() => setShowPostComments(activity.id)}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                      >
                        <span>💬</span>
                        <span>
                          {activity.postData.commentCount > 0
                            ? `${activity.postData.commentCount} ${activity.postData.commentCount === 1 ? 'comment' : 'comments'}`
                            : 'Add a comment'
                          }
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Post Comments Modal */}
      {showPostComments && (
        <PostComments
          postId={showPostComments}
          onClose={() => setShowPostComments(null)}
        />
      )}
    </>
  );
};

export default ActivityFeed;
