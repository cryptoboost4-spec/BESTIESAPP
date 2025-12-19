import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import MoodSelector from './MoodSelector';
import CheckInNoteInput from './CheckInNoteInput';
import { addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';
import CircleCheckInTutorialOverlay from '../tutorials/circleCheckin/CircleCheckInTutorialOverlay';

const CircleCheckInCard = ({ onCheckInComplete }) => {
  const { currentUser, userData } = useAuth();
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user has checked in today
  useEffect(() => {
    if (!currentUser) return;

    const checkToday = async () => {
      try {
        // Get start of today in user's local time (or UTC)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);

        // Check if user has checked in today
        const checkInsQuery = query(
          collection(db, 'circle_checkins'),
          where('userId', '==', currentUser.uid),
          where('createdAt', '>=', startOfTodayTimestamp),
          limit(1)
        );

        const snapshot = await getDocs(checkInsQuery);
        setHasCheckedInToday(!snapshot.empty);
      } catch (error) {
        console.error('Error checking today check-in:', error);
      } finally {
        setLoading(false);
      }
    };

    checkToday();

    // Check if dismissed for today (localStorage)
    const dismissedKey = `circleCheckInDismissed_${new Date().toDateString()}`;
    const dismissed = localStorage.getItem(dismissedKey) === 'true';
    setIsDismissed(dismissed);

    // Check if tutorial has been seen
    const tutorialSeen = localStorage.getItem('circleCheckInTutorialSeen') === 'true';
    if (!tutorialSeen && !hasCheckedInToday) {
      setShowTutorial(true);
    }
  }, [currentUser, hasCheckedInToday]);

  const handleDismiss = () => {
    haptic.light();
    const dismissedKey = `circleCheckInDismissed_${new Date().toDateString()}`;
    localStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  const handleMoodSelect = (mood) => {
    haptic.medium();
    setSelectedMood(mood);
    setIsExpanded(true);
  };

  const handleShare = async () => {
    if (!currentUser || !selectedMood) return;

    setSubmitting(true);
    haptic.medium();

    try {
      // Get user's featured circle
      const featuredCircle = userData?.featuredCircle || [];

      // Create circle check-in
      await addDoc(collection(db, 'circle_checkins'), {
        userId: currentUser.uid,
        mood: selectedMood.value,
        note: note.trim() || null,
        createdAt: Timestamp.now(),
        visibleTo: featuredCircle, // Copy of featured circle at posting time
        responses: []
      });

      // Mark as checked in for today
      setHasCheckedInToday(true);
      setIsDismissed(true);
      
      // Show celebration
      toast.success(
        `Shared with Your Circle ✨\nYour ${featuredCircle.length} circle besties can now see how you're doing 💜`,
        { duration: 4000 }
      );

      if (onCheckInComplete) {
        onCheckInComplete();
      }
    } catch (error) {
      console.error('Error creating circle check-in:', error);
      toast.error('Failed to share check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show if already checked in today or dismissed
  if (loading || hasCheckedInToday || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Tutorial */}
      {showTutorial && (
        <CircleCheckInTutorialOverlay
          isActive={showTutorial}
          onComplete={() => setShowTutorial(false)}
        />
      )}

      <div className="card p-4 md:p-6 mb-4 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-2 border-purple-200 dark:border-purple-700 relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold transition-colors"
        title="Dismiss"
      >
        ✕
      </button>

      {!isExpanded ? (
        <>
          <h3 className="text-lg md:text-xl font-display text-gray-900 dark:text-gray-100 mb-4">
            How are you feeling today?
          </h3>
          <MoodSelector onSelect={handleMoodSelect} />
        </>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-lg md:text-xl font-display text-gray-900 dark:text-gray-100 mb-2">
              {selectedMood.emoji} {selectedMood.label}
            </h3>
            <CheckInNoteInput
              value={note}
              onChange={setNote}
              maxLength={50}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                haptic.light();
                setIsExpanded(false);
                setSelectedMood(null);
                setNote('');
              }}
              className="flex-1 btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={handleShare}
              disabled={submitting}
              className="flex-1 btn btn-primary"
            >
              {submitting ? 'Sharing...' : 'Share with Circle'}
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default CircleCheckInCard;

