import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

const TelegramContactsList = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time listener for contacts
  useEffect(() => {
    if (!userId) return;

    const contactsRef = collection(db, 'telegramContacts');
    const q = query(contactsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out expired contacts and sort by connection time
      const now = Date.now();
      const activeContacts = contactsData
        .filter(contact => contact.expiresAt?.toMillis() > now)
        .sort((a, b) => b.connectedAt?.toMillis() - a.connectedAt?.toMillis());

      setContacts(activeContacts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Update countdown timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const expiryTime = expiresAt?.toMillis();
    const remaining = expiryTime - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">✈️</div>
        <p className="text-text-secondary text-sm">
          No active Telegram contacts yet
        </p>
        <p className="text-text-secondary text-xs mt-1">
          Share your link to get emergency contacts connected!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary">
          Connected Contacts ({contacts.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            Auto-updates
          </span>
          <button
            onClick={handleManualRefresh}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Refresh countdown timers"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {contacts.map((contact) => (
        <div
          key={`${contact.id}-${refreshKey}`}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          {/* Profile Photo or Initial */}
          <div className="flex-shrink-0">
            {contact.photoURL ? (
              <img
                src={contact.photoURL}
                alt={contact.firstName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {contact.firstName?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary truncate">
              {contact.firstName}
              {contact.username && (
                <span className="text-text-secondary font-normal ml-2">
                  @{contact.username}
                </span>
              )}
            </div>
            <div className="text-xs text-text-secondary">
              {getTimeRemaining(contact.expiresAt)}
            </div>
          </div>

          {/* Telegram Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.823 8.598c-.136.613-.494.764-.999.474l-2.761-2.034-1.33 1.279c-.146.147-.271.271-.552.271l.197-2.798 5.092-4.603c.221-.197-.048-.307-.343-.11l-6.291 3.962-2.71-.848c-.59-.185-.602-.59.124-.873l10.598-4.086c.49-.176.918.11.757.874z"/>
              </svg>
            </div>
          </div>
        </div>
      ))}

      <div className="text-xs text-text-secondary mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        💡 <strong>Tip:</strong> Contacts can reconnect anytime by clicking your Telegram link and pressing START again.
      </div>
    </div>
  );
};

export default TelegramContactsList;
