import React from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const NotificationSettings = ({
  userData,
  currentUserId,
  toggleNotification,
  togglePushNotifications,
  pushNotificationsSupported,
  pushNotificationsEnabled,
  loading,
  onOpenTestModal
}) => {
  const handleConnectTelegram = () => {
    const telegramLink = TELEGRAM_CONFIG.getLinkForUser(currentUserId);
    window.open(telegramLink, '_blank');
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Notifications</h2>

      <div className="space-y-4">
        {/* Telegram */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                Telegram
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full whitespace-nowrap">Free & Unlimited</span>
                <InfoButton 
                  message="Connect Telegram for free mobile alerts. Click to connect." 
                  detailedMessage="Connect your Telegram account to receive free, unlimited safety alerts. Click the button to open Telegram and connect with our bot. Send /start to complete the connection. Works great for mobile alerts!" 
                />
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {!userData?.telegramChatId 
                  ? 'Not connected - Click to connect'
                  : userData?.notificationPreferences?.telegram
                  ? 'Connected and enabled'
                  : 'Connected but disabled'}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!userData?.telegramChatId) {
                  // Just open the bot link, don't toggle until connected
                  handleConnectTelegram();
                  return;
                }
                // Only toggle if already connected
                toggleNotification('telegram');
              }}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${
                !userData?.telegramChatId
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : userData?.notificationPreferences?.telegram
                  ? 'bg-primary'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                  userData?.notificationPreferences?.telegram && userData?.telegramChatId
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-text-primary flex items-center">
              Push Notifications
              <InfoButton 
                message="Browser notifications when browser is open. Use Telegram or SMS for mobile." 
                detailedMessage="Browser notifications when your browser is open. For mobile, use Telegram or SMS." 
              />
            </div>
            <div className="text-sm text-text-secondary">
              {pushNotificationsSupported
                ? 'Browser notifications'
                : 'Not supported in this browser'}
            </div>
          </div>
          <button
            onClick={togglePushNotifications}
            disabled={!pushNotificationsSupported || loading}
            className={`w-12 h-6 rounded-full transition-colors ${
              !pushNotificationsSupported
                ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                : pushNotificationsEnabled
                ? 'bg-primary'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                pushNotificationsEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* SMS Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-text-primary flex items-center">
                SMS Alerts
                <InfoButton 
                  message="SMS costs 1 credit per message. $2/month gets 15 credits." 
                  detailedMessage="SMS alerts use credits (1 credit = 1 SMS to 1 person). Subscribe for $2/month to get 15 credits that refresh monthly. SMS is used when free channels (Telegram, Messenger) aren't available. You can buy extra credits anytime." 
                />
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              {userData?.notificationPreferences?.sms
                ? 'Active - Credits required'
                : 'Not enabled'}
            </div>
          </div>
          <button
            onClick={() => toggleNotification('sms')}
            className={`w-12 h-6 rounded-full transition-colors ${
              userData?.notificationPreferences?.sms
                ? 'bg-primary'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                userData?.notificationPreferences?.sms
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Test Alert Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={onOpenTestModal}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          🧪 Test Notifications
        </button>
        <p className="text-xs text-text-secondary mt-2 text-center">
          Send a test notification to verify your setup
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
