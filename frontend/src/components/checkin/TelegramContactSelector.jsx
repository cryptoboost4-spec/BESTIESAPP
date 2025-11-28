import React from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const TelegramContactSelector = ({
  telegramContacts,
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
  const activeContacts = telegramContacts.filter(
    contact => contact.expiresAt?.toMillis() > now
  );

  const copyTelegramLink = () => {
    const link = TELEGRAM_CONFIG.getLinkForUser(userId);
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-display text-text-primary flex items-center gap-2">
          Telegram Contacts (Optional)
          <InfoButton message="Select Telegram contacts to receive emergency alerts. No limits! Contacts auto-connect for 20 hours when they start the bot via your Telegram link. Completely free alternative to SMS." />
        </label>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
          Unlimited & Free
        </span>
      </div>

      {activeContacts.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">✈️</div>
            <p className="font-semibold text-text-primary mb-2">No Telegram contacts connected</p>
            <p className="text-text-secondary text-sm mb-4">
              Share your Telegram link with emergency contacts. When they click it and press START,
              they'll be connected for 20 hours. No 5-person limit!
            </p>
            <button
              type="button"
              onClick={copyTelegramLink}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Your Telegram Link
            </button>
            <p className="text-xs text-text-secondary mt-3">
              Find your link in Settings → Telegram Alerts
            </p>
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
                          alt={contact.firstName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {contact.firstName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {contact.firstName}
                        {contact.username && (
                          <span className="text-text-secondary font-normal ml-2 text-sm">
                            @{contact.username}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.823 8.598c-.136.613-.494.764-.999.474l-2.761-2.034-1.33 1.279c-.146.147-.271.271-.552.271l.197-2.798 5.092-4.603c.221-.197-.048-.307-.343-.11l-6.291 3.962-2.71-.848c-.59-.185-.602-.59.124-.873l10.598-4.086c.49-.176.918.11.757.874z"/>
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
              ✓ {selectedContacts.length} Telegram contact{selectedContacts.length > 1 ? 's' : ''} selected
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TelegramContactSelector;
