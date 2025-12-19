import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import { logAnalyticsEvent } from './firebase';

/**
 * Circle Check-In Service - Handles daily wellness check-ins
 * Features:
 * - One check-in per day
 * - Visible only to featured circle
 * - Mood tracking (1-5 scale)
 * - Optional notes (50 chars max)
 */

export const MOODS = [
    { value: 5, emoji: '🌟', label: 'Amazing', color: 'from-yellow-400 to-orange-400' },
    { value: 4, emoji: '😊', label: 'Good', color: 'from-green-400 to-emerald-400' },
    { value: 3, emoji: '😐', label: 'Okay', color: 'from-blue-400 to-cyan-400' },
    { value: 2, emoji: '😔', label: 'Not great', color: 'from-purple-400 to-pink-400' },
    { value: 1, emoji: '😢', label: 'Struggling', color: 'from-red-400 to-rose-400' }
];

/**
 * Check if user can create a circle check-in today
 * Rate limit: 1 check-in per day
 */
export const canCreateCircleCheckIn = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkInsQuery = query(
            collection(db, 'circle_checkins'),
            where('userId', '==', userId),
            where('createdAt', '>=', Timestamp.fromDate(today)),
            limit(1)
        );

        const snapshot = await getDocs(checkInsQuery);
        return snapshot.empty; // true if can create
    } catch (error) {
        console.error('Error checking circle check-in rate limit:', error);
        return false; // Fail closed
    }
};

/**
 * Create a circle check-in
 * @param {Object} params - Check-in parameters
 * @param {string} params.userId - User ID
 * @param {number} params.mood - Mood value (1-5)
 * @param {string} params.note - Optional note (max 50 chars)
 * @param {Array<string>} params.visibleTo - Featured circle user IDs
 * @returns {Promise<string>} - Check-in ID
 */
export const createCircleCheckIn = async ({
    userId,
    mood,
    note = null,
    visibleTo = []
}) => {
    // Validate inputs
    if (!userId || !mood) {
        throw new Error('Missing required fields');
    }

    if (mood < 1 || mood > 5) {
        throw new Error('Mood must be between 1 and 5');
    }

    if (note && note.length > 50) {
        throw new Error('Note must be 50 characters or less');
    }

    // Check rate limit
    const canCreate = await canCreateCircleCheckIn(userId);
    if (!canCreate) {
        throw new Error('You can only create one circle check-in per day');
    }

    try {
        // Create check-in
        const checkInRef = await addDoc(collection(db, 'circle_checkins'), {
            userId,
            mood,
            note: note ? note.trim() : null,
            createdAt: Timestamp.now(),
            visibleTo: visibleTo || [], // Allow empty arrays
            responses: [] // Message IDs sent in response
        });

        // Track analytics
        logAnalyticsEvent('circle_checkin_created', {
            mood,
            has_note: !!note,
            visible_to_count: visibleTo.length
        });

        return checkInRef.id;
    } catch (error) {
        console.error('Error creating circle check-in:', error);
        throw new Error('Failed to create check-in. Please try again.');
    }
};

/**
 * Get circle check-ins visible to a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of check-ins to fetch
 * @returns {Promise<Array>} - Array of check-ins
 */
export const getVisibleCircleCheckIns = async (userId, limitCount = 50) => {
    try {
        const checkInsQuery = query(
            collection(db, 'circle_checkins'),
            where('visibleTo', 'array-contains', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(checkInsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching visible circle check-ins:', error);
        return [];
    }
};

/**
 * Get user's own circle check-ins
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of check-ins to fetch
 * @returns {Promise<Array>} - Array of check-ins
 */
export const getUserCircleCheckIns = async (userId, limitCount = 30) => {
    try {
        const checkInsQuery = query(
            collection(db, 'circle_checkins'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(checkInsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching user circle check-ins:', error);
        return [];
    }
};

const circleCheckInService = {
    MOODS,
    canCreateCircleCheckIn,
    createCircleCheckIn,
    getVisibleCircleCheckIns,
    getUserCircleCheckIns
};

export default circleCheckInService;
