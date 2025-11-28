import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileWithBubble from '../ProfileWithBubble';
import SharePromptButtons from './SharePromptButtons';
import MessengerShareModal from './MessengerShareModal';
import { FEATURES } from '../../config/features';

const UnifiedContactSelector = ({
  besties,
  selectedBesties,
  setSelectedBesties,
  messengerContacts,
  selectedMessengerContacts,
  setSelectedMessengerContacts,
  userId
}) => {
  const navigate = useNavigate();
  const [expandedBestieShare, setExpandedBestieShare] = useState(null);
  const [showMessengerShareModal, setShowMessengerShareModal] = useState(false);

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

  // Get channel icons for a bestie
  const getChannelIcons = (bestie) => {
    const icons = [];

    // SMS (if has phone and SMS enabled)
    if (bestie.phone && bestie.smsEnabled) {
      icons.push(
        <span key="sms" className="text-xs" title="SMS alerts enabled">
          📱
        </span>
      );
    }

    // Email (if email notifications enabled)
    if (bestie.emailEnabled) {
      icons.push(
        <span key="email" className="text-xs" title="Email alerts enabled">
          📧
        </span>
      );
    }

    // Push (if push enabled)
    if (bestie.pushEnabled) {
      icons.push(
        <span key="push" className="text-xs" title="Push notifications enabled">
          🔔
        </span>
      );
    }

    return icons.length > 0 ? icons : null;
  };

  const totalSelected = selectedBesties.length + selectedMessengerContacts.length;

  if (besties.length === 0 && (!FEATURES.messengerAlerts || messengerContacts.length === 0)) {
    return (
      <div className="card p-6">
        <label className="block text-lg font-display text-text-primary mb-3">
          Who should we alert? 💜
        </label>
        <div className="text-center py-8 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
          <p className="font-semibold text-text-primary mb-2">⚠️ No emergency contacts</p>
          <p className="text-text-secondary text-sm mb-4">
            Add besties to your circle or connect Messenger contacts to create check-ins
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Add Besties
            </button>
            {FEATURES.messengerAlerts && (
              <button
                type="button"
                onClick={() => setShowMessengerShareModal(true)}
                className="btn btn-secondary"
              >
                Add from Messenger
              </button>
            )}
          </div>
        </div>
        {showMessengerShareModal && (
          <MessengerShareModal userId={userId} onClose={() => setShowMessengerShareModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-display text-text-primary">
          Who should we alert? 💜
        </label>
        {totalSelected > 0 && (
          <span className="text-sm text-text-secondary">
            {totalSelected} selected
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* SMS Besties */}
        {besties.map((bestie) => {
          const selectionIndex = selectedBesties.indexOf(bestie.id);
          const isSelected = selectionIndex !== -1;
          const selectionNumber = isSelected ? selectionIndex + 1 : null;
          const isShareExpanded = expandedBestieShare === bestie.id;
          const channelIcons = getChannelIcons(bestie);

          return (
            <div key={`bestie-${bestie.id}`} className="w-full">
              <button
                type="button"
                onClick={() => (bestie.phone && bestie.smsEnabled) && toggleBestie(bestie.id)}
                disabled={!bestie.phone || !bestie.smsEnabled}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  !bestie.phone || !bestie.smsEnabled
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">
                          {bestie.name || bestie.email || 'Unknown'}
                        </span>
                        {channelIcons && (
                          <div className="flex gap-1">
                            {channelIcons}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {!bestie.phone
                          ? '⚠️ No phone number'
                          : !bestie.smsEnabled
                          ? '⚠️ SMS alerts not enabled'
                          : bestie.email || bestie.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(!bestie.phone || !bestie.smsEnabled) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedBestieShare(isShareExpanded ? null : bestie.id);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        {!bestie.phone ? 'Ask to Add' : 'Ask to Enable'}
                      </button>
                    )}

                    {(bestie.phone && bestie.smsEnabled) && (
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {isShareExpanded && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-text-secondary mb-2">
                    Share a message asking them to {!bestie.phone ? 'add their phone number' : 'enable SMS alerts in Settings'}:
                  </p>
                  <SharePromptButtons bestie={bestie} />
                </div>
              )}
            </div>
          );
        })}

        {/* Messenger Contacts */}
        {FEATURES.messengerAlerts && messengerContacts.map((contact) => {
          const isSelected = selectedMessengerContacts.includes(contact.id);

          return (
            <button
              key={`messenger-${contact.id}`}
              type="button"
              onClick={() => toggleMessengerContact(contact.id)}
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary truncate">
                      {contact.name}
                    </span>
                    <span className="text-xs" title="Messenger alerts enabled">
                      💬
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    Messenger contact
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

      {/* Add from Messenger button */}
      {FEATURES.messengerAlerts && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {messengerContacts.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowMessengerShareModal(true)}
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add more from Messenger
            </button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p className="font-semibold text-text-primary mb-2">Add Emergency Contacts via Messenger</p>
                <p className="text-text-secondary text-sm mb-4">
                  Free & unlimited! No 5-person SMS limit. Share your link and they'll be connected for 20 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setShowMessengerShareModal(true)}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2zm.972 12.413l-2.562-2.732-5.002 2.732 5.502-5.838 2.623 2.732 4.941-2.732-5.502 5.838z"/>
                  </svg>
                  Add from Messenger
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showMessengerShareModal && (
        <MessengerShareModal userId={userId} onClose={() => setShowMessengerShareModal(false)} />
      )}
    </div>
  );
};

export default UnifiedContactSelector;
