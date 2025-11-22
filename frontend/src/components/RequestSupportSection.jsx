import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import haptic from '../utils/hapticFeedback';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import ProfileWithBubble from './ProfileWithBubble';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';

const RequestSupportSection = () => {
  const { currentUser, userData } = useAuth();
  const [showRequestAttention, setShowRequestAttention] = useState(false);
  const [attentionTag, setAttentionTag] = useState('');

  // Scrolling bubble example messages
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const exampleMessages = [
    '💬 Needs to vent',
    '🫂 Need a shoulder',
    '💜 Could use support',
    '😔 Having a rough day',
    "🎉 Let's do something",
    '📱 Want to chat'
  ];

  // Rotate through example messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % exampleMessages.length);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="card p-6 mb-6 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-700">
          {/* Header with sparkle emoji */}
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Need a Little Support?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We all have those days. Let your besties know you could use some extra love right now 💕
            </p>
          </div>

          {/* Preview card - centered and improved */}
          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-6 mb-4 border-2 border-purple-300 dark:border-purple-600 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Preview</span>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              <div className="transform scale-110">
                <ProfileWithBubble
                  photoURL={userData?.photoURL}
                  name={userData?.displayName || currentUser?.email || 'You'}
                  requestAttention={{ active: true, tag: exampleMessages[currentMessageIndex] }}
                  size="lg"
                  showBubble={true}
                />
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/40 rounded-lg px-4 py-2 mt-2">
                <p className="text-sm text-purple-800 dark:text-purple-200 text-center font-medium">
                  Showing: <span className="font-bold">"{exampleMessages[currentMessageIndex]}"</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.light();
              setShowRequestAttention(true);
            }}
            className="btn bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full shadow-lg"
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
              💜 Request Attention
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Let your besties know you could use some support. This is a non-urgent request - they'll see a badge on your profile throughout the app.
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
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      requestAttention: {
                        active: true,
                        tag: attentionTag,
                        timestamp: Timestamp.now(),
                      }
                    });

                    // Notify all besties
                    try {
                      const bestiesQuery = query(
                        collection(db, 'besties'),
                        where('status', '==', 'accepted')
                      );
                      const bestiesSnapshot = await getDocs(bestiesQuery);
                      const userBesties = [];

                      bestiesSnapshot.forEach(doc => {
                        const data = doc.data();
                        // Get the other person's ID (not mine)
                        if (data.requesterId === currentUser.uid) {
                          userBesties.push({ id: data.recipientId });
                        } else if (data.recipientId === currentUser.uid) {
                          userBesties.push({ id: data.requesterId });
                        }
                      });

                      // Send notification to each bestie
                      for (const bestie of userBesties) {
                        await notificationService.notifyRequestAttention(
                          bestie.id,
                          userData?.displayName || 'A bestie',
                          currentUser.uid
                        );
                      }
                    } catch (notifError) {
                      console.error('Error sending notifications:', notifError);
                      // Don't fail the whole operation if notifications fail
                    }

                    toast.success('Your besties will see your request 💜');
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
