import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import '../styles/AddBestieModal.css';

const AddBestieModal = ({ onClose, onSuccess }) => {
  const { currentUser, userData } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);

  const shareUrl = `https://bestiesapp.web.app/?invite=${currentUser?.uid}`;
  const shareMessage = `Hey! ${userData?.displayName || 'Your friend'} wants you to be their safety bestie on Besties! 💜 Join them and help keep each other safe: ${shareUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Besties!',
          text: shareMessage,
          url: shareUrl,
        });

        // Show celebration
        setShowCelebration(true);
        toast.success('Thanks for inviting your bestie! 💜');

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } catch (error) {
        // User cancelled - that's okay!
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          toast.error('Sharing failed. Try copy link instead!');
        }
      }
    } else {
      // Fallback: just copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareMessage);
    toast.success('Link copied! Now paste it to your bestie! 💕');
    setShowCelebration(true);

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 2000);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    // Try to open in WhatsApp app first
    window.location.href = `whatsapp://send?text=${encoded}`;

    // Fallback to web WhatsApp if app doesn't open
    setTimeout(() => {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }, 1000);

    setShowCelebration(true);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);
  };

  const handleFacebookShare = () => {
    const encoded = encodeURIComponent(shareUrl);
    // Try to open in Facebook app first, fallback to web
    const fbAppUrl = `fb://facewebmodal/f?href=${encoded}`;
    window.location.href = fbAppUrl;

    // Fallback to web if app doesn't open
    setTimeout(() => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
    }, 1000);

    setShowCelebration(true);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);
  };

  const handleMessengerShare = () => {
    const encoded = encodeURIComponent(shareUrl);
    // Try to open in Messenger app first
    window.location.href = `fb-messenger://share?link=${encoded}`;

    // Fallback to web messenger
    setTimeout(() => {
      window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=YOUR_APP_ID&redirect_uri=${window.location.origin}`, '_blank');
    }, 1000);

    setShowCelebration(true);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);
  };

  const handleSMSShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.location.href = `sms:?body=${encoded}`;
    setShowCelebration(true);

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);
  };

  if (showCelebration) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content celebration-modal" onClick={(e) => e.stopPropagation()}>
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <h2 className="celebration-title">Amazing!</h2>
            <p className="celebration-text">
              You're building your safety network! Every bestie you add makes both of you safer. 💜
            </p>
            <div className="celebration-encouragement">
              <p className="font-semibold text-primary dark:text-purple-400">Keep going! Invite more besties:</p>
              <p className="text-sm text-text-secondary dark:text-gray-300 mt-2">
                The more people in your circle, the safer everyone is.
                Your besties will thank you! ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invite-header">
          <div className="invite-icon">👯‍♀️</div>
          <h2 className="invite-title">Invite Your Bestie</h2>
          <p className="invite-subtitle">
            You're making such a smart choice! Adding besties means you'll both be safer when you're out. 💕
          </p>
        </div>

        {/* Bestie Circle Importance */}
        <div className="invite-encouragement-box">
          <p className="text-sm font-semibold text-primary dark:text-purple-400 mb-2">
            💜 Complete Your Bestie Circle
          </p>
          <p className="text-sm text-text-secondary dark:text-gray-300">
            Your safety network gets stronger with every bestie you add. Having 3-5 trusted friends means:
          </p>
          <ul className="invite-benefits">
            <li>✓ Someone's always available when you need help</li>
            <li>✓ Faster response times in emergencies</li>
            <li>✓ You all watch out for each other - true sisterhood! 💕</li>
          </ul>
        </div>

        {/* Native Share Button (Primary) */}
        <button
          onClick={handleNativeShare}
          className="share-button primary-share"
        >
          <span className="share-icon">🎉</span>
          <div className="share-button-content">
            <div className="share-button-title">Share Invite</div>
            <div className="share-button-subtitle">Choose any app to send</div>
          </div>
        </button>

        {/* Or Divider */}
        <div className="share-divider">
          <span>OR SHARE VIA</span>
        </div>

        {/* Share Options Grid */}
        <div className="share-options-grid">
          <button
            onClick={handleWhatsAppShare}
            className="share-option whatsapp"
          >
            <span className="share-option-emoji">💬</span>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleMessengerShare}
            className="share-option messenger"
          >
            <span className="share-option-emoji">💬</span>
            <span>Messenger</span>
          </button>

          <button
            onClick={handleSMSShare}
            className="share-option sms"
          >
            <span className="share-option-emoji">📱</span>
            <span>Text</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className="share-option facebook"
          >
            <span className="share-option-emoji">📘</span>
            <span>Facebook</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="share-option copy"
          >
            <span className="share-option-emoji">📋</span>
            <span>Copy Link</span>
          </button>
        </div>

        {/* Footer Encouragement */}
        <div className="invite-footer">
          <p className="text-xs text-text-secondary dark:text-gray-400">
            💜 Your besties will appreciate you looking out for them!
          </p>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="modal-close-button">
          ✕
        </button>
      </div>
    </div>
  );
};

export default AddBestieModal;
