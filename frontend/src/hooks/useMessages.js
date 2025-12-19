import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

/**
 * Custom hook to manage messages for a user
 * Provides real-time updates for received messages
 * 
 * @param {string} userId - Current user ID
 * @param {number} limitCount - Number of messages to fetch (default: 50)
 * @returns {Object} - { messages, unreadCount, loading }
 */
export const useMessages = (userId, limitCount = 50) => {
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setMessages([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        // Real-time listener for received messages
        const messagesQuery = query(
            collection(db, 'bestie_messages'),
            where('recipientId', '==', userId),
            orderBy('sentAt', 'desc'),
            limit(limitCount)
        );

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setMessages(msgs);
                setUnreadCount(msgs.filter(m => !m.readAt).length);
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to messages:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId, limitCount]);

    return { messages, unreadCount, loading };
};

export default useMessages;
