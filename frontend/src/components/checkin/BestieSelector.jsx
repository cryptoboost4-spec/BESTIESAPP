import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileWithBubble from '../ProfileWithBubble';
import SharePromptButtons from './SharePromptButtons';
import { MESSENGER_CONFIG } from '../../config/messenger';

const BestieSelector = ({ 
  besties, 
  selectedBesties, 
  setSelectedBesties,
  messengerContacts = [],
  selectedMessengerContacts = [],
  setSelectedMessengerContacts = () => {},
  userId,
  showMessenger = true
}) => {
  const navigate = useNavigate();
  const [expandedBestieShare, setExpandedBestieShare] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter active messenger contacts
  const now = Date.now();
  const activeMessengerContacts = messengerContacts.filter(
    contact => contact.expiresAt?.toMillis() > now
  );

  // Auto-select new messenger contacts
  useEffect(() => {
    if (activeMessengerContacts.length > 0 && setSelectedMessengerContacts) {
      const allContactIds = activeMessengerContacts.map(c => c.id);
      // Auto-select all messenger contacts that aren't already selected
      const newSelections = allContactIds.filter(id => !selectedMessengerContacts.includes(id));
      if (newSelections.length > 0) {
        setSelectedMessengerContacts([...selectedMessengerContacts, ...newSelections]);
      }
    }
  }, [activeMessengerContacts.length]); // Only run when count changes

  const toggleBestie = (bestieId) => {
    if (selectedBesties.includes(bestieId)) {
      setSelectedBesties(selectedBesties.filter(id => id !== bestieId));
    } else {
      if (selectedBesties.length >= 5) {
        toast.error('Maximum 5 SMS besties per check-in');
        return;
      }
      setSelectedBesties([...selectedBesties, bestieId]);
    }
  };

  const toggleMessengerContact = (contactId) => {
    if (selectedMessengerContacts.includes(contactId)) {
      setSelectedMessengerContacts(selectedMessengerContacts.filter(id => id !== contactId));
    } else {
      setSelectedMessengerContacts([...selectedMessengerContacts, contactId]);
    }
  };

  // Check if bestie has ANY contact method
  const hasContactMethod = (bestie) => {
    return (bestie.phone && bestie.smsEnabled) || 
           bestie.telegramChatId || 
           bestie.notificationPreferences?.telegram ||
           bestie.notificationPreferences?.push;
  };

  const getTimeRemaining = (expiresAt) => {
    const remaining = expiresAt?.toMillis() - now;
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const copyMessengerLink = () => {
    const link = MESSENGER_CONFIG.getLinkForUser(userId);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <div className="card p-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        Who should we alert? 💜
      </label>

      {/* Messenger Contacts Section */}
      {showMessenger && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              💬 Messenger Contacts
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                Free & Unlimited
              </span>
            </span>
          </div>

          {activeMessengerContacts.length > 0 ? (
            <div className="space-y-2 mb-3">
              {activeMessengerContacts.map((contact) => {
                const isSelected = selectedMessengerContacts.includes(contact.id);
                const timeRemaining = getTimeRemaining(contact.expiresAt);

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleMessengerContact(contact.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {contact.photoURL ? (
                          <img src={contact.photoURL} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {contact.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary truncate">{contact.name}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">{timeRemaining}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-3 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">No messenger contacts connected yet</p>
            </div>
          )}

          {/* Add more messenger besties link */}
          <button
            type="button"
            onClick={copyMessengerLink}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
          >
            {copied ? '✓ Copied!' : '➕ Add more messenger besties'}
          </button>
        </div>
      )}

      {/* Divider */}
      {showMessenger && besties.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      )}

      {/* Circle Besties Section */}
      <div className="mb-2">
        <span className="text-sm font-semibold text-text-secondary">👥 Circle Besties (max 5)</span>
      </div>

      {besties.length === 0 ? (
        <div className="text-center py-6 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
          <p className="font-semibold text-text-primary mb-2">⚠️ No besties in your circle</p>
          <p className="text-text-secondary text-sm mb-4">Add besties to your bestie circle on the home page to create check-ins</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go to Home Page
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {besties.map((bestie) => {
            const selectionIndex = selectedBesties.indexOf(bestie.id);
            const isSelected = selectionIndex !== -1;
            const selectionNumber = isSelected ? selectionIndex + 1 : null;
            const isShareExpanded = expandedBestieShare === bestie.id;
            const canSelect = hasContactMethod(bestie);

            return (
              <div key={bestie.id} className="w-full">
                <button
                  type="button"
                  onClick={() => canSelect && toggleBestie(bestie.id)}
                  disabled={!canSelect}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    !canSelect
                      ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 opacity-60'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ProfileWithBubble
                        photoURL={bestie.photoURL}
                        name={bestie.name || bestie.email || 'Unknown'}
                        requestAttention={bestie.requestAttention}
                        size="md"
                        showBubble={true}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary">{bestie.name || bestie.email || 'Unknown'}</div>
                        <div className="text-sm text-text-secondary">
                          {!canSelect
                            ? '⚠️ No contact method available'
                            : bestie.phone && bestie.smsEnabled
                            ? bestie.email || bestie.phone
                            : bestie.telegramChatId
                            ? '📱 Telegram enabled'
                            : 'Push notifications enabled'}
                        </div>
                      </div>
                    </div>
                    {canSelect ? (
                      isSelected && (
                        <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                          {selectionNumber}/5
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedBestieShare(isShareExpanded ? null : bestie.id);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Ask to Add
                      </button>
                    )}
                  </div>
                </button>

                {/* Social Share Menu for No Contact Method */}
                {!canSelect && isShareExpanded && (
                  <SharePromptButtons
                    bestieName={bestie.name}
                    onClose={() => setExpandedBestieShare(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-sm text-primary font-semibold">
        Selected: {selectedBesties.length}/5 SMS • {selectedMessengerContacts.length} Messenger
      </div>
    </div>
  );
};

export default BestieSelector;
