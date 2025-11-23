import React, { useState } from 'react';

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const CommentsModal = ({
  selectedCheckIn,
  comments,
  newComment,
  setNewComment,
  onAddComment,
  onClose
}) => {
  if (!selectedCheckIn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl max-w-md w-full max-h-[80vh] md:max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-display text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text">
              💬 Comments
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedCheckIn.userName}'s check-in
          </p>
        </div>

        {/* Comments List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 overscroll-contain">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                No comments yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Be the first to comment!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {comment.userPhoto ? (
                    <img
                      src={comment.userPhoto}
                      alt={comment.userName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-600"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-display ring-2 ring-purple-100 dark:ring-purple-600">
                      {comment.userName?.[0] || '?'}
                    </div>
                  )}
                </div>
                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl px-4 py-2 shadow-sm">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-200">
                      {comment.userName}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-3">
                    {comment.timestamp?.toDate ? getTimeAgo(comment.timestamp.toDate()) : 'Just now'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input - Fixed at bottom with safe area */}
        <div className="p-4 md:p-6 border-t-2 border-purple-100 dark:border-purple-600 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddComment();
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-3 rounded-full border-2 border-purple-200 dark:border-purple-600 focus:border-purple-400 dark:focus:border-purple-400 focus:outline-none text-sm shadow-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            <button
              onClick={onAddComment}
              disabled={!newComment.trim()}
              className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
