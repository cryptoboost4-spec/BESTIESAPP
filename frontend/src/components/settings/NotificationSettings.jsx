import React from 'react';
import toast from 'react-hot-toast';

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
          <div>
            <div className="font-semibold text-text-primary flex items-center gap-2">
              WhatsApp
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
            <div className="text-sm text-text-secondary">WhatsApp integration in development</div>
          </div>
          <button
            onClick={() => toggleNotification('whatsapp')}
            className="w-12 h-6 rounded-full transition-colors bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
            disabled
          >
            <div className="w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform translate-x-1" />
          </button>
        </div>

        <div className="flex items-center justify-between opacity-50">
          <div>
            <div className="font-semibold text-text-primary flex items-center gap-2">
              Facebook Messenger
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
            <div className="text-sm text-text-secondary">Facebook Messenger integration in development</div>
          </div>
          <button
            onClick={() => toggleNotification('facebook')}
            className="w-12 h-6 rounded-full transition-colors bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
            disabled
          >
            <div className="w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform translate-x-1" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-text-primary">Email</div>
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
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">Push Notifications (Beta)</span>
              <button
                onClick={() => toast((t) => (
                  <div className="text-sm">
                    <p className="font-semibold mb-2">About Push Notifications</p>
                    <p className="mb-2">Push notifications in web browsers have limited reliability because:</p>
                    <ul className="list-disc ml-4 mb-2 text-xs">
                      <li>They require a VAPID key configuration</li>
                      <li>They only work when the browser is open</li>
                      <li>Some browsers block them by default</li>
                    </ul>
                    <p className="text-xs font-semibold text-primary">We're building a native mobile app that will support reliable push notifications! 📱</p>
                    <button onClick={() => toast.dismiss(t.id)} className="mt-2 text-primary text-xs underline">Close</button>
                  </div>
                ), { duration: 8000 })}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                title="Learn more about push notifications"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
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
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">SMS Alerts</span>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
                Free - Limited Time
              </span>
              <button
                onClick={() => toast((t) => (
                  <div className="text-sm max-w-sm">
                    <p className="font-semibold mb-2">About SMS Alerts</p>
                    <p className="mb-2">SMS messages are expensive to send. Currently offering them for free during beta!</p>
                    <p className="mb-2 text-xs">
                      • <span className="font-semibold">Free tier:</span> Up to 5 SMS alerts per week<br/>
                      • Once WhatsApp and Facebook integrations launch, SMS will become a premium feature<br/>
                      • Premium SMS subscription: Up to 20 SMS alerts per month for $1/month
                    </p>
                    <p className="text-xs font-semibold text-primary">Use WhatsApp or Email for free unlimited alerts! 📱</p>
                    <button onClick={() => toast.dismiss(t.id)} className="mt-2 text-primary text-xs underline">Close</button>
                  </div>
                ), { duration: 10000 })}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                title="Learn more about SMS alerts"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
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
