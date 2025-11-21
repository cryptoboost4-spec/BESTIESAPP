import React from 'react';
import InfoButton from '../InfoButton';

const NotificationSettings = ({
  userData,
  toggleNotification,
  togglePushNotifications,
  pushNotificationsSupported,
  pushNotificationsEnabled,
  loading,
  smsWeeklyCount,
  handleSendTestAlert
}) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Notifications</h2>

      <div className="space-y-4">
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
            onClick={() => toggleNotification('whatsapp')}
            className="w-12 h-6 rounded-full transition-colors bg-gray-300 dark:bg-gray-600 cursor-not-allowed flex-shrink-0 ml-3"
            disabled
          >
            <div className="w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform translate-x-1" />
          </button>
        </div>

        <div className="flex items-center justify-between opacity-50">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
              Facebook Messenger
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
              <InfoButton message="Facebook Messenger notifications will keep you updated on your besties' safety. Perfect if you use Messenger regularly!" />
            </div>
            <div className="text-sm text-text-secondary">Integration in development</div>
          </div>
          <button
            onClick={() => toggleNotification('facebook')}
            className="w-12 h-6 rounded-full transition-colors bg-gray-300 dark:bg-gray-600 cursor-not-allowed flex-shrink-0 ml-3"
            disabled
          >
            <div className="w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform translate-x-1" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-text-primary flex items-center">
              Email
              <InfoButton message="Receive email alerts when your besties check in or trigger an emergency alert. Emails are sent instantly and work on all devices." />
            </div>
            <div className="text-sm text-text-secondary">Get alerts via email</div>
          </div>
          <button
            onClick={() => toggleNotification('email')}
            className={`w-12 h-6 rounded-full transition-colors ${
              userData?.notificationPreferences?.email
                ? 'bg-primary'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                userData?.notificationPreferences?.email
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-text-primary flex items-center">
              Push Notifications (Beta)
              <InfoButton message="Browser push notifications only work when your browser is open. For reliable alerts, we recommend using Email or SMS. We're building a mobile app with better push notifications soon! 📱" />
            </div>
            <div className="text-sm text-text-secondary">
              {pushNotificationsSupported
                ? 'Browser notifications - limited reliability'
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

        {pushNotificationsSupported && !pushNotificationsEnabled && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg">
            💡 Tip: Email, WhatsApp, and Facebook are more reliable for critical safety alerts
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-text-primary flex items-center">
                SMS Alerts
                <InfoButton message="Text message alerts are currently free during beta (up to 5 per week). Once WhatsApp and Facebook integrations launch, SMS will become a premium feature at $1/month for 20 alerts. Use Email for unlimited free alerts!" />
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
                Free - Limited Time
              </span>
            </div>
            <div className="text-sm text-text-secondary">
              {userData?.notificationPreferences?.sms
                ? `Active - ${smsWeeklyCount}/5 alerts used this week`
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

        {userData?.notificationPreferences?.sms && smsWeeklyCount >= 4 && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg">
            ⚠️ You're approaching the weekly limit of 5 SMS alerts. Consider using email or WhatsApp for unlimited free alerts.
          </div>
        )}
      </div>

      {/* Test Alert Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={handleSendTestAlert}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {loading ? 'Sending Test Alert...' : '🧪 Send Test Alert'}
        </button>
        <p className="text-xs text-text-secondary mt-2 text-center">
          Test your notification setup - sends to all enabled channels
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
