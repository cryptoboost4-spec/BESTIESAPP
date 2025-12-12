import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FaWhatsapp, 
  FaFacebook, 
  FaFacebookMessenger, 
  FaSms, 
  FaTwitter, 
  FaEnvelope, 
  FaCopy,
  FaShare
} from 'react-icons/fa';
import '../styles/AddBestieModal.css';

const AddBestieModal = ({ onClose, onSuccess = () => {} }) => {
  const { currentUser, userData } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLaterMessage, setShowLaterMessage] = useState(false);
  const [shareButtonDisabled, setShareButtonDisabled] = useState({});
  const [hasNativeShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);

  // Optimized share message for mobile (shorter, fits better)
  const shareUrl = `https://bestiesapp.web.app/?invite=${currentUser?.uid}`;
  const shareMessage = `${userData?.displayName || 'Your friend'} wants you to be their safety bestie on Besties! 💜 Join: ${shareUrl}`;

  const handleNativeShare = async () => {
    if (!hasNativeShare) {
      handleCopyLink();
      return;
    }

    setShareButtonDisabled({ native: true });
    
    try {
      await navigator.share({
        title: 'Join me on Besties!',
        text: shareMessage,
        url: shareUrl,
      });

      setShowCelebration(true);
      toast.success('Thanks for inviting your bestie! 💜');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      setShareButtonDisabled({ native: false });
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Sharing failed. Try copy link instead!');
      }
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(shareMessage);
      toast.success('Link copied! Now paste it to your bestie! 💕');
      setShowCelebration(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Copy failed. Try selecting the text manually.');
    }
  };

  const handleWhatsAppShare = () => {
    setShareButtonDisabled({ whatsapp: true });
    toast.loading('Opening WhatsApp...', { id: 'whatsapp-share' });
    
    const encoded = encodeURIComponent(shareMessage);
    const startTime = Date.now();
    
    try {
      // Try app first
      window.location.href = `whatsapp://send?text=${encoded}`;
      
      // Check if app opened (if still on page after 2 seconds, open web)
      setTimeout(() => {
        if (Date.now() - startTime > 2000 && document.hasFocus()) {
          toast.dismiss('whatsapp-share');
          window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }
        setShareButtonDisabled({ whatsapp: false });
      }, 2000);

      setShowCelebration(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      toast.error('Failed to open WhatsApp. Try web version.');
      setShareButtonDisabled({ whatsapp: false });
    }
  };

  const handleFacebookShare = () => {
    setShareButtonDisabled({ facebook: true });
    
    try {
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedMessage = encodeURIComponent(shareMessage);
      const shareWindow = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`, '_blank');
      
      if (!shareWindow) {
        toast.error('Popup blocked. Please allow popups and try again.');
        setShareButtonDisabled({ facebook: false });
        return;
      }
      
      setShowCelebration(true);
      setTimeout(() => {
        setShareButtonDisabled({ facebook: false });
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Facebook share failed:', error);
      toast.error('Failed to open Facebook.');
      setShareButtonDisabled({ facebook: false });
    }
  };

  const handleMessengerShare = () => {
    setShareButtonDisabled({ messenger: true });
    toast.loading('Opening Messenger...', { id: 'messenger-share' });
    
    const encoded = encodeURIComponent(shareUrl);
    const startTime = Date.now();
    
    try {
      // Try app first
      window.location.href = `fb-messenger://share?link=${encoded}`;
      
      // Fallback to web if app doesn't open
      setTimeout(() => {
        if (Date.now() - startTime > 2000 && document.hasFocus()) {
          toast.dismiss('messenger-share');
          window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank');
        }
        setShareButtonDisabled({ messenger: false });
      }, 2000);

      setShowCelebration(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Messenger share failed:', error);
      toast.error('Failed to open Messenger.');
      setShareButtonDisabled({ messenger: false });
    }
  };

  const handleSMSShare = () => {
    setShareButtonDisabled({ sms: true });
    
    try {
      const encoded = encodeURIComponent(shareMessage);
      window.location.href = `sms:?body=${encoded}`;
      
      setShowCelebration(true);
      setTimeout(() => {
        setShareButtonDisabled({ sms: false });
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('SMS share failed:', error);
      toast.error('Failed to open SMS. Try copying the link instead.');
      setShareButtonDisabled({ sms: false });
    }
  };

  const handleEmailShare = () => {
    setShareButtonDisabled({ email: true });
    
    try {
      const subject = encodeURIComponent('Join me on Besties!');
      const body = encodeURIComponent(shareMessage);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
      setShowCelebration(true);
      setTimeout(() => {
        setShareButtonDisabled({ email: false });
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Email share failed:', error);
      toast.error('Failed to open email. Try copying the link instead.');
      setShareButtonDisabled({ email: false });
    }
  };

  const handleTwitterShare = () => {
    setShareButtonDisabled({ twitter: true });
    
    try {
      const text = encodeURIComponent(`Join me on Besties - your safety network! ${shareUrl}`);
      const shareWindow = window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
      
      if (!shareWindow) {
        toast.error('Popup blocked. Please allow popups and try again.');
        setShareButtonDisabled({ twitter: false });
        return;
      }
      
      setShowCelebration(true);
      setTimeout(() => {
        setShareButtonDisabled({ twitter: false });
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Twitter share failed:', error);
      toast.error('Failed to open Twitter.');
      setShareButtonDisabled({ twitter: false });
    }
  };

  const handleDoItLater = () => {
    setShowLaterMessage(true);
  };

  if (showLaterMessage) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content later-message-modal" onClick={(e) => e.stopPropagation()}>
          <div className="later-message-content">
            <div className="later-message-icon">💜</div>
            <h2 className="later-message-title">No Problem!</h2>
            <p className="later-message-text">
              You can try a <strong>test check-in</strong> without a bestie to see how it works.
            </p>
            <p className="later-message-text">
              But to make a <strong>real check-in</strong>, you'll need to add at least one bestie first.
            </p>
            <button
              onClick={onClose}
              className="later-message-button"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCelebration) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content celebration-modal" onClick={(e) => e.stopPropagation()}>
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <h2 className="celebration-title">Amazing!</h2>
            <p className="celebration-text">
              You're building your safety network! 💜
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header - Compact */}
        <div className="invite-header">
          <div className="invite-icon">👯‍♀️</div>
          <h2 className="invite-title">Invite Your Bestie</h2>
          <p className="invite-subtitle">
            Share with someone you trust to keep you safe
          </p>
        </div>

        {/* Native Share Button (Primary) - Only show if available */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            disabled={shareButtonDisabled.native}
            className="share-button primary-share"
          >
            <FaShare className="share-icon-svg" />
            <div className="share-button-content">
              <div className="share-button-title">Share Invite</div>
              <div className="share-button-subtitle">Choose any app</div>
            </div>
          </button>
        )}

        {/* Or Divider */}
        <div className="share-divider">
          <span>OR SHARE VIA</span>
        </div>

        {/* Share Options Grid - Compact */}
        <div className="share-options-grid">
          <button
            onClick={handleWhatsAppShare}
            disabled={shareButtonDisabled.whatsapp}
            className="share-option whatsapp"
            aria-label="Share via WhatsApp"
          >
            <FaWhatsapp className="share-option-icon" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleMessengerShare}
            disabled={shareButtonDisabled.messenger}
            className="share-option messenger"
            aria-label="Share via Messenger"
          >
            <FaFacebookMessenger className="share-option-icon" />
            <span>Messenger</span>
          </button>

          <button
            onClick={handleSMSShare}
            disabled={shareButtonDisabled.sms}
            className="share-option sms"
            aria-label="Share via SMS"
          >
            <FaSms className="share-option-icon" />
            <span>Text</span>
          </button>

          <button
            onClick={handleFacebookShare}
            disabled={shareButtonDisabled.facebook}
            className="share-option facebook"
            aria-label="Share via Facebook"
          >
            <FaFacebook className="share-option-icon" />
            <span>Facebook</span>
          </button>

          <button
            onClick={handleTwitterShare}
            disabled={shareButtonDisabled.twitter}
            className="share-option twitter"
            aria-label="Share via Twitter"
          >
            <FaTwitter className="share-option-icon" />
            <span>Twitter</span>
          </button>

          <button
            onClick={handleEmailShare}
            disabled={shareButtonDisabled.email}
            className="share-option email"
            aria-label="Share via Email"
          >
            <FaEnvelope className="share-option-icon" />
            <span>Email</span>
          </button>

          <button
            onClick={handleCopyLink}
            disabled={shareButtonDisabled.copy}
            className="share-option copy"
            aria-label="Copy link"
          >
            <FaCopy className="share-option-icon" />
            <span>Copy Link</span>
          </button>
        </div>

        {/* Do It Later Button */}
        <button
          onClick={handleDoItLater}
          className="do-it-later-button"
        >
          Do it later
        </button>

        {/* Close Button */}
        <button onClick={onClose} className="modal-close-button" aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
};

export default AddBestieModal;
