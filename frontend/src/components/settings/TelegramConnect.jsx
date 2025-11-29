import React from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const TelegramConnect = ({ userData }) => {
  const isConnected = userData?.telegramChatId;
  const telegramLink = TELEGRAM_CONFIG.getLinkForUser(userData?.uid);

  const handleConnect = () => {
    window.open(telegramLink, '_blank');
  };

  const infoMessage = `Connect YOUR personal Telegram account to receive safety alerts when your besties need help. This is YOUR notification channel (like email or SMS), not for sharing with emergency contacts.

How it works:
1. Click "Connect Telegram" button
2. Open the Besties bot on Telegram
3. Send /start (or just click Start)
4. Your Telegram is instantly connected
5. You get alerts when YOUR BESTIES need help

Key points:
• Personal notifications - Alerts go to YOUR Telegram
• Not for sharing - This connects YOUR account only
• Completely free - Unlimited alerts forever
• Instant delivery - Real-time push notifications
• Privacy first - Send /disconnect anytime`;

  return (
    <div className="card p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary flex items-center gap-2">
          Telegram Notifications
          <InfoButton message={infoMessage} />
        </h2>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
          Free & Unlimited
        </span>
      </div>

      {/* Connection Status */}
      {isConnected ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                {userData.telegramUsername ? `@${userData.telegramUsername}` : 'Telegram connected'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Send <strong>/disconnect</strong> to the bot to disconnect
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Not connected - Click below to connect your Telegram
            </p>
          </div>
        </div>
      )}

      {/* Connect/Reconnect Button */}
      <button
        onClick={handleConnect}
        className={`btn ${isConnected ? 'btn-secondary' : 'btn-primary'} w-full flex items-center justify-center gap-2`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.168.525-.504.7-.826.717-.698.025-1.23-.461-1.907-.903-1.061-.696-1.659-1.128-2.69-1.806-1.19-.782-.42-1.211.26-1.911.177-.184 3.252-2.98 3.31-3.233.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.001.321.023.465.14.121.098.155.231.171.324.016.093.036.304.02.469z"/>
        </svg>
        {isConnected ? 'Open Telegram Bot' : 'Connect Telegram'}
      </button>
    </div>
  );
};

export default TelegramConnect;
