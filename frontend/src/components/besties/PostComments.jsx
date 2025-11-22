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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-display text-gradient">💬 Comments</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">💬</p>
              <p>No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* User Photo */}
                {comment.userPhoto ? (
                  <img
                    src={comment.userPhoto}
                    alt={comment.userName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display flex-shrink-0">
                    {comment.userName?.[0] || '?'}
                  </div>
                )}

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.userName}</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{comment.text}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                    {getTimeAgo(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="btn btn-primary px-6 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
