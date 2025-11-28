import React, { useState } from 'react';
import { MESSENGER_CONFIG } from '../../config/messenger';
import InfoButton from '../InfoButton';

const MessengerLinkDisplay = ({ userId }) => {
  const [copied, setCopied] = useState(false);
  const messengerLink = MESSENGER_CONFIG.getLinkForUser(userId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messengerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Connect with me on Besties Safety',
        text: 'Click this link to become my emergency contact on Besties. You\'ll get safety alerts if I need help!',
        url: messengerLink
      }).catch((error) => console.log('Share failed:', error));
    }
  };

  const shareViaMessenger = () => {
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(messengerLink)}&app_id=464891037130549&redirect_uri=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary flex items-center gap-2">
          Facebook Messenger Alerts
          <InfoButton message="Share your personal Messenger link with emergency contacts. When they click it and send any message, they'll be connected as safety contacts for 20 hours. They'll receive alerts if you don't check in safely. Unlimited contacts, completely free!" />
        </h2>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
          <span className="text-2xl">💬</span>
          How Messenger Alerts Work
        </h3>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>Share your personal link below with emergency contacts</li>
          <li>They click the link and send you <strong>any message</strong> on Messenger</li>
          <li>They're instantly connected as safety contacts for <strong>20 hours</strong></li>
          <li>Select them when creating check-ins (alongside your SMS besties)</li>
          <li>They get emergency alerts if you don't check in safely</li>
        </ol>
      </div>

      {/* Your Personal Link */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          Your Personal Messenger Link
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-text-primary overflow-x-auto whitespace-nowrap">
            {messengerLink}
          </div>
          <button
            onClick={handleCopy}
            className={`btn ${copied ? 'btn-success' : 'btn-secondary'} flex-shrink-0`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={shareViaMessenger}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.235c0 2.894 1.447 5.48 3.71 7.155V22l3.477-1.906c.929.257 1.915.394 2.813.394 5.523 0 10-4.145 10-9.235C22 6.145 17.523 2 12 2zm.972 12.413l-2.562-2.732-5.002 2.732 5.502-5.838 2.623 2.732 4.941-2.732-5.502 5.838z"/>
          </svg>
          Share via Messenger
        </button>

        {navigator.share && (
          <button
            onClick={handleShare}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Link
          </button>
        )}
      </div>

      {/* Why Use Messenger */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">✨</span>
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">Why use Messenger alerts?</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Unlimited contacts</strong> - No 5-person limit like SMS</li>
              <li><strong>Completely free</strong> - Unlike SMS which will become premium</li>
              <li><strong>Easy connection</strong> - Just click link and send one message</li>
              <li><strong>Auto-expiry</strong> - Contacts expire after 20 hours for privacy</li>
              <li><strong>Instant alerts</strong> - Real-time notifications through Messenger</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerLinkDisplay;
