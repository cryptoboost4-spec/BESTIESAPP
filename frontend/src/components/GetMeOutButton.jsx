import React, { useState, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import haptic from '../utils/hapticFeedback';

/**
 * "Get Me Out of Here" emergency button
 * Hold for 3 seconds to send "please call me" notification to all besties
 * Non-emergency - for uncomfortable situations needing an exit
 */
const GetMeOutButton = ({ currentUser, userData }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const holdTimer = useRef(null);
  const progressInterval = useRef(null);

  const handleMouseDown = () => {
    if (sending) return;

    // Emergency haptic feedback when button is pressed
    haptic.emergency();

    setIsHolding(true);
    setProgress(0);

    // Progress animation
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current);
          return 100;
        }
        return prev + (100 / 30); // 30 frames over 3 seconds
      });
    }, 100);

    // Trigger after 3 seconds
    holdTimer.current = setTimeout(() => {
      triggerGetMeOut();
    }, 3000);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    setProgress(0);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const triggerGetMeOut = async () => {
    setSending(true);
    setProgress(100);

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
        setIsHolding(false);
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
        setIsHolding(false);
        setProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Error sending Get Me Out alert:', error);
      toast.error('Failed to send alert. Please try again.');
      setSending(false);
      setIsHolding(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={sending}
        className={`relative w-full p-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${
          sending
            ? 'bg-green-500 scale-95'
            : isHolding
            ? 'bg-orange-600 scale-95'
            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105'
        } ${sending ? 'cursor-wait' : 'cursor-pointer'} active:scale-95`}
      >
        {/* Progress ring */}
        {isHolding && !sending && (
          <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="white"
              strokeWidth="4"
              opacity="0.3"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
        )}

        {/* Button content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {sending ? (
            <>
              <span className="text-xl">✓</span>
              <span>Notifying your besties...</span>
            </>
          ) : isHolding ? (
            <>
              <span className="text-xl animate-pulse">⏱️</span>
              <span>Hold...</span>
            </>
          ) : (
            <>
              <span className="text-xl">📞</span>
              <span>Get Me Out of Here</span>
            </>
          )}
        </div>
      </button>

      {!sending && !isHolding && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Hold for 3 seconds to alert your besties
        </p>
      )}

      {sending && (
        <p className="text-xs text-center text-green-600 mt-2 font-semibold">
          💜 Your besties will call you soon!
        </p>
      )}
    </div>
  );
};

export default GetMeOutButton;
