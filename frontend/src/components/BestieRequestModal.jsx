import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const CARD_TEMPLATES = [
  {
    id: 'safety-squad',
    name: 'Safety Squad',
    emoji: '🛡️',
    defaultMessage: 'Join my safety squad! Be my Bestie and help me stay safe 💜',
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'bestie-circle',
    name: 'Bestie Circle',
    emoji: '💜',
    defaultMessage: 'Hey! Want to be part of my Bestie circle? Let\'s look out for each other! 🤗',
    bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'emergency-contact',
    name: 'Emergency Contact',
    emoji: '⚡',
    defaultMessage: 'I trust you! Will you be my emergency contact on Besties? 💫',
    bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'stay-safe',
    name: 'Stay Safe Together',
    emoji: '🌟',
    defaultMessage: 'Let\'s keep each other safe! Join me on the Besties app 🫶',
    bgGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: 'safety-net',
    name: 'Safety Net',
    emoji: '🦋',
    defaultMessage: 'Be part of my safety net! I\'d love to have you as my Bestie 💕',
    bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'guardian-angel',
    name: 'Guardian Angel',
    emoji: '👼',
    defaultMessage: 'Will you be my guardian angel? Join my Besties safety network! ✨',
    bgGradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  },
];

const BestieRequestModal = ({ onClose }) => {
  const { userData, currentUser } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(CARD_TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState(CARD_TEMPLATES[0].defaultMessage);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const cardRef = useRef(null);

  const shareUrl = `${window.location.origin}/user/${currentUser?.uid}`;

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    setCustomMessage(template.defaultMessage);
    setGeneratedImageUrl(null); // Reset generated image when template changes
  };

  const generateShareImage = async () => {
    if (!cardRef.current) return;

    setGeneratingImage(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imageUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(imageUrl);
      toast.success('Card ready to share! 🎉');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate card');
    } finally {
      setGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement('a');
    link.download = `besties-request-${selectedTemplate.id}.png`;
    link.href = generatedImageUrl;
    link.click();
    toast.success('Card downloaded! Share it with your friend 💜');
  };

  const handleShareWhatsApp = () => {
    const message = `${customMessage}\n\nView my profile: ${shareUrl}`;
    const encoded = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encoded}`;
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleShareFacebook = () => {
    const encoded = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(customMessage);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `fb://profile/${currentUser.uid}`;
      setTimeout(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${text}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${text}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(customMessage);
    const url = encodeURIComponent(shareUrl);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `twitter://post?message=${text} ${url}`;
      setTimeout(() => {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareSMS = () => {
    const message = `${customMessage}\n\nView my profile: ${shareUrl}`;
    const encoded = encodeURIComponent(message);
    window.location.href = `sms:?body=${encoded}`;
  };

  const handleShareMessenger = () => {
    const encoded = encodeURIComponent(shareUrl);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `fb-messenger://share?link=${encoded}`;
      setTimeout(() => {
        window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=&redirect_uri=${encoded}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=&redirect_uri=${encoded}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareInstagram = async () => {
    const message = `${customMessage}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Link copied! Opening Instagram...');

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Try to open Instagram app
        window.location.href = 'instagram://';
        setTimeout(() => {
          // Fallback to Instagram web if app not installed
          window.open('https://www.instagram.com/', '_blank');
        }, 1500);
      } else {
        window.open('https://www.instagram.com/direct/inbox/', '_blank');
      }
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyText = async () => {
    const text = `${customMessage}\n\nView my profile: ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-text-primary">Invite a Bestie</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-text-secondary mb-6">
          Choose a card template, customize your message, and share it with a friend!
        </p>

        {/* Template Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-display text-text-primary mb-3">Choose a Card</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CARD_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template)}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedTemplate.id === template.id
                    ? 'border-2 border-primary shadow-lg scale-105'
                    : 'border-2 border-transparent hover:border-gray-300 hover:shadow-md'
                }`}
                style={{ background: template.bgGradient }}
              >
                <div className="text-4xl mb-2">{template.emoji}</div>
                <div className="text-sm font-semibold text-white drop-shadow-md">
                  {template.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Customization */}
        <div className="mb-6">
          <h3 className="text-lg font-display text-text-primary mb-3">Customize Your Message</h3>
          <textarea
            value={customMessage}
            onChange={(e) => {
              setCustomMessage(e.target.value);
              setGeneratedImageUrl(null); // Reset image when message changes
            }}
            className="input min-h-[100px] resize-none w-full"
            placeholder="Edit your message..."
            maxLength={200}
          />
          <div className="text-xs text-text-secondary mt-1 text-right">
            {customMessage.length}/200 characters
          </div>
        </div>

        {/* Card Preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display text-text-primary">Card Preview</h3>
            {!generatedImageUrl && (
              <button
                onClick={generateShareImage}
                disabled={generatingImage}
                className="btn btn-secondary btn-sm"
              >
                {generatingImage ? 'Generating...' : '🖼️ Generate Image'}
              </button>
            )}
          </div>

          <div
            ref={cardRef}
            className="w-full rounded-2xl p-8 text-center shadow-xl relative overflow-hidden"
            style={{ background: selectedTemplate.bgGradient }}
          >
            {/* Emoji */}
            <div className="text-6xl mb-4">{selectedTemplate.emoji}</div>

            {/* Profile Photo */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-display overflow-hidden mx-auto mb-4 border-4 border-white shadow-xl">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <span className="bg-gradient-primary text-white w-full h-full flex items-center justify-center">
                  {userData?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
                </span>
              )}
            </div>

            {/* Name */}
            <h3 className="font-display text-3xl text-white drop-shadow-lg mb-4">
              {userData?.displayName || 'User'}
            </h3>

            {/* Message */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-2xl">
              <p className="text-lg text-gray-800 font-medium">
                {customMessage}
              </p>
            </div>

            {/* App branding */}
            <div className="mt-6 pt-4 border-t-2 border-white/40">
              <div className="text-sm font-semibold text-white drop-shadow">Download the</div>
              <div className="font-display text-2xl text-white drop-shadow-lg">Besties App</div>
              <div className="text-xs text-white/90 mt-1">Your Safety Network</div>
            </div>
          </div>
        </div>

        {/* Generated Image Actions */}
        {generatedImageUrl && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✅</span>
              <p className="text-green-800 font-semibold">Card ready to share!</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                📥 Download Card
              </button>
              <button
                onClick={generateShareImage}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              >
                🔄 Regenerate
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-3">
              Download and share on Instagram, TikTok, or anywhere!
            </p>
          </div>
        )}

        {/* Share Buttons */}
        <div className="mb-4">
          <h3 className="text-lg font-display text-text-primary mb-3">Share With Friends</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="btn bg-[#25D366] text-white hover:bg-[#20BA5A] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleShareMessenger}
              className="btn bg-[#0084FF] text-white hover:bg-[#0073E6] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
              </svg>
              Messenger
            </button>

            <button
              onClick={handleShareInstagram}
              className="btn bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
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
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyText}
          className="w-full btn btn-primary"
        >
          📋 Copy Message
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Invite your friends to join your safety network!
        </p>
      </div>
    </div>
  );
};

export default BestieRequestModal;
