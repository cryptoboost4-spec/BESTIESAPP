import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import InfoButton from '../InfoButton';

const NotificationSettings = forwardRef(({
  userData,
  currentUserId,
  toggleNotification,
  togglePushNotifications,
  pushNotificationsSupported,
  pushNotificationsEnabled,
  loading,
  onOpenTestModal,
  highlightedToggle = null, // 'telegram', 'push', 'sms', or null
  onToggleChange
}, ref) => {
  const telegramToggleRef = useRef(null);
  const pushToggleRef = useRef(null);
  const smsToggleRef = useRef(null);

  // Expose toggle refs to parent
  useImperativeHandle(ref, () => ({
    telegramToggle: telegramToggleRef.current,
    pushToggle: pushToggleRef.current,
    smsToggle: smsToggleRef.current
  }));

  // Animate highlighted toggle - make it visually turn on and off
  useEffect(() => {
    const toggleRefs = {
      telegram: telegramToggleRef.current,
      push: pushToggleRef.current,
      sms: smsToggleRef.current
    };

    const targetToggle = toggleRefs[highlightedToggle];
    if (targetToggle && highlightedToggle) {
      // Scale up the toggle
      targetToggle.style.transform = 'scale(1.1)';
      targetToggle.style.transition = 'transform 0.3s ease';

      // Scroll into view if needed
      targetToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Animate the toggle switching on and off
      const knob = targetToggle.querySelector('div'); // The inner knob element
      if (knob) {
        let isOn = false;
        let animationCount = 0;
        const maxAnimations = 6; // Switch on/off 3 times (6 transitions total)

        // Create animation interval
        const animationInterval = setInterval(() => {
          if (animationCount >= maxAnimations) {
            clearInterval(animationInterval);
            // End in the "off" state
            knob.style.transform = 'translateX(0.25rem)';
            targetToggle.style.backgroundColor = '';
            return;
          }

          isOn = !isOn;
          animationCount++;

          if (isOn) {
            // Animate to "on" state
            knob.style.transition = 'transform 0.4s ease';
            knob.style.transform = 'translateX(1.5rem)'; // translate-x-6 = 1.5rem
            targetToggle.style.transition = 'background-color 0.4s ease';
            targetToggle.style.backgroundColor = '#a855f7'; // primary color
          } else {
            // Animate to "off" state
            knob.style.transition = 'transform 0.4s ease';
            knob.style.transform = 'translateX(0.25rem)'; // translate-x-1 = 0.25rem
            targetToggle.style.transition = 'background-color 0.4s ease';
            targetToggle.style.backgroundColor = '#d1d5db'; // gray-300
          }
        }, 800); // Switch every 800ms

        return () => {
          clearInterval(animationInterval);
          targetToggle.style.transform = '';
          targetToggle.style.backgroundColor = '';
          targetToggle.style.transition = '';
          if (knob) {
            knob.style.transform = '';
            knob.style.transition = '';
          }
        };
      } else {
        // Fallback if knob not found - just pulse
        targetToggle.classList.add('animate-pulse');
        return () => {
          targetToggle.classList.remove('animate-pulse');
          targetToggle.style.transform = '';
        };
      }
    }
  }, [highlightedToggle]);

  const handleConnectTelegram = () => {
    const telegramLink = TELEGRAM_CONFIG.getLinkForUser(currentUserId);
    window.open(telegramLink, '_blank');
  };

  const handleToggle = (type, handler) => {
    handler();
    if (onToggleChange) {
      onToggleChange(type);
    }
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
              ref={telegramToggleRef}
              onClick={async () => {
                if (!userData?.telegramChatId) {
                  // Auto-connect when toggling on
                  handleConnectTelegram();
                }
                handleToggle('telegram', () => toggleNotification('telegram'));
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
            ref={pushToggleRef}
            onClick={() => handleToggle('push', togglePushNotifications)}
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
                <InfoButton message="Text message alerts cost 1 credit per message. Subscribe for $2/month to get 15 credits." />
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              {userData?.notificationPreferences?.sms
                ? 'Active - Credits required'
                : 'Not enabled'}
            </div>
          </div>
          <button
            ref={smsToggleRef}
            onClick={() => handleToggle('sms', () => toggleNotification('sms'))}
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
});

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;
