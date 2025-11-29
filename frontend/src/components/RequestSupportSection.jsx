import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { sanitizeUserInput } from '../utils/sanitize';

const RequestSupportSection = () => {
  const { currentUser, userData } = useAuth();
  const [showRequestAttention, setShowRequestAttention] = useState(false);
  const [attentionTag, setAttentionTag] = useState('');

  return (
    <>
      {/* Request Attention Section */}
      {userData?.requestAttention?.active ? (
        <div className="card p-4 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💜</div>
            <div className="flex-1">
              <h3 className="text-lg font-display text-purple-900 dark:text-purple-100 mb-2">
                You're requesting attention
              </h3>
              <div className="inline-block px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded-full text-sm font-semibold mb-2">
                {userData.requestAttention.tag}
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                Your besties can see this on your profile 💜
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'users', currentUser.uid), {
                    'requestAttention.active': false,
                  });
                  toast.success('Request removed');
                } catch (error) {
                  console.error('Error canceling request:', error);
                  toast.error('Failed to cancel request');
                }
              }}
              className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-semibold text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-700 shadow-lg">
          {/* Header with sparkle emoji */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">💜</div>
            <h3 className="text-xl md:text-2xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Need a Little Support?
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We all have those days. Let your besties know you could use some extra love right now 💕
            </p>

            {/* What happens section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-600">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
                What happens when you request support:
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">📢</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your besties will see your request on their activity feed
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">🔔</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    They'll get an in-app notification so they see it right away
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">💌</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    It appears on your profile so anyone can reach out
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.light();
              setShowRequestAttention(true);
            }}
            className="btn bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full shadow-lg font-semibold text-base py-3"
          >
            💜 Request Support
          </button>
        </div>
      )}

      {/* Request Attention Modal */}
      {showRequestAttention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-display text-text-primary mb-4">
              💜 Request Support
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Let your besties know you could use some support. They'll see this on their activity feed and get a notification to reach out to you.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                How can your besties help?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAttentionTag('Needs to vent 💬')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs to vent 💬'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs to vent</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Needs a shoulder 🫂')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs a shoulder 🫂'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🫂</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs a shoulder</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Could use support 💜')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Could use support 💜'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💜</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Could use support</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Having a rough day 😔')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Having a rough day 😔'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">😔</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rough day</div>
                </button>
                <button
                  onClick={() => setAttentionTag("Let's do something 🎉")}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === "Let's do something 🎉"
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Let's hang out</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Want to chat 📱')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Want to chat 📱'
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Want to chat</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestAttention(false);
                  setAttentionTag('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!attentionTag) {
                    toast.error('Please select an option');
                    return;
                  }

                  try {
                    // Update user's requestAttention status
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      requestAttention: {
                        active: true,
                        tag: attentionTag,
                        timestamp: Timestamp.now(),
                      }
                    });

                    // Create a post in the activity feed for this support request
                    const sanitizedText = sanitizeUserInput(`${attentionTag}\n\nReach out if you can help! 💜`, 5000);
                    
                    await addDoc(collection(db, 'posts'), {
                      userId: currentUser.uid,
                      userName: userData?.displayName || 'A Bestie',
                      userPhoto: userData?.photoURL || null,
                      text: sanitizedText,
                      photoURL: null,
                      createdAt: Timestamp.now(),
                      isSupportRequest: true,
                      supportTag: attentionTag,
                      // Denormalize bestieUserIds for efficient Firestore rules
                      bestieUserIds: userData?.bestieUserIds || {},
                    });

                    // Notifications will be created automatically by Cloud Function
                    // when requestAttention field is updated (onUserRequestAttention trigger)
                    // No need to manually create notifications here

                    toast.success('Your besties have been notified 💜');
                    setShowRequestAttention(false);
                    setAttentionTag('');
                  } catch (error) {
                    console.error('Error requesting attention:', error);
                    toast.error('Failed to send request');
                  }
                }}
                className="flex-1 btn btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestSupportSection;
