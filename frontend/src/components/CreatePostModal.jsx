import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { logAnalyticsEvent } from '../services/firebase';
import toast from 'react-hot-toast';
import haptic from '../utils/hapticFeedback';
import { sanitizeUserInput } from '../utils/sanitize';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const { currentUser, userData } = useAuth();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !photo) {
      toast.error('Please add some text or a photo');
      return;
    }

    setUploading(true);
    haptic.light();

    try {
      let photoURL = null;

      // Upload photo if provided
      if (photo) {
        const photoRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${photo.name}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      // Sanitize user input to prevent XSS attacks
      const sanitizedText = sanitizeUserInput(text.trim(), 5000); // Max 5000 chars for posts

      // Create post in Firestore
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'Anonymous',
        userPhoto: userData?.photoURL || null,
        text: sanitizedText,
        photoURL: photoURL,
        createdAt: Timestamp.now(),
        // Denormalize bestieUserIds for efficient Firestore rules
        bestieUserIds: userData?.bestieUserIds || {},
        reactionCounts: {
          heart: 0,
          laugh: 0,
          fire: 0
        },
        commentCount: 0
      });

      // Track analytics
      logAnalyticsEvent('post_created', {
        has_photo: !!photoURL,
        has_text: !!text.trim(),
        text_length: text.trim().length
      });

      toast.success('Post created! 🎉');
      haptic.success();
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      haptic.error();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display text-gradient">
            ✍️ Create a Post
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-text-secondary mb-4">
          Share what's on your mind with your besties 💜
        </p>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening?"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none resize-none text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 mb-4"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {text.length}/500 characters
        </p>

        {/* Photo Upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Add a Photo (optional)
          </label>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600"
              />
              <button
                onClick={() => {
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload a photo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Max 5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || (!text.trim() && !photo)}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
