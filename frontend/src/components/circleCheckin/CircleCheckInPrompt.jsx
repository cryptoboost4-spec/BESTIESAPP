import React, { useState, useEffect } from 'react';
import { MOODS, createCircleCheckIn, canCreateCircleCheckIn } from '../../services/circleCheckInService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

/**
 * CircleCheckInPrompt - Daily wellness check-in prompt
 * Features:
 * - Appears only if user hasn't checked in today
 * - Dismissible (remembers for 24h)
 * - Mood selector with emojis
 * - Optional note input
 */
const CircleCheckInPrompt = () => {
    const { currentUser, userData } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [canCheckIn, setCanCheckIn] = useState(false);
    const [checking, setChecking] = useState(true);
    const [selectedMood, setSelectedMood] = useState(null);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Check if user can create check-in
    useEffect(() => {
        const checkRateLimit = async () => {
            if (!currentUser) {
                setChecking(false);
                return;
            }

            // Check localStorage for dismissal
            const dismissedToday = localStorage.getItem('circleCheckInDismissed');
            if (dismissedToday) {
                const dismissedDate = new Date(dismissedToday);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dismissedDate >= today) {
                    setDismissed(true);
                    setChecking(false);
                    return;
                }
            }

            const allowed = await canCreateCircleCheckIn(currentUser.uid);
            setCanCheckIn(allowed);
            setChecking(false);
        };

        checkRateLimit();
    }, [currentUser]);

    const handleDismiss = () => {
        haptic.light();
        setDismissed(true);
        localStorage.setItem('circleCheckInDismissed', new Date().toISOString());
    };

    const handleMoodSelect = (mood) => {
        haptic.light();
        setSelectedMood(mood);
        setShowNoteInput(true);
    };

    const handleSubmit = async (skipNote = false) => {
        if (!selectedMood) {
            toast.error('Please select how you\'re feeling');
            return;
        }

        if (!skipNote && showNoteInput && !note.trim()) {
            // User hasn't entered a note yet, just waiting
            return;
        }

        haptic.medium();
        setSubmitting(true);

        try {
            // Get featured circle from userData
            const visibleTo = userData?.featuredCircle || [];

            await createCircleCheckIn({
                userId: currentUser.uid,
                mood: selectedMood.value,
                note: skipNote ? null : (note.trim() || null),
                visibleTo
            });

            toast.success('Shared with your circle! 💜', {
                icon: selectedMood.emoji,
                duration: 3000
            });

            // Hide prompt
            setDismissed(true);
            localStorage.setItem('circleCheckInDismissed', new Date().toISOString());
        } catch (error) {
            toast.error(error.message || 'Failed to share. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Don't show if checking, dismissed, or can't check in
    if (checking || dismissed || !canCheckIn) {
        return null;
    }

    return (
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
            {/* Close button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Dismiss"
            >
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="text-center mb-4">
                <h3 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                    How are you feeling today?
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                    Share with your circle (optional)
                </p>
            </div>

            {!showNoteInput ? (
                // Mood selector
                <div className="flex justify-center gap-3 flex-wrap">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.value}
                            onClick={() => handleMoodSelect(mood)}
                            disabled={submitting}
                            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all disabled:opacity-50"
                            title={mood.label}
                        >
                            <span className="text-4xl">{mood.emoji}</span>
                            <span className="text-xs font-medium text-text-secondary">{mood.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                // Note input
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-3xl">{selectedMood.emoji}</span>
                        <span className="font-semibold text-text-primary">{selectedMood.label}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Want to share more? (optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note..."
                            maxLength={50}
                            rows={2}
                            disabled={submitting}
                            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none resize-none"
                        />
                        <p className="text-xs text-text-secondary mt-1 text-right">
                            {note.length}/50 characters
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="flex-1 btn btn-secondary"
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="flex-1 btn btn-primary"
                        >
                            {submitting ? 'Sharing...' : 'Share with Circle'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CircleCheckInPrompt;
