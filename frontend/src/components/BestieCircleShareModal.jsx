import React from 'react';
import toast from 'react-hot-toast';

const BestieCircleShareModal = ({ onClose, circleCount }) => {
  const handleShare = (platform) => {
    const appUrl = window.location.origin;
    const message = `Hey! I'm using Besties to stay safe when I go out. It's a safety app where your close friends can check in on you. Want to be part of my safety circle? 💜\n\nJoin me on Besties: ${appUrl}`;
    const encoded = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    switch (platform) {
      case 'whatsapp':
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${encoded}`;
        } else {
          window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }
        break;
      case 'messenger':
        if (isMobile) {
          window.location.href = `fb-messenger://share?link=${encodeURIComponent(appUrl)}`;
          setTimeout(() => {
            window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(appUrl)}&app_id=&redirect_uri=${encodeURIComponent(appUrl)}`, '_blank');
          }, 1500);
        } else {
          window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(appUrl)}&app_id=&redirect_uri=${encodeURIComponent(appUrl)}`, '_blank', 'width=600,height=400');
        }
        break;
      case 'instagram':
        navigator.clipboard.writeText(message).then(() => {
          toast.success('Message copied! Opening Instagram DMs...');
          if (isMobile) {
            window.location.href = 'instagram://direct/inbox';
            setTimeout(() => {
              window.open('https://www.instagram.com/direct/inbox/', '_blank');
            }, 1500);
          } else {
            window.open('https://www.instagram.com/direct/inbox/', '_blank');
          }
        }).catch(() => {
          toast.error('Failed to copy message');
        });
        break;
      case 'sms':
        window.location.href = `sms:?body=${encoded}`;
        break;
      case 'facebook':
        const textEncoded = encodeURIComponent('Join my safety circle on Besties! 💜');
        const urlEncoded = encodeURIComponent(appUrl);
        if (isMobile) {
          window.location.href = `fb://profile`;
          setTimeout(() => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${textEncoded}`, '_blank');
          }, 1500);
        } else {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${textEncoded}`, '_blank', 'width=600,height=400');
        }
        break;
      default:
        break;
    }

    toast.success(`Opening ${platform}...`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💜</div>
          <h3 className="text-2xl font-display text-gradient mb-2">Complete Your Circle</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You have <span className="font-bold text-primary">{circleCount}/5 members</span> in your safety circle.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
          <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
            <strong>Why complete your circle?</strong> Having 5 trusted friends watching over you provides maximum safety coverage. They'll receive alerts when you check in and can help if something goes wrong. 🛡️
          </p>
        </div>

        {/* Social Sharing */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
            Invite friends to join Besties:
          </p>
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white transition-colors"
              title="Share on WhatsApp"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>

            <button
              onClick={() => handleShare('messenger')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0084FF] hover:bg-[#0073E6] text-white transition-colors"
              title="Share on Messenger"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
              </svg>
              <span className="text-xs font-semibold">Messenger</span>
            </button>

            <button
              onClick={() => handleShare('instagram')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white transition-opacity"
              title="Share on Instagram"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-xs font-semibold">Instagram</span>
            </button>

            <button
              onClick={() => handleShare('sms')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-success hover:bg-green-600 text-white transition-colors"
              title="Share via SMS"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs font-semibold">SMS</span>
            </button>

            <button
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white transition-colors"
              title="Share on Facebook"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-xs font-semibold">Facebook</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn btn-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BestieCircleShareModal;
