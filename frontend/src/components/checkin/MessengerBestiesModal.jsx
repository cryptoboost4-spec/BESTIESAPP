import React, { useState } from 'react';
import { MESSENGER_CONFIG } from '../../config/messenger';
import InfoButton from '../InfoButton';
import haptic from '../../utils/hapticFeedback';
import toast from 'react-hot-toast';

const MessengerBestiesModal = ({
  isOpen,
  onClose,
  activeMessengerContacts = [],
  selectedMessengerContacts = [],
  setSelectedMessengerContacts = () => {},
  userId,
  copyMessengerLink,
  shareMessengerLink
}) => {
  const [localCopied, setLocalCopied] = useState(false);

  if (!isOpen) return null;

  const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const remaining = expiresAt?.toMillis() - now;
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const toggleMessengerContact = (contactId) => {
    haptic.light();
    if (selectedMessengerContacts.includes(contactId)) {
      setSelectedMessengerContacts(selectedMessengerContacts.filter(id => id !== contactId));
    } else {
      setSelectedMessengerContacts([...selectedMessengerContacts, contactId]);
    }
  };

  const handleCopyLink = () => {
    if (copyMessengerLink) {
      copyMessengerLink();
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    } else {
      const link = MESSENGER_CONFIG.getLinkForUser(userId);
      navigator.clipboard.writeText(link);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
      toast.success('Link copied!');
    }
  };

  const handleShare = (platform) => {
    if (shareMessengerLink) {
      shareMessengerLink(platform);
    } else {
      const link = MESSENGER_CONFIG.getLinkForUser(userId);
      const message = `Hey! Can you please click this link to be added as my emergency contact on Besties? ❤️\n\n${link}`;
      const encoded = encodeURIComponent(message);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (platform === 'whatsapp') {
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${encoded}`;
        } else {
          window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }
        toast.success('Opening WhatsApp...');
      } else if (platform === 'messenger') {
        if (isMobile) {
          window.location.href = `fb-messenger://share?link=${encodeURIComponent(link)}`;
          setTimeout(() => {
            window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank');
          }, 1500);
        } else {
          window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank', 'width=600,height=400');
        }
        toast.success('Opening Messenger...');
      }
    }
  };

  const tooltipMessage = "Messenger Besties are free & unlimited! Share your link → They message you → Auto-connected for 20hrs to receive alerts. Benefits: No SMS costs, unlimited contacts, easy to add, auto-expires for privacy.";

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      style={{ paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom) + 80px))' }}
    >
      <div 
        className="card max-w-lg w-full p-0 animate-scale-up overflow-hidden relative bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-600 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="text-center">
            <div className="text-4xl mb-2">💬</div>
            <h2 className="text-2xl font-display text-text-primary mb-2 flex items-center justify-center gap-2">
              Messenger Besties
              <InfoButton message={tooltipMessage} />
            </h2>
            <p className="text-sm text-text-secondary">
              Free & unlimited emergency alerts
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Visual Flow Explanation */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="text-center mb-3">
              <p className="text-sm font-semibold text-text-primary mb-2">How it works:</p>
              <p className="text-xs text-text-secondary mb-4">
                Share your Messenger link with friends. When they click and send you any message, they're automatically connected for 20 hours to receive your check-in alerts. It's completely free and unlimited!
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  1
                </div>
                <p className="text-xs font-medium text-text-primary text-center">Give your link to a friend</p>
              </div>
              <div className="flex-shrink-0 text-blue-500 dark:text-blue-400 text-2xl font-bold">
                →
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  2
                </div>
                <p className="text-xs font-medium text-text-primary text-center">They message us</p>
              </div>
              <div className="flex-shrink-0 text-blue-500 dark:text-blue-400 text-2xl font-bold">
                →
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                  3
                </div>
                <p className="text-xs font-medium text-text-primary text-center">Auto-connected for 20hrs</p>
              </div>
            </div>
          </div>

          {activeMessengerContacts.length === 0 ? (
            // Empty state - show only add button
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-6 text-center">
                <p className="text-sm text-text-secondary mb-4">
                  Share your Messenger link to connect besties for free alerts!
                </p>
                
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                    localCopied
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {localCopied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>➕ Add messenger besties</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Has contacts - show list with selection
            <div className="space-y-4">
              <div className="space-y-2 mb-4">
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
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {contact.photoURL ? (
                            <img 
                              src={contact.photoURL} 
                              alt={contact.name} 
                              className="w-10 h-10 rounded-full object-cover" 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {contact.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary truncate">{contact.name}</div>
                          {timeRemaining && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">{timeRemaining}</div>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
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

              {/* Add more button */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                    localCopied
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {localCopied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>➕ Add more messenger besties</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerBestiesModal;

