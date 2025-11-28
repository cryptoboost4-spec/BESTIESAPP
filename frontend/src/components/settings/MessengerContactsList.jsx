import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const MessengerContactsList = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const contactsRef = collection(db, 'messengerContacts');
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
        <div className="text-4xl mb-2">💬</div>
        <p className="text-text-secondary text-sm">
          No active Messenger contacts yet
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
        <span className="text-xs text-text-secondary">
          20-hour expiry
        </span>
      </div>

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {contact.photoURL ? (
              <img
                src={contact.photoURL}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {contact.name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary truncate">
              {contact.name}
            </div>
            <div className="text-xs text-text-secondary">
              {getTimeRemaining(contact.expiresAt)}
            </div>
          </div>

          {/* Messenger Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2zm.972 12.413l-2.562-2.732-5.002 2.732 5.502-5.838 2.623 2.732 4.941-2.732-5.502 5.838z"/>
              </svg>
            </div>
          </div>
        </div>
      ))}

      <div className="text-xs text-text-secondary mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        💡 <strong>Tip:</strong> Contacts can reconnect anytime by sending you another message using your Messenger link.
      </div>
    </div>
  );
};

export default MessengerContactsList;
