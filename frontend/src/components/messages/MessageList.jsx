import React, { useState, useEffect } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { markMessageAsRead } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/**
 * MessageList - Displays list of messages grouped by bestie
 * Features:
 * - Groups messages by sender/recipient
 * - Shows unread indicators
 * - Last message preview
 * - Tap to view full thread
 */
const MessageList = () => {
    const { currentUser, userData } = useAuth();
    const { messages, unreadCount, loading } = useMessages(currentUser?.uid);
    const navigate = useNavigate();
    const [groupedMessages, setGroupedMessages] = useState({});

    // Group messages by bestie
    useEffect(() => {
        if (!messages.length) {
            setGroupedMessages({});
            return;
        }

        const grouped = {};
        messages.forEach(msg => {
            // Determine the other person (bestie)
            const bestieId = msg.senderId === currentUser.uid ? msg.recipientId : msg.senderId;

            if (!grouped[bestieId]) {
                grouped[bestieId] = [];
            }
            grouped[bestieId].push(msg);
        });

        setGroupedMessages(grouped);
    }, [messages, currentUser]);

    const handleMessageClick = async (message) => {
        // Mark as read if unread
        if (!message.readAt && message.recipientId === currentUser.uid) {
            await markMessageAsRead(message.id);
        }

        // Navigate to bestie profile or message thread
        const bestieId = message.senderId === currentUser.uid ? message.recipientId : message.senderId;
        navigate(`/profile/${bestieId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="text-center p-8">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                    No Messages Yet
                </h3>
                <p className="text-text-secondary">
                    Send your first "I See You" message to a bestie!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-text-primary">
                    Messages
                </h2>
                {unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCount} new
                    </span>
                )}
            </div>

            {/* Message List */}
            <div className="space-y-2">
                {Object.entries(groupedMessages).map(([bestieId, bestieMessages]) => {
                    const lastMessage = bestieMessages[0]; // Already sorted by sentAt desc
                    const isUnread = !lastMessage.readAt && lastMessage.recipientId === currentUser.uid;
                    const isSent = lastMessage.senderId === currentUser.uid;

                    return (
                        <button
                            key={bestieId}
                            onClick={() => handleMessageClick(lastMessage)}
                            className={`w-full text-left p-4 rounded-xl transition-all ${isUnread
                                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/50'
                                    : 'bg-surface-light dark:bg-gray-800 hover:bg-surface-light/80'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar placeholder */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {bestieId.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Bestie name */}
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`font-semibold ${isUnread ? 'text-primary' : 'text-text-primary'}`}>
                                            Bestie {bestieId.substring(0, 8)}...
                                        </h4>
                                        <span className="text-xs text-text-secondary">
                                            {formatDistanceToNow(lastMessage.sentAt.toDate(), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* Last message preview */}
                                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                                        {isSent && <span className="text-primary">You: </span>}
                                        {lastMessage.messageText}
                                    </p>

                                    {/* Message count */}
                                    {bestieMessages.length > 1 && (
                                        <p className="text-xs text-text-secondary mt-1">
                                            {bestieMessages.length} messages
                                        </p>
                                    )}
                                </div>

                                {/* Unread indicator */}
                                {isUnread && (
                                    <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MessageList;
