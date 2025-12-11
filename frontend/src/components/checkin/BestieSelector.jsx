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
  const [showNoContactBesties, setShowNoContactBesties] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter active messenger contacts
  // Handle null case (not loaded yet) - treat as empty array
  // Also filter out pending contacts (those without names - waiting for profile fetch)
  const now = Date.now();
  const activeMessengerContacts = (messengerContacts || []).filter(
    contact => {
      const isActive = contact.expiresAt?.toMillis() > now;
      const hasName = contact.name && contact.name.trim() !== '';
      return isActive && hasName; // Only show contacts that are active AND have a real name
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
                          <img src={contact.photoURL} alt={contact.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
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

          {/* Add more messenger besties section */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={copyMessengerLink}
              className={`w-full py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                copied
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {copied ? (
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
            
            {/* Pink Messenger and WhatsApp share buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => shareMessengerLink('messenger')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#E91E63] hover:bg-[#C2185B] text-white transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                </svg>
                <span className="text-sm">Messenger</span>
              </button>
              <button
                type="button"
                onClick={() => shareMessengerLink('whatsapp')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#E91E63] hover:bg-[#C2185B] text-white transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-sm">WhatsApp</span>
              </button>
            </div>
          </div>
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
          {/* Besties with contact methods - shown first */}
          {bestiesWithContact.map((bestie) => {
            const selectionIndex = selectedBesties.indexOf(bestie.id);
            const isSelected = selectionIndex !== -1;
            const selectionNumber = isSelected ? selectionIndex + 1 : null;

            return (
              <button
                key={bestie.id}
                type="button"
                onClick={() => toggleBestie(bestie.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
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
                        {bestie.phone && bestie.smsEnabled
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
