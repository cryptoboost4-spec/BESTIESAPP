import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { logAnalyticsEvent } from './firebase';

/**
 * Safety Pact Service - Handles safety pacts between besties
 * Features:
 * - Two-way promise system
 * - Pact activation
 * - Subtle reminders
 * - Easy termination
 */

export const PACT_TEXT = (bestieName) => `Hey ${bestieName},

You mean a lot to me. And I know I mean a lot to you too.

So let's make a promise to each other:

Whenever either of us is in a situation where we don't feel 100% safe, we'll use this app.

Not because we're scared, but because we're smart. Not because we have to, but because we want to come home safe - for ourselves and for each other.

Whether it's a first date, a night out, walking alone, meeting someone new, or just that weird feeling that something's off - we'll check in.

Because you matter to me. And I matter to you. And we both deserve to make it home safe.

Let's look out for each other. Deal?`;

/**
 * Create a safety pact invitation
 * @param {Object} params - Pact parameters
 * @param {string} params.user1Id - Initiator user ID
 * @param {string} params.user2Id - Invitee user ID
 * @returns {Promise<string>} - Pact ID
 */
export const createSafetyPact = async ({
    user1Id,
    user2Id
}) => {
    // Validate inputs
    if (!user1Id || !user2Id) {
        throw new Error('Missing required fields');
    }

    // Check if pact already exists
    const existingPactQuery = query(
        collection(db, 'safety_pacts'),
        where('user1Id', '==', user1Id),
        where('user2Id', '==', user2Id),
        where('status', 'in', ['pending', 'active'])
    );

    const existingSnapshot = await getDocs(existingPactQuery);
    if (!existingSnapshot.empty) {
        throw new Error('You already have a pact with this bestie');
    }

    try {
        // Create pact
        const pactRef = await addDoc(collection(db, 'safety_pacts'), {
            user1Id,
            user2Id,
            status: 'pending',
            createdAt: Timestamp.now(),
            activatedAt: null,
            user1AcceptedAt: Timestamp.now(), // Creator auto-accepts
            user2AcceptedAt: null,
            lastHonoredAt: null,
            lastHonoredBy: null,
            totalCheckInsUnderPact: 0
        });

        // Track analytics
        logAnalyticsEvent('safety_pact_created', {
            pact_id: pactRef.id
        });

        return pactRef.id;
    } catch (error) {
        console.error('Error creating safety pact:', error);
        throw new Error('Failed to create safety pact. Please try again.');
    }
};

/**
 * Accept a safety pact invitation
 * @param {string} pactDocId - Pact document ID
 */
export const acceptSafetyPact = async (pactDocId) => {
    try {
        await updateDoc(doc(db, 'safety_pacts', pactDocId), {
            status: 'active',
            activatedAt: Timestamp.now(),
            user2AcceptedAt: Timestamp.now()
        });

        logAnalyticsEvent('safety_pact_accepted', {
            pact_id: pactDocId
        });
    } catch (error) {
        console.error('Error accepting safety pact:', error);
        throw new Error('Failed to accept safety pact. Please try again.');
    }
};

/**
 * End a safety pact
 * @param {string} pactDocId - Pact document ID
 */
export const endSafetyPact = async (pactDocId) => {
    try {
        await updateDoc(doc(db, 'safety_pacts', pactDocId), {
            status: 'inactive'
        });

        logAnalyticsEvent('safety_pact_ended', {
            pact_id: pactDocId
        });
    } catch (error) {
        console.error('Error ending safety pact:', error);
        throw new Error('Failed to end safety pact. Please try again.');
    }
};

/**
 * Get active safety pacts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of pacts
 */
export const getUserSafetyPacts = async (userId) => {
    try {
        // Query as user1
        const user1Query = query(
            collection(db, 'safety_pacts'),
            where('user1Id', '==', userId),
            where('status', 'in', ['pending', 'active'])
        );

        // Query as user2
        const user2Query = query(
            collection(db, 'safety_pacts'),
            where('user2Id', '==', userId),
            where('status', 'in', ['pending', 'active'])
        );

        const [user1Snapshot, user2Snapshot] = await Promise.all([
            getDocs(user1Query),
            getDocs(user2Query)
        ]);

        const pacts = [
            ...user1Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...user2Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ];

        return pacts;
    } catch (error) {
        console.error('Error fetching user safety pacts:', error);
        return [];
    }
};

export default {
    PACT_TEXT,
    createSafetyPact,
    acceptSafetyPact,
    endSafetyPact,
    getUserSafetyPacts
};
