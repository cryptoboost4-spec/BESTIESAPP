import React from 'react';
import { MESSENGER_CONFIG } from '../../config/messenger';
import InfoButton from '../InfoButton';

const MessengerContactSelector = ({
  messengerContacts,
  selectedContacts,
  setSelectedContacts,
  userId
}) => {
  const toggleContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const expiryTime = expiresAt?.toMillis();
    const remaining = expiryTime - now;

    if (remaining <= 0) return null; // Expired

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  // Filter out expired contacts
  const now = Date.now();
  const activeContacts = messengerContacts.filter(
    contact => contact.expiresAt?.toMillis() > now
  );

  const copyMessengerLink = () => {
    const link = MESSENGER_CONFIG.getLinkForUser(userId);
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-display text-text-primary flex items-center gap-2">
          Messenger Contacts (Optional)
          <InfoButton message="Select Messenger contacts to receive emergency alerts. No limits! Contacts auto-connect for 20 hours when they message you via your Messenger link. Completely free alternative to SMS." />
        </label>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
          Unlimited & Free
        </span>
      </div>

      {activeContacts.length === 0 ? (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">💜</div>
            <p className="font-semibold text-text-primary mb-2">Add a Messenger Bestie</p>
            <p className="text-text-secondary text-sm mb-4">
              Free & unlimited alerts! Share your link and when they message you, they're connected for 20 hours.
            </p>
            
            {/* Tooltip explanation */}
            <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-pink-800 dark:text-pink-200">
                <strong>💡 How it works:</strong> Share your link → They click & send any message → Instant 20hr connection for free alerts!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={copyMessengerLink}
                className="btn btn-secondary inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              <a
                href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(MESSENGER_CONFIG.getLinkForUser(userId))}&app_id=464891037130549&redirect_uri=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2z"/>
                </svg>
                Share on Messenger
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {activeContacts.map((contact) => {
              const isSelected = selectedContacts.includes(contact.id);
              const timeRemaining = getTimeRemaining(contact.expiresAt);

              if (!timeRemaining) return null; // Skip expired contacts

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleContact(contact.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      {contact.photoURL ? (
                        <img
                          src={contact.photoURL}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {contact.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {contact.name}
                      </div>
                      <div className="text-sm text-text-secondary flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2zm.972 12.413l-2.562-2.732-5.002 2.732 5.502-5.838 2.623 2.732 4.941-2.732-5.502 5.838z"/>
                        </svg>
                        <span>{timeRemaining}</span>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedContacts.length > 0 && (
            <div className="text-sm text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-text-secondary">
              ✓ {selectedContacts.length} Messenger contact{selectedContacts.length > 1 ? 's' : ''} selected
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MessengerContactSelector;
