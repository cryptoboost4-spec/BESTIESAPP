import { useState, useEffect } from 'react';
import { canSendMessage } from '../services/messageService';

/**
 * Custom hook to check if user can send a message to a bestie
 * Implements rate limiting (1 message per day per bestie)
 * 
 * @param {string} senderId - Current user ID
 * @param {string} recipientId - Bestie user ID
 * @returns {Object} - { canSend, checking, checkRateLimit }
 */
export const useMessageRateLimit = (senderId, recipientId) => {
    const [canSend, setCanSend] = useState(true);
    const [checking, setChecking] = useState(false);

    const checkRateLimit = async () => {
        if (!senderId || !recipientId) {
            setCanSend(false);
            return false;
        }

        setChecking(true);
        try {
            const allowed = await canSendMessage(senderId, recipientId);
            setCanSend(allowed);
            return allowed;
        } catch (error) {
            console.error('Error checking rate limit:', error);
            setCanSend(false);
            return false;
        } finally {
            setChecking(false);
        }
    };

    // Check rate limit on mount and when IDs change
    useEffect(() => {
        checkRateLimit();
    }, [senderId, recipientId]);

    return { canSend, checking, checkRateLimit };
};

export default useMessageRateLimit;
