import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, increment, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import haptic from '../../utils/hapticFeedback';
import toast from 'react-hot-toast';

const PostReactions = ({ postId, initialCounts }) => {
  const { currentUser, userData } = useAuth();
  const [reactions, setReactions] = useState(initialCounts || { heart: 0, laugh: 0, fire: 0 });
  const [myReaction, setMyReaction] = useState(null);
  const [loading, setLoading] = useState(false);

  const reactionTypes = [
    { type: 'heart', emoji: '💜', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'fire', emoji: '🔥', label: 'Fire' }
  ];

  // Load user's existing reaction
  useEffect(() => {
    const loadMyReaction = async () => {
      try {
        const reactionsRef = collection(db, `posts/${postId}/reactions`);
        const q = query(reactionsRef, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setMyReaction(snapshot.docs[0].data().type);
        }
      } catch (error) {
        console.error('Error loading user reaction:', error);
      }
    };

    if (currentUser && postId) {
      loadMyReaction();
    }
  }, [currentUser, postId]);

  // Real-time listener for reaction counts
  useEffect(() => {
    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setReactions(docSnap.data().reactionCounts || { heart: 0, laugh: 0, fire: 0 });
      }
    });

    return () => unsubscribe();
  }, [postId]);

  const handleReaction = async (type) => {
    if (loading) return;

    setLoading(true);
    haptic.light();

    // Optimistic update
    const previousReactions = { ...reactions };
    const previousMyReaction = myReaction;

    try {
      const reactionsRef = collection(db, `posts/${postId}/reactions`);
      const postRef = doc(db, 'posts', postId);

      if (myReaction === type) {
        // Optimistically remove reaction
        setReactions(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
        setMyReaction(null);

        // Remove reaction from database
        const q = query(reactionsRef, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          await deleteDoc(snapshot.docs[0].ref);
          await updateDoc(postRef, {
            [`reactionCounts.${type}`]: increment(-1)
          });
        }
      } else {
        // Optimistically update reaction
        const newReactions = { ...reactions };
        if (myReaction) {
          newReactions[myReaction] = Math.max(0, newReactions[myReaction] - 1);
        }
        newReactions[type] = (newReactions[type] || 0) + 1;
        setReactions(newReactions);
        setMyReaction(type);

        // Update database
        if (myReaction) {
          // Remove old reaction
          const q = query(reactionsRef, where('userId', '==', currentUser.uid));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
            await updateDoc(postRef, {
              [`reactionCounts.${myReaction}`]: increment(-1)
            });
          }
        }

        // Add new reaction
        await addDoc(reactionsRef, {
          userId: currentUser.uid,
          userName: userData?.displayName || 'Anonymous',
          type: type,
          createdAt: Timestamp.now()
        });

        await updateDoc(postRef, {
          [`reactionCounts.${type}`]: increment(1)
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
      // Rollback optimistic update
      setReactions(previousReactions);
      setMyReaction(previousMyReaction);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      {reactionTypes.map((reaction) => {
        const isActive = myReaction === reaction.type;
        const count = reactions[reaction.type] || 0;

        return (
          <button
            key={reaction.type}
            onClick={() => handleReaction(reaction.type)}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
              isActive
                ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500 scale-110'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
            title={reaction.label}
          >
            <span className="text-lg">{reaction.emoji}</span>
            {count > 0 && (
              <span className={`font-semibold ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PostReactions;
