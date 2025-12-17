import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileWithBubble from '../ProfileWithBubble';
import SharePromptButtons from './SharePromptButtons';
import MessengerBestiesModal from './MessengerBestiesModal';
import { MESSENGER_CONFIG } from '../../config/messenger';
import haptic from '../../utils/hapticFeedback';
import { isMockBestie } from '../../utils/mockBestie';

const BestieSelector = ({ 
  besties, 
  selectedBesties, 
  setSelectedBesties,
  messengerContacts = [],
  selectedMessengerContacts = [],
  setSelectedMessengerContacts = () => {},
  userId,
  showMessenger = true,
  isTutorial = false
}) => {
  const navigate = useNavigate();
  const [expandedBestieShare, setExpandedBestieShare] = useState(null);
  const [showNoContactBesties, setShowNoContactBesties] = useState(false);
  // Removed unused copied state
  const [showMessengerModal, setShowMessengerModal] = useState(false);

  // Filter active messenger contacts
  // Handle null case (not loaded yet) - treat as empty array
  // Filter out expired contacts, contacts awaiting confirmation, and declined contacts
  const now = Date.now();
  const activeMessengerContacts = (messengerContacts || []).filter(
    contact => {
      const isActive = contact.expiresAt?.toMillis() > now;
      const hasName = contact.name && contact.name.trim() !== '';
      const isConfirmed = !contact.awaitingConfirmation; // Exclude contacts awaiting confirmation
      const notDeclined = !contact.declined; // Exclude declined contacts
      return isActive && hasName && isConfirmed && notDeclined; // Only show active, confirmed, non-declined contacts with names
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessengerContacts.length]); // Only run when count changes

  const toggleBestie = (bestieId) => {
    haptic.light();
    if (selectedBesties.includes(bestieId)) {
      setSelectedBesties(selectedBesties.filter(id => id !== bestieId));
    } else {
      if (selectedBesties.length >= 5) {
        haptic.error();
        toast.error('Maximum 5 SMS besties per check-in');
        return;
      }
      haptic.success();
      setSelectedBesties([...selectedBesties, bestieId]);
    }
  };

  // Removed unused toggleMessengerContact function

  // Check if bestie has ANY contact method
  const hasContactMethod = (bestie) => {
    const hasPhone = bestie.phone && bestie.smsEnabled;
    const hasTelegram = bestie.telegramChatId || bestie.notificationPreferences?.telegram;
    const hasPush = bestie.notificationPreferences?.push;
    const result = hasPhone || hasTelegram || hasPush;
    
    // Debug logging for telegram-enabled besties
    if (bestie.telegramChatId || bestie.notificationPreferences?.telegram) {
      console.log('Telegram bestie check:', {
        name: bestie.name,
        telegramChatId: bestie.telegramChatId,
        notificationPreferences: bestie.notificationPreferences,
        hasContactMethod: result
      });
    }
    
    return result;
  };

  // Removed unused getTimeRemaining function

  const copyMessengerLink = () => {
    const link = MESSENGER_CONFIG.getLinkForUser(userId);
    navigator.clipboard.writeText(link);
    // Removed unused copied state updates
    toast.success('Link copied!');
  };

  const shareMessengerLink = (platform) => {
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
  };

  // Separate besties into those with and without contact methods
  const bestiesWithContact = besties.filter(bestie => hasContactMethod(bestie));
  const bestiesWithoutContact = besties.filter(bestie => !hasContactMethod(bestie));

  return (
    <div className="card p-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        Who should we alert? 💜
      </label>

      {/* Messenger Contacts Section */}
      {showMessenger && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setShowMessengerModal(true);
            }}
            className="w-full py-3 px-4 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <span>➕ Add messenger besties</span>
            {selectedMessengerContacts.length > 0 && (
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                {selectedMessengerContacts.length} selected
              </span>
            )}
          </button>
        </div>
      )}

      {/* Messenger Besties Modal */}
      {showMessenger && (
        <MessengerBestiesModal
          isOpen={showMessengerModal}
          onClose={() => setShowMessengerModal(false)}
          activeMessengerContacts={activeMessengerContacts}
          selectedMessengerContacts={selectedMessengerContacts}
          setSelectedMessengerContacts={setSelectedMessengerContacts}
          userId={userId}
          copyMessengerLink={copyMessengerLink}
          shareMessengerLink={shareMessengerLink}
        />
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
        <div className="space-y-2">
          {/* Fake bestie card for tutorial - looks like a real bestie */}
          <button
            type="button"
            onClick={() => {
              // Use a special ID for the fake bestie
              const fakeBestieId = 'TUTORIAL_FAKE_BESTIE';
              if (selectedBesties.includes(fakeBestieId)) {
                setSelectedBesties(selectedBesties.filter(id => id !== fakeBestieId));
              } else {
                if (selectedBesties.length >= 5) {
                  haptic.error();
                  toast.error('Maximum 5 besties per check-in');
                  return;
                }
                haptic.success();
                setSelectedBesties([...selectedBesties, fakeBestieId]);
              }
            }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              selectedBesties.includes('TUTORIAL_FAKE_BESTIE')
                ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                : 'border-dashed border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 hover:scale-[1.01] active:scale-[0.99]'
            }`}
            aria-label="Select tutorial bestie"
            aria-pressed={selectedBesties.includes('TUTORIAL_FAKE_BESTIE')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💜</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-text-primary">Demo Bestie</div>
                    <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
                      🎓 DEMO
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    Practice bestie for tutorial
                  </div>
                </div>
              </div>
              {selectedBesties.includes('TUTORIAL_FAKE_BESTIE') && (
                <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                  {selectedBesties.indexOf('TUTORIAL_FAKE_BESTIE') + 1}/5
                </div>
              )}
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Tutorial info card - styled like a bestie card */}
          {isTutorial && (
            <div className="w-full p-4 rounded-xl border-2 border-dashed border-purple-400 bg-purple-50/50 dark:bg-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💜</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-text-primary text-sm">Tutorial</div>
                    <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
                      INFO
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    Select the demo bestie if available, or continue without a bestie. After the tutorial, add real besties on the home page.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Besties with contact methods - shown first */}
          {bestiesWithContact.map((bestie) => {
            const selectionIndex = selectedBesties.indexOf(bestie.id);
            const isSelected = selectionIndex !== -1;
            const selectionNumber = isSelected ? selectionIndex + 1 : null;
            const isMock = isMockBestie(bestie);

            return (
              <button
                key={bestie.id}
                type="button"
                onClick={() => toggleBestie(bestie.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.01] active:scale-[0.99]'
                } ${isMock ? 'border-dashed border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${bestie.name || 'bestie'}`}
                aria-pressed={isSelected}
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
                        <div className="font-semibold text-text-primary">{bestie.name || bestie.email || 'Unknown'}</div>
                        {isMock && (
                          <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
                            🎓 DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {isMock 
                          ? 'Practice bestie for tutorial'
                          : bestie.phone && bestie.smsEnabled
                          ? bestie.email || bestie.phone
                          : bestie.telegramChatId
                          ? '📱 Telegram enabled'
                          : 'Push notifications enabled'}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                      {selectionNumber}/5
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Besties without contact methods - merged together */}
          {bestiesWithoutContact.length > 0 && (
            <div className="w-full">
              <div className="p-4 rounded-xl border-2 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <div className="font-semibold text-text-primary">
                        {bestiesWithoutContact.length} bestie{bestiesWithoutContact.length !== 1 ? 's' : ''} have no contact method available
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        Ask them to add their phone number or enable notifications
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoContactBesties(!showNoContactBesties)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors font-semibold"
                  >
                    {showNoContactBesties ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showNoContactBesties && (
                  <div className="space-y-2 mt-3">
                    {bestiesWithoutContact.map((bestie) => (
                      <div key={bestie.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <ProfileWithBubble
                          photoURL={bestie.photoURL}
                          name={bestie.name || bestie.email || 'Unknown'}
                          requestAttention={bestie.requestAttention}
                          size="sm"
                          showBubble={true}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-text-primary">{bestie.name || bestie.email || 'Unknown'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedBestieShare(expandedBestieShare === bestie.id ? null : bestie.id);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors font-semibold"
                        >
                          Ask to Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Social Share Menu - shown when any bestie's "Ask to Add" is clicked */}
                {expandedBestieShare && bestiesWithoutContact.some(b => b.id === expandedBestieShare) && (
                  <div className="mt-3">
                    <SharePromptButtons
                      bestieName={bestiesWithoutContact.find(b => b.id === expandedBestieShare)?.name || 'Bestie'}
                      onClose={() => setExpandedBestieShare(null)}
                      messageType="circle"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-sm text-primary font-semibold">
        Selected: {selectedBesties.length}/5 SMS • {selectedMessengerContacts.length} Messenger
      </div>
    </div>
  );
};

export default BestieSelector;
