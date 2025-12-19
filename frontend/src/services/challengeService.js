import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { logAnalyticsEvent } from './firebase';

/**
 * Challenge Service - Handles bestie challenges
 * Features:
 * - Challenge templates
 * - Invitation system
 * - Automatic progress tracking (via Cloud Functions)
 * - Completion celebration
 */

export const CHALLENGE_TEMPLATES = [
    {
        id: 'weekend_safety_warriors',
        name: 'Weekend Safety Warriors',
        description: 'Both complete 3 safety check-ins this week',
        metric: 'safety_checkins',
        target: 3,
        duration: 7, // days
        points: 50,
        badge: 'weekend_warrior',
        emoji: '🛡️'
    },
    {
        id: 'connection_champions',
        name: 'Connection Champions',
        description: 'Share how you\'re feeling 5 times this week',
        metric: 'circle_checkins',
        target: 5,
        duration: 7,
        points: 50,
        badge: null,
        emoji: '💜'
    },
    {
        id: 'support_squad',
        name: 'Support Squad',
        description: 'Send each other 3 messages this week',
        metric: 'messages_exchanged',
        target: 3,
        duration: 7,
        points: 30,
        badge: null,
        emoji: '🤝'
    }
];

/**
 * Create a challenge invitation
 * @param {Object} params - Challenge parameters
 * @param {string} params.user1Id - Initiator user ID
 * @param {string} params.user2Id - Invitee user ID
 * @param {string} params.challengeId - Template ID
 * @returns {Promise<string>} - Challenge ID
 */
export const createChallenge = async ({
    user1Id,
    user2Id,
    challengeId
}) => {
    // Validate inputs
    if (!user1Id || !user2Id || !challengeId) {
        throw new Error('Missing required fields');
    }

    // Get template
    const template = CHALLENGE_TEMPLATES.find(t => t.id === challengeId);
    if (!template) {
        throw new Error('Invalid challenge template');
    }

    try {
        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + template.duration);

        // Create challenge
        const challengeRef = await addDoc(collection(db, 'bestie_challenges'), {
            challengeId,
            user1Id,
            user2Id,
            status: 'invited',
            startedAt: null,
            expiresAt: Timestamp.fromDate(expiresAt),
            user1Progress: 0,
            user2Progress: 0,
            completedAt: null,
            target: template.target,
            metric: template.metric
        });

        // Track analytics
        logAnalyticsEvent('challenge_created', {
            challenge_id: challengeId,
            metric: template.metric
        });

        return challengeRef.id;
    } catch (error) {
        console.error('Error creating challenge:', error);
        throw new Error('Failed to create challenge. Please try again.');
    }
};

/**
 * Accept a challenge invitation
 * @param {string} challengeDocId - Challenge document ID
 */
export const acceptChallenge = async (challengeDocId) => {
    try {
        await updateDoc(doc(db, 'bestie_challenges', challengeDocId), {
            status: 'active',
            startedAt: Timestamp.now()
        });

        logAnalyticsEvent('challenge_accepted', {
            challenge_id: challengeDocId
        });
    } catch (error) {
        console.error('Error accepting challenge:', error);
        throw new Error('Failed to accept challenge. Please try again.');
    }
};

/**
 * Cancel a challenge
 * @param {string} challengeDocId - Challenge document ID
 */
export const cancelChallenge = async (challengeDocId) => {
    try {
        await updateDoc(doc(db, 'bestie_challenges', challengeDocId), {
            status: 'cancelled'
        });

        logAnalyticsEvent('challenge_cancelled', {
            challenge_id: challengeDocId
        });
    } catch (error) {
        console.error('Error cancelling challenge:', error);
        throw new Error('Failed to cancel challenge. Please try again.');
    }
};

/**
 * Get active challenges for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of challenges
 */
export const getUserChallenges = async (userId) => {
    try {
        // Query as user1
        const user1Query = query(
            collection(db, 'bestie_challenges'),
            where('user1Id', '==', userId),
            where('status', 'in', ['invited', 'active']),
            orderBy('startedAt', 'desc')
        );

        // Query as user2
        const user2Query = query(
            collection(db, 'bestie_challenges'),
            where('user2Id', '==', userId),
            where('status', 'in', ['invited', 'active']),
            orderBy('startedAt', 'desc')
        );

        const [user1Snapshot, user2Snapshot] = await Promise.all([
            getDocs(user1Query),
            getDocs(user2Query)
        ]);

        const challenges = [
            ...user1Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...user2Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ];

        return challenges;
    } catch (error) {
        console.error('Error fetching user challenges:', error);
        return [];
    }
};

export default {
    CHALLENGE_TEMPLATES,
    createChallenge,
    acceptChallenge,
    cancelChallenge,
    getUserChallenges
};
