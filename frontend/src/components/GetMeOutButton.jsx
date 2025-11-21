import React, { useState, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import haptic from '../utils/hapticFeedback';

/**
 * "Get Me Out of Here" emergency button
 * Click to send "please call me" notification to all besties
 * Non-emergency - for uncomfortable situations needing an exit
 */
const GetMeOutButton = ({ currentUser, userData }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sending, setSending] = useState(false);

  const triggerGetMeOut = async () => {
    setSending(true);
    setShowConfirmation(false);

    try {
      // Get all besties
      const bestiesQuery1 = query(
        collection(db, 'besties'),
        where('requesterId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(bestiesQuery1),
        getDocs(bestiesQuery2)
      ]);

      const bestieIds = new Set();
      snapshot1.forEach(doc => bestieIds.add(doc.data().recipientId));
      snapshot2.forEach(doc => bestieIds.add(doc.data().requesterId));

      if (bestieIds.size === 0) {
        toast.error('You need besties to use this feature');
        setSending(false);
        return;
      }

      // Create "Get Me Out" alert
      const alert = await addDoc(collection(db, 'get_me_out_alerts'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'Your bestie',
        userPhoto: userData?.photoURL || null,
        message: `${userData?.displayName || 'Your bestie'} needs you to call them! They might be in an uncomfortable situation.`,
        bestieIds: Array.from(bestieIds),
        createdAt: Timestamp.now(),
        responded: []
      });

      // Send notifications to all besties
      // This will be picked up by Cloud Function to send push/SMS/email
      console.log('Get Me Out alert created:', alert.id);

      // Success haptic feedback when alert is successfully triggered
      haptic.success();

      toast.success('📞 Your besties are being notified to call you!', {
        duration: 5000,
        icon: '💜'
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setSending(false);
      }, 2000);

    } catch (error) {
      console.error('Error sending Get Me Out alert:', error);
      toast.error('Failed to send alert. Please try again.');
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={() => {
            haptic.medium();
            setShowConfirmation(true);
          }}
          disabled={sending}
          className={`w-full max-w-md p-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${
            sending
              ? 'bg-green-500 scale-95'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105'
          } ${sending ? 'cursor-wait' : 'cursor-pointer'} active:scale-95`}
        >
          {/* Button content */}
          <div className="flex items-center justify-center gap-2">
            {sending ? (
              <>
                <span className="text-xl">✓</span>
                <span>Notifying your besties...</span>
              </>
            ) : (
              <>
                <span className="text-xl">📞</span>
                <span>Get Me Out of Here</span>
              </>
            )}
          </div>
        </button>
      </div>

      {sending && (
        <p className="text-xs text-center text-green-600 mt-2 font-semibold">
          💜 Your besties will call you soon!
        </p>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-display text-text-primary mb-2">
              🆘 Need an Exit?
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Are you sure? We will get your besties on the job!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 btn btn-secondary"
              >
                No
              </button>
              <button
                onClick={triggerGetMeOut}
                className="flex-1 btn bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Yes, Get Me Out!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GetMeOutButton;
