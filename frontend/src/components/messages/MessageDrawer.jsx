import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, where, getDocs, limit, Timestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

const PRESET_MESSAGES = [
  { emoji: '💜', text: 'Thinking of you - here if you need me' },
  { emoji: '☕', text: "Let's grab coffee this week" },
  { emoji: '🎧', text: "Want to vent? I'm listening" },
  { emoji: '📞', text: "I'll call you today" },
  { emoji: '🤗', text: 'Sending love' },
];

const MessageDrawer = ({ isOpen, onClose, recipientId, recipientName, recipientPhotoURL, contextType = 'spontaneous', contextId = null, preselectedMessage = null }) => {
  const { currentUser } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState(preselectedMessage || null);
  const [customMessage, setCustomMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  // Check rate limit on mount and when recipient changes
  React.useEffect(() => {
    if (!isOpen || !currentUser || !recipientId) return;

    const checkRateLimit = async () => {
      try {
        // Get start of today in user's local time (or UTC if timezone not set)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);

        // Check if user has sent a message to this recipient today
        const messagesQuery = query(
          collection(db, 'bestie_messages'),
          where('senderId', '==', currentUser.uid),
          where('recipientId', '==', recipientId),
          where('sentAt', '>=', startOfTodayTimestamp),
          orderBy('sentAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(messagesQuery);
        
        if (!snapshot.empty) {
          setRateLimited(true);
          const lastMessage = snapshot.docs[0].data();
          const lastSentAt = lastMessage.sentAt?.toDate();
          
          if (lastSentAt) {
            // Calculate when they can send again (tomorrow at midnight)
            const tomorrow = new Date(lastSentAt);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            setRateLimitInfo({
              lastSentAt,
              canSendAgainAt: tomorrow
            });
          }
        } else {
          setRateLimited(false);
          setRateLimitInfo(null);
        }
      } catch (error) {
        console.error('Error checking rate limit:', error);
        // Don't block sending if check fails
      }
    };

    checkRateLimit();
  }, [isOpen, currentUser, recipientId]);

  const handlePresetSelect = (message) => {
    haptic.light();
    setSelectedMessage(message);
    setIsCustom(false);
  };

  const handleCustomToggle = () => {
    haptic.light();
    setIsCustom(true);
    setSelectedMessage(null);
    setCustomMessage('');
  };

  const handleSend = async () => {
    if (!currentUser || !recipientId) return;

    let messageText = '';
    let messageType = 'preset';

    if (isCustom) {
      messageText = customMessage.trim();
      messageType = 'custom';
      
      if (!messageText) {
        toast.error('Please enter a message');
        return;
      }
      
      if (messageText.length > 100) {
        toast.error('Message must be 100 characters or less');
        return;
      }
    } else {
      if (!selectedMessage) {
        toast.error('Please select a message');
        return;
      }
      messageText = selectedMessage.text;
    }

    if (rateLimited) {
      toast.error(`You can send another message to ${recipientName} tomorrow 💜`);
      return;
    }

    setSending(true);
    haptic.medium();

    try {
      // Create message document
      const messageData = {
        senderId: currentUser.uid,
        recipientId: recipientId,
        messageType: messageType,
        messageText: messageText,
        sentAt: Timestamp.now(),
        readAt: null,
        contextType: contextType,
        contextId: contextId || null,
      };

      await addDoc(collection(db, 'bestie_messages'), messageData);

      // Success - close drawer and show toast
      toast.success(`Message sent to ${recipientName}!`);
      onClose();
      
      // Reset state
      setSelectedMessage(null);
      setCustomMessage('');
      setIsCustom(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if it's a rate limit error from backend
      if (error.message?.includes('rate limit') || error.message?.includes('already sent')) {
        toast.error(`You can send another message to ${recipientName} tomorrow 💜`);
        setRateLimited(true);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-display text-gray-900 dark:text-gray-100">
            Send Message to {recipientName}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rateLimited && rateLimitInfo && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏰ You already sent {recipientName} a message today!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You can send another message tomorrow at 12:00 AM 💜
              </p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Quick Messages:
            </h3>
            <div className="space-y-2">
              {PRESET_MESSAGES.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(msg)}
                  disabled={rateLimited || sending}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedMessage === msg && !isCustom
                      ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                  } ${rateLimited || sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg mr-2">{msg.emoji}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {msg.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="my-4 flex items-center">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>

          <div>
            <button
              onClick={handleCustomToggle}
              disabled={rateLimited || sending}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                isCustom
                  ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary'
              } ${rateLimited || sending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg mr-2">✍️</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Write Custom Message
              </span>
            </button>

            {isCustom && (
              <div className="mt-3">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message (100 characters max)..."
                  maxLength={100}
                  rows={3}
                  disabled={rateLimited || sending}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {customMessage.length}/100
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={rateLimited || sending || (!selectedMessage && !customMessage.trim())}
            className="flex-1 btn btn-primary"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MessageDrawer;

