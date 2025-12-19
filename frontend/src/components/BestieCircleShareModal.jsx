import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const BestieCircleShareModal = ({ onClose, onOpen, circleCount }) => {
  const { userData } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [justShared, setJustShared] = useState(false);
  const [sharingPlatform, setSharingPlatform] = useState(null);

  // Call onOpen when modal opens
  useEffect(() => {
    if (onOpen) {
      onOpen();
    }
  }, [onOpen]);
  const [hasNativeShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);

  // Fire confetti on successful share
  useEffect(() => {
    if (justShared) {
      const fireConfetti = async () => {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#a855f7', '#6366f1']
        });
      };
      fireConfetti().catch(console.error);
    }
  }, [justShared]);

  const handleShare = (platform) => {
    setIsSharing(true);
    setSharingPlatform(platform);

    const appUrl = window.location.origin;
    const userName = userData?.displayName || 'I';
    const message = `Hey! ${userName === 'I' ? "I'm" : `${userName} is`} using Besties to stay safe when going out. It's a safety app where your close friends can check in on you. Want to be part of ${userName === 'I' ? 'my' : `${userName}'s`} safety circle? 💜\n\nJoin me on Besties: ${appUrl}`;
    const encoded = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    setTimeout(() => {
      try {
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
              setIsSharing(false);
              setSharingPlatform(null);
              return;
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
          case 'copy':
            navigator.clipboard.writeText(`${appUrl}?invite=${userData?.id || ''}`).then(() => {
              toast.success('Invite link copied to clipboard! 🎉');
            }).catch(() => {
              toast.error('Failed to copy link');
              setIsSharing(false);
              setSharingPlatform(null);
              return;
            });
            break;
          default:
            break;
        }

        // Show success state
        setJustShared(true);
        toast.success(`Invite sent! 💜 Invite more friends to complete your circle.`);
      } catch (error) {
        console.error('Share error:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsSharing(false);
        setSharingPlatform(null);
      }
    }, 300);
  };

  const handleCopyLink = () => {
    handleShare('copy');
  };

  const handleNativeShare = async () => {
    if (!hasNativeShare) {
      handleCopyLink();
      return;
    }

    setIsSharing(true);
    setSharingPlatform('native');

    const appUrl = window.location.origin;
    const userName = userData?.displayName || 'I';
    const message = `Hey! ${userName === 'I' ? "I'm" : `${userName} is`} using Besties to stay safe when going out. It's a safety app where your close friends can check in on you. Want to be part of ${userName === 'I' ? 'my' : `${userName}'s`} safety circle? 💜\n\nJoin me on Besties: ${appUrl}`;

    try {
      await navigator.share({
        title: 'Join me on Besties!',
        text: message,
        url: `${appUrl}?invite=${userData?.id || ''}`,
      });

      setJustShared(true);
      toast.success('Invite sent! 💜 Invite more friends to complete your circle.');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Sharing failed. Try copy link instead!');
      }
    } finally {
      setIsSharing(false);
      setSharingPlatform(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div
        className="card max-w-md w-full p-0 animate-scale-up overflow-y-auto max-h-[90vh] relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors shadow-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Simplified Header */}
        <div className="bg-gradient-to-r from-primary to-purple-600 p-4 text-center">
          <h3 id="invite-modal-title" className="text-xl font-display text-white mb-2">
            Add a Bestie
          </h3>
          <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white font-semibold text-sm">
              {circleCount}/5
            </span>
          </div>
        </div>

        <div className="p-4">
          {justShared && (
            <div className="mb-4 text-center">
              <p className="text-sm font-semibold text-primary dark:text-purple-400">
                🎉 Great! Keep inviting to complete your circle!
              </p>
            </div>
          )}

          {/* Info Box - Always Visible */}
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 mb-4 border border-pink-200 dark:border-pink-800">
            <div className="flex items-start gap-2">
              <div className="text-lg flex-shrink-0">🛡️</div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong className="text-primary dark:text-purple-400">Why 5 besties?</strong> A full circle means maximum protection! Your 5 trusted friends will get alerts when you check in and can help if something goes wrong. The more besties, the safer you are. 💜
                </p>
              </div>
            </div>
          </div>

          {/* Sharing Options - Icon Grid */}
          <div className="mb-3">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Share invite</p>
            <div className={`grid gap-3 ${hasNativeShare ? 'grid-cols-5' : 'grid-cols-4'}`}>
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                disabled={isSharing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Copy invite link"
                aria-label="Copy invite link to clipboard"
              >
                {isSharing && sharingPlatform === 'copy' ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-primary dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {/* Native Share (if available) */}
              {hasNativeShare && (
                <button
                  onClick={handleNativeShare}
                  disabled={isSharing}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title="Share via device"
                  aria-label="Share via device"
                >
                  {isSharing && sharingPlatform === 'native' ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6 text-primary dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                </button>
              )}

              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                disabled={isSharing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
              >
                {isSharing && sharingPlatform === 'whatsapp' ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-primary dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                )}
              </button>

              {/* SMS */}
              <button
                onClick={() => handleShare('sms')}
                disabled={isSharing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Share via SMS"
                aria-label="Share via SMS"
              >
                {isSharing && sharingPlatform === 'sms' ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-primary dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
              </button>

              {/* Messenger */}
              <button
                onClick={() => handleShare('messenger')}
                disabled={isSharing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Share on Messenger"
                aria-label="Share on Messenger"
              >
                {isSharing && sharingPlatform === 'messenger' ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-primary dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Maybe Later Link */}
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2 min-h-[44px]"
              aria-label="Close and invite later"
            >
              Maybe later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BestieCircleShareModal;
