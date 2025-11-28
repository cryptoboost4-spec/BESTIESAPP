import React from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const TelegramConnect = ({ userData }) => {
  const isConnected = userData?.telegramChatId;
  const telegramLink = TELEGRAM_CONFIG.getLinkForUser(userData?.uid);

  const handleConnect = () => {
    window.open(telegramLink, '_blank');
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary flex items-center gap-2">
          Telegram Notifications
          <InfoButton message="Connect your personal Telegram account to receive safety alerts when your besties need help. This is a notification channel - alerts go directly to YOU (not to emergency contacts). Completely free and unlimited!" />
        </h2>
        {isConnected && (
          <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
            ✓ Connected
          </span>
        )}
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
          <span className="text-2xl">📱</span>
          How Telegram Notifications Work
        </h3>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>Click "Connect Telegram" below to open the Besties bot</li>
          <li>Send <strong>/start</strong> to the bot (or just click Start)</li>
          <li>Your Telegram is instantly connected to your account</li>
          <li>When YOUR BESTIES trigger alerts, YOU get notified on Telegram</li>
          <li>This is YOUR notification channel (like email or SMS)</li>
        </ol>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        {isConnected ? (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">✅</span>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  Telegram Connected
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {userData.telegramUsername ? (
                    <>Connected as @{userData.telegramUsername}</>
                  ) : (
                    <>Your Telegram account is connected</>
                  )}
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  You'll receive safety alerts when your besties need help. To disconnect, send <strong>/disconnect</strong> to the bot.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  Telegram Not Connected
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Connect your Telegram to receive instant safety alerts. Click the button below to get started!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Button */}
      {!isConnected && (
        <button
          onClick={handleConnect}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.168.525-.504.7-.826.717-.698.025-1.23-.461-1.907-.903-1.061-.696-1.659-1.128-2.69-1.806-1.19-.782-.42-1.211.26-1.911.177-.184 3.252-2.98 3.31-3.233.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.001.321.023.465.14.121.098.155.231.171.324.016.093.036.304.02.469z"/>
          </svg>
          Connect Telegram
        </button>
      )}

      {/* Reconnect Button */}
      {isConnected && (
        <button
          onClick={handleConnect}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.168.525-.504.7-.826.717-.698.025-1.23-.461-1.907-.903-1.061-.696-1.659-1.128-2.69-1.806-1.19-.782-.42-1.211.26-1.911.177-.184 3.252-2.98 3.31-3.233.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.001.321.023.465.14.121.098.155.231.171.324.016.093.036.304.02.469z"/>
          </svg>
          Open Telegram Bot
        </button>
      )}

      {/* Key Differences */}
      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">Key Points:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Personal notifications</strong> - Alerts go to YOUR Telegram when besties need help</li>
              <li><strong>Not for sharing</strong> - Unlike Messenger, this connects YOUR account only</li>
              <li><strong>Completely free</strong> - Unlimited alerts forever</li>
              <li><strong>Instant delivery</strong> - Real-time push notifications to your phone</li>
              <li><strong>Privacy first</strong> - Send /disconnect anytime to stop receiving alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramConnect;
