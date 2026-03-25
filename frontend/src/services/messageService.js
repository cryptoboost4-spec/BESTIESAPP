import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import { logAnalyticsEvent } from './firebase';

/**
 * Message Service - Handles "I See You" messages between besties
 * Features:
 * - One message per day rate limiting
 * - Preset and custom messages
 * - Read receipts
 * - Context tracking (where message was sent from)
 */

export const PRESET_MESSAGES = [
    { id: 'thinking', emoji: '💜', text: 'Thinking of you - here if you need me' },
    { id: 'coffee', emoji: '☕', text: "Let's grab coffee this week" },
    { id: 'vent', emoji: '🎧', text: "Want to vent? I'm listening" },
    { id: 'call', emoji: '📞', text: "I'll call you today" },
    { id: 'love', emoji: '🤗', text: 'Sending love' }
];

/**
 * Check if user can send a message to a specific bestie today
 * Rate limit: 1 message per day per bestie
 */
export const canSendMessage = async (senderId, recipientId) => {
    // Rate limit removed for MVP
    return true;
};

/**
 * Send a message to a bestie
 * @param {Object} params - Message parameters
 * @param {string} params.senderId - User ID of sender
 * @param {string} params.recipientId - User ID of recipient
 * @param {string} params.messageText - Message content (max 100 chars)
 * @param {string} params.messageType - 'preset' or 'custom'
 * @param {string} params.contextType - Where message was sent from
 * @param {string} params.contextId - ID of context (e.g., check-in ID)
 * @returns {Promise<string>} - Message ID
 */
export const sendMessage = async ({
    senderId,
    recipientId,
    messageText,
    messageType = 'custom',
    contextType = 'spontaneous',
    contextId = null
}) => {
    // Validate inputs
    if (!senderId || !recipientId || !messageText) {
        throw new Error('Missing required fields');
    }

    if (messageText.length > 100) {
        throw new Error('Message must be 100 characters or less');
    }

    // Check rate limit
    const canSend = await canSendMessage(senderId, recipientId);
    if (!canSend) {
        throw new Error('You can only send one message per day to each bestie');
    }

    try {
        // Create message
        const messageRef = await addDoc(collection(db, 'bestie_messages'), {
            senderId,
            recipientId,
            messageText: messageText.trim(),
            messageType,
            sentAt: Timestamp.now(),
            readAt: null,
            contextType,
            contextId
        });

        // Track analytics
        logAnalyticsEvent('message_sent', {
            message_type: messageType,
            context_type: contextType,
            has_context: !!contextId
        });

        return messageRef.id;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message. Please try again.');
    }
};

/**
 * Mark a message as read
 * @param {string} messageId - Message ID
 */
export const markMessageAsRead = async (messageId) => {
    try {
        await updateDoc(doc(db, 'bestie_messages', messageId), {
            readAt: Timestamp.now()
        });

        logAnalyticsEvent('message_read', {
            message_id: messageId
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        // Non-critical error - don't throw
    }
};

/**
 * Get messages for a user (received)
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of messages to fetch
 * @returns {Promise<Array>} - Array of messages
 */
export const getReceivedMessages = async (userId, limitCount = 50) => {
    try {
        const messagesQuery = query(
            collection(db, 'bestie_messages'),
            where('recipientId', '==', userId),
            orderBy('sentAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(messagesQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching received messages:', error);
        return [];
    }
};

/**
 * Get messages sent by a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of messages to fetch
 * @returns {Promise<Array>} - Array of messages
 */
export const getSentMessages = async (userId, limitCount = 50) => {
    try {
        const messagesQuery = query(
            collection(db, 'bestie_messages'),
            where('senderId', '==', userId),
            orderBy('sentAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(messagesQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching sent messages:', error);
        return [];
    }
};

/**
 * Get unread message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Count of unread messages
 */
export const getUnreadCount = async (userId) => {
    try {
        const messagesQuery = query(
            collection(db, 'bestie_messages'),
            where('recipientId', '==', userId),
            where('readAt', '==', null)
        );

        const snapshot = await getDocs(messagesQuery);
        return snapshot.size;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};

export default {
    PRESET_MESSAGES,
    canSendMessage,
    sendMessage,
    markMessageAsRead,
    getReceivedMessages,
    getSentMessages,
    getUnreadCount
};
