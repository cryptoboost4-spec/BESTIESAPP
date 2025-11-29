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
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(messengerLink)}&app_id=464891037130549&redirect_uri=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
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
        <h2 className="text-xl font-display text-text-primary flex items-center gap-1">
          <svg className="w-6 h-6 text-[#0084FF]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
          </svg>
          Facebook Messenger
          <span className="ml-1"><InfoButton message={infoMessage} /></span>
        </h2>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
          Free & Unlimited
        </span>
      </div>

      {/* Share Icons - Compact */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={shareViaMessenger}
          className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
          title="Share via Messenger"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2z"/>
          </svg>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Add me as your safety bestie! ${messengerLink}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
          title="Share via WhatsApp"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
        <a
          href={`sms:?body=${encodeURIComponent(`Add me as your safety bestie! ${messengerLink}`)}`}
          className="w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
          title="Share via SMS"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </a>
        <button
          onClick={handleCopy}
          className={`w-10 h-10 rounded-full ${copied ? 'bg-green-500' : 'bg-purple-500 hover:bg-purple-600'} text-white flex items-center justify-center transition-colors`}
          title={copied ? 'Copied!' : 'Copy Link'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
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
    </div>
  );
};

export default MessengerLinkDisplay;
