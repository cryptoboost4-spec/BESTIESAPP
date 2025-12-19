import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import MessageDrawer from './MessageDrawer';

const MessageThread = ({ bestieId, bestieName, bestiePhotoURL, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages
  useEffect(() => {
    if (!currentUser || !bestieId) return;

    // Query messages where current user is sender or recipient with this bestie
    const messagesQuery = query(
      collection(db, 'bestie_messages'),
      where('senderId', 'in', [currentUser.uid, bestieId]),
      where('recipientId', 'in', [currentUser.uid, bestieId]),
      orderBy('sentAt', 'desc'),
      limit(50) // Show last 50 messages
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs = [];
        let unread = 0;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Only include messages between these two users
          if (
            (data.senderId === currentUser.uid && data.recipientId === bestieId) ||
            (data.senderId === bestieId && data.recipientId === currentUser.uid)
          ) {
            msgs.push({
              id: docSnap.id,
              ...data,
            });

            // Count unread messages (sent by bestie, not read yet)
            if (data.senderId === bestieId && data.recipientId === currentUser.uid && !data.readAt) {
              unread++;
            }
          }
        });

        // Sort by sentAt ascending for display
        msgs.sort((a, b) => {
          const aTime = a.sentAt?.toMillis() || 0;
          const bTime = b.sentAt?.toMillis() || 0;
          return aTime - bTime;
        });

        setMessages(msgs);
        setUnreadCount(unread);
        setLoading(false);

        // Mark all unread messages as read
        if (unread > 0) {
          msgs.forEach((msg) => {
            if (msg.senderId === bestieId && msg.recipientId === currentUser.uid && !msg.readAt) {
              updateDoc(doc(db, 'bestie_messages', msg.id), {
                readAt: Timestamp.now(),
              }).catch((error) => {
                console.error('Error marking message as read:', error);
              });
            }
          });
        }
      },
      (error) => {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, bestieId]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const formatDateHeader = (timestamp, prevTimestamp) => {
    if (!timestamp) return null;
    
    const date = timestamp.toDate();
    const prevDate = prevTimestamp?.toDate();
    
    // Show date header if it's a different day
    if (!prevTimestamp || date.toDateString() !== prevDate.toDateString()) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ←
              </button>
            )}
            {bestiePhotoURL ? (
              <img
                src={bestiePhotoURL}
                alt={bestieName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {bestieName?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{bestieName}</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-primary">{unreadCount} unread</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isFromMe = message.senderId === currentUser.uid;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const dateHeader = formatDateHeader(message.sentAt, prevMessage?.sentAt);

            return (
              <React.Fragment key={message.id}>
                {dateHeader && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-4">
                    {dateHeader}
                  </div>
                )}
                <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isFromMe
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs opacity-70">
                        {getTimeAgo(message.sentAt)}
                      </span>
                      {isFromMe && (
                        <span className="text-xs opacity-70">
                          {message.readAt ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Button */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowDrawer(true)}
          className="w-full btn btn-primary"
        >
          💬 Reply to {bestieName}
        </button>
      </div>

      {/* Message Drawer */}
      <MessageDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        recipientId={bestieId}
        recipientName={bestieName}
        recipientPhotoURL={bestiePhotoURL}
        contextType="profile"
      />
    </div>
  );
};

export default MessageThread;

