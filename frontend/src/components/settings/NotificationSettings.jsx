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
  smsWeeklyCount,
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
        {/* WhatsApp - Coming Soon */}
        <div className="flex items-center justify-between opacity-50">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
              WhatsApp
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
              <InfoButton message="WhatsApp notifications will be sent when your besties check in or need help. This is the most reliable option for mobile alerts and will be completely free!" />
            </div>
            <div className="text-sm text-text-secondary">Integration in development</div>
          </div>
          <button
            className="w-12 h-6 rounded-full transition-colors bg-gray-300 dark:bg-gray-600 cursor-not-allowed flex-shrink-0 ml-3"
            disabled
          >
            <div className="w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform translate-x-1" />
          </button>
        </div>

        {/* Telegram */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                Telegram
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full whitespace-nowrap">Free & Unlimited</span>
                <InfoButton message="Connect YOUR Telegram account to receive safety alerts when your besties need help. When you toggle this on, it will automatically open Telegram to connect. Send /start to the bot to complete the connection!" />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!userData?.telegramChatId) {
                  // Auto-connect when toggling on
                  handleConnectTelegram();
                }
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
                  userData?.notificationPreferences?.telegram
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
              <InfoButton message="Browser push notifications work when your browser is open. For mobile alerts, we recommend Telegram or SMS." />
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
                <InfoButton message="Text message alerts - currently free during beta (5 per week)." />
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
                Free Beta
              </span>
            </div>
            <div className="text-sm text-text-secondary">
              {userData?.notificationPreferences?.sms
                ? `Active - ${smsWeeklyCount}/5 this week`
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
