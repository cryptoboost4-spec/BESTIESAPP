import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SocialShareCardsModal = ({ onClose }) => {
  const { userData, currentUser } = useAuth();
  const [selectedCard, setSelectedCard] = useState(0);
  const cardRef = useRef(null);

  // Dynamic share URL that shows custom card on social media
  const shareUrl = `https://bestiesapp.web.app/share?invite=${currentUser?.uid}`;
  // Direct app URL for copying
  const appUrl = `https://bestiesapp.web.app/?invite=${currentUser?.uid}`;

  const cardDesigns = [
    {
      id: 1,
      name: 'Classic Pink',
      bgGradient: 'linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%)',
      emoji: '💜',
      title: "Let's Be Safety Besties!",
      subtitle: `${userData?.displayName || 'Your friend'} wants you on their safety network`,
    },
    {
      id: 2,
      name: 'Ocean Blue',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      emoji: '🌊',
      title: 'Join My Safety Circle',
      subtitle: `${userData?.displayName || 'Your friend'} trusts you to be their safety bestie`,
    },
    {
      id: 3,
      name: 'Sunset Orange',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      emoji: '🌅',
      title: 'Stay Safe Together',
      subtitle: `${userData?.displayName || 'Your friend'} invited you to Besties`,
    },
    {
      id: 4,
      name: 'Forest Green',
      bgGradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
      emoji: '🌿',
      title: 'Safety Network Invite',
      subtitle: `Be a safety bestie for ${userData?.displayName || 'your friend'}`,
    },
    {
      id: 5,
      name: 'Lavender Dream',
      bgGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      emoji: '✨',
      title: 'Join Besties App',
      subtitle: `${userData?.displayName || 'Your friend'} wants to stay connected and safe`,
    },
    {
      id: 6,
      name: 'Bold Red',
      bgGradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      emoji: '❤️',
      title: 'Be My Safety Buddy',
      subtitle: `${userData?.displayName || 'Your friend'} needs you in their safety circle`,
    },
  ];

  const currentCard = cardDesigns[selectedCard];

  const handleCopyCard = async () => {
    const cardText = `${currentCard.emoji} ${currentCard.title}\n\n${currentCard.subtitle}\n\n${appUrl}`;

    try {
      await navigator.clipboard.writeText(cardText);
      toast.success('Card copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `${currentCard.emoji} *${currentCard.title}*\n\n${currentCard.subtitle}\n\n${shareUrl}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleShareFacebook = () => {
    const encoded = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${currentCard.emoji} ${currentCard.title}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareSMS = () => {
    const message = `${currentCard.emoji} ${currentCard.title}\n\n${currentCard.subtitle}\n\n${shareUrl}`;
    const encoded = encodeURIComponent(message);
    window.location.href = `sms:?body=${encoded}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-text-primary">Choose Your Card</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Card Preview */}
        <div className="mb-6">
          <div
            ref={cardRef}
            className="w-full rounded-2xl p-8 text-white text-center shadow-xl transition-all duration-300"
            style={{ background: currentCard.bgGradient }}
          >
            <div className="text-6xl mb-4">{currentCard.emoji}</div>
            <h3 className="font-display text-3xl mb-4">{currentCard.title}</h3>
            <p className="text-lg opacity-90 mb-6">{currentCard.subtitle}</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm font-semibold opacity-90 mb-1">Join at:</div>
              <div className="text-sm font-mono break-all">bestiesapp.web.app</div>
            </div>
          </div>
        </div>

        {/* Card Selector */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-text-secondary mb-3">Select a design:</div>
          <div className="grid grid-cols-3 gap-3">
            {cardDesigns.map((card, index) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(index)}
                className={`relative rounded-xl p-4 text-center transition-all ${
                  selectedCard === index
                    ? 'ring-4 ring-primary scale-105'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
                style={{ background: card.bgGradient }}
              >
                <div className="text-3xl mb-1">{card.emoji}</div>
                <div className="text-xs text-white font-semibold">{card.name}</div>
                {selectedCard === index && (
                  <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleShareWhatsApp}
            className="btn bg-[#25D366] text-white hover:bg-[#20BA5A] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          <button
            onClick={handleShareFacebook}
            className="btn bg-[#1877F2] text-white hover:bg-[#166FE5] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>

          <button
            onClick={handleShareTwitter}
            className="btn bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X (Twitter)
          </button>

          <button
            onClick={handleShareSMS}
            className="btn bg-success text-white hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            SMS
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyCard}
          className="w-full btn btn-primary"
        >
          📋 Copy Card & Link
        </button>
      </div>
    </div>
  );
};

export default SocialShareCardsModal;
