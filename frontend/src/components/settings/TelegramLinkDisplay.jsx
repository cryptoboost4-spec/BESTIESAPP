import React, { useState } from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const TelegramLinkDisplay = ({ userId }) => {
  const [copied, setCopied] = useState(false);
  const telegramLink = TELEGRAM_CONFIG.getLinkForUser(userId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(telegramLink);
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
        url: telegramLink
      }).catch((error) => console.log('Share failed:', error));
    }
  };

  const shareViaTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(telegramLink)}&text=${encodeURIComponent('Click this link to become my emergency contact on Besties. You\'ll get safety alerts if I need help!')}`,
      '_blank'
    );
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary flex items-center gap-2">
          Telegram Alerts
          <InfoButton message="Share your personal Telegram link with emergency contacts. When they click it and start the bot, they'll be connected as safety contacts for 20 hours. They'll receive alerts if you don't check in safely. Unlimited contacts, completely free!" />
        </h2>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          How Telegram Alerts Work
        </h3>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>Share your personal link below with emergency contacts</li>
          <li>They click the link and <strong>press START</strong> in the Telegram bot</li>
          <li>They're instantly connected as safety contacts for <strong>20 hours</strong></li>
          <li>Select them when creating check-ins (alongside your SMS besties)</li>
          <li>They get emergency alerts if you don't check in safely</li>
        </ol>
      </div>

      {/* Your Personal Link */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          Your Personal Telegram Link
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-text-primary overflow-x-auto whitespace-nowrap">
            {telegramLink}
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
          onClick={shareViaTelegram}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.823 8.598c-.136.613-.494.764-.999.474l-2.761-2.034-1.33 1.279c-.146.147-.271.271-.552.271l.197-2.798 5.092-4.603c.221-.197-.048-.307-.343-.11l-6.291 3.962-2.71-.848c-.59-.185-.602-.59.124-.873l10.598-4.086c.49-.176.918.11.757.874z"/>
          </svg>
          Share via Telegram
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

      {/* Why Use Telegram */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">✨</span>
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">Why use Telegram alerts?</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Unlimited contacts</strong> - No 5-person limit like SMS</li>
              <li><strong>Completely free</strong> - Unlike SMS which will become premium</li>
              <li><strong>Easy connection</strong> - Just click link and press START</li>
              <li><strong>Auto-expiry</strong> - Contacts expire after 20 hours for privacy</li>
              <li><strong>Instant alerts</strong> - Real-time notifications through Telegram</li>
              <li><strong>Privacy-focused</strong> - No phone number sharing required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramLinkDisplay;
