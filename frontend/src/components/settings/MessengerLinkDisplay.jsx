import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MESSENGER_CONFIG } from '../../config/messenger';
import InfoButton from '../InfoButton';
import MessengerContactsList from './MessengerContactsList';

const MessengerLinkDisplay = ({ userId }) => {
  const [copied, setCopied] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [activeContactCount, setActiveContactCount] = useState(0);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customMessage, setCustomMessage] = useState("Hey! I'm using Besties for safety check-ins. Click this link and send me a message to get connected - you'll be alerted if I don't check in safely. 💜");
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const messengerLink = MESSENGER_CONFIG.getLinkForUser(userId);

  // Listen to active contact count
  useEffect(() => {
    if (!userId) return;

    const contactsRef = collection(db, 'messengerContacts');
    const q = query(contactsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const activeCount = snapshot.docs.filter(doc =>
        doc.data().expiresAt?.toMillis() > now
      ).length;
      setActiveContactCount(activeCount);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messengerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaMessenger = () => {
    // Build share URL with custom quote and photo if provided
    let shareUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(messengerLink)}&app_id=464891037130549`;

    if (customMessage) {
      shareUrl += `&quote=${encodeURIComponent(customMessage)}`;
    }

    if (customPhotoUrl) {
      shareUrl += `&picture=${encodeURIComponent(customPhotoUrl)}`;
    }

    shareUrl += `&redirect_uri=${encodeURIComponent(window.location.href)}`;

    window.open(shareUrl, '_blank');
  };

  const infoMessage = `Share your personal Messenger link with emergency contacts. When they click it and send any message, they're connected for 20 hours. They'll get alerts if you don't check in safely.

How it works:
1. Share link with emergency contacts
2. They click & send ANY message on Messenger
3. Connected for 20 hours automatically
4. Select them when creating check-ins
5. They get alerts if you don't check in

Why use this?
• Unlimited contacts (no 5-person limit)
• Completely free forever
• Easy setup - just one message
• Auto-expires after 20 hours for privacy
• Instant real-time alerts`;

  return (
    <div className="card p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary flex items-center gap-2">
          Facebook Messenger Contacts
          <InfoButton message={infoMessage} />
        </h2>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
          Free & Unlimited
        </span>
      </div>

      {/* Link */}
      <div className="mb-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm font-mono text-text-primary overflow-x-auto whitespace-nowrap">
            {messengerLink}
          </div>
          <button
            onClick={handleCopy}
            className={`btn ${copied ? 'btn-success' : 'btn-secondary'} flex-shrink-0`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={shareViaMessenger}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2zm.972 12.413l-2.562-2.732-5.002 2.732 5.502-5.838 2.623 2.732 4.941-2.732-5.502 5.838z"/>
          </svg>
          Share via Messenger
        </button>
        <button
          onClick={() => setShowCustomizeModal(true)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Customize
        </button>
      </div>

      {/* Active Connections Link */}
      <button
        onClick={() => setShowContacts(!showContacts)}
        className="w-full text-sm text-primary hover:text-primary-dark transition-colors flex items-center justify-center gap-2"
      >
        {activeContactCount > 0 ? (
          <>
            <span className="font-semibold">{activeContactCount}</span>
            active connection{activeContactCount !== 1 ? 's' : ''}
          </>
        ) : (
          'No active connections'
        )}
        <svg
          className={`w-4 h-4 transition-transform ${showContacts ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contacts List (Collapsible) */}
      {showContacts && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <MessengerContactsList userId={userId} />
        </div>
      )}

      {/* Customize Share Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-display text-text-primary mb-4">Customize Messenger Share</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Custom Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[100px]"
                  placeholder="Enter a custom message to share with your link..."
                />
                <p className="text-xs text-text-secondary mt-1">
                  This message will be included when you share via Messenger
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Custom Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Add a photo URL to display with your share (must be publicly accessible)
                </p>
              </div>

              {customPhotoUrl && (
                <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <p className="text-xs text-text-secondary mb-2">Preview:</p>
                  <img
                    src={customPhotoUrl}
                    alt="Custom share preview"
                    className="w-full max-h-48 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-sm text-red-600 dark:text-red-400">
                    ⚠️ Failed to load image. Please check the URL.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCustomizeModal(false);
                  // Message and photo are already saved in state
                }}
                className="flex-1 btn btn-primary"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerLinkDisplay;
