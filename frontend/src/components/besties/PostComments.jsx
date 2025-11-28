import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

const PostComments = ({ postId, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Real-time listener for comments
  useEffect(() => {
    const commentsRef = collection(db, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading comments:', error);
      setLoading(false);
      toast.error('Failed to load comments');
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (submitting) return;

    setSubmitting(true);
    haptic.light();

    try {
      const commentsRef = collection(db, `posts/${postId}/comments`);
      const postRef = doc(db, 'posts', postId);

      // Add comment
      await addDoc(commentsRef, {
        userId: currentUser.uid,
        userName: userData?.displayName || 'Anonymous',
        userPhoto: userData?.photoURL || null,
        text: newComment.trim(),
        createdAt: Timestamp.now()
      });

      // Increment comment count
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      setNewComment('');
      toast.success('Comment added!');
      haptic.success();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-end md:items-center justify-center pb-28 md:pb-0" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 max-w-md w-full max-h-[55vh] md:max-h-[600px] rounded-t-2xl md:rounded-2xl flex flex-col mb-4 md:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
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
        </div>

        {/* Comments List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : comments.length === 0 ? (
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
                    {getTimeAgo(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input - Fixed at bottom with safe area */}
        <form onSubmit={handleSubmitComment} className="p-4 md:p-6 border-t-2 border-purple-100 dark:border-purple-600 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-3 rounded-full border-2 border-purple-200 dark:border-purple-600 focus:border-purple-400 dark:focus:border-purple-400 focus:outline-none text-sm shadow-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostComments;
