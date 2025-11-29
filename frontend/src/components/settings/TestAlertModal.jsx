import React, { useState } from 'react';

const TestAlertModal = ({ isOpen, onClose, userData, onSendTest, loading }) => {
  const [selectedChannels, setSelectedChannels] = useState({
    push: true,
    sms: false,
    telegram: false
  });

  if (!isOpen) return null;

  const availableChannels = [
    {
      id: 'push',
      name: 'Push Notifications',
      enabled: userData?.notificationsEnabled,
      description: 'Browser push notification'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      enabled: userData?.notificationPreferences?.telegram && userData?.telegramChatId,
      description: 'Send to your Telegram'
    },
    {
      id: 'sms',
      name: 'SMS',
      enabled: userData?.notificationPreferences?.sms && userData?.phoneNumber,
      description: 'Send text message'
    }
  ];

  const toggleChannel = (channelId) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  };

  const handleSend = () => {
    onSendTest(selectedChannels);
  };

  const selectedCount = Object.values(selectedChannels).filter(Boolean).length;
  const hasEnabledSelected = availableChannels.some(ch => ch.enabled && selectedChannels[ch.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display text-text-primary">Test Alerts</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4">
          Select which notification channels to test.
        </p>

        {/* Channel Selection */}
        <div className="space-y-3 mb-6">
          {availableChannels.map(channel => (
            <div
              key={channel.id}
              className={`border rounded-lg p-4 transition-colors ${
                channel.enabled
                  ? selectedChannels[channel.id]
                    ? 'border-primary bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <label className={`flex items-start gap-3 ${channel.enabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  checked={selectedChannels[channel.id]}
                  onChange={() => toggleChannel(channel.id)}
                  disabled={!channel.enabled}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{channel.name}</span>
                    {channel.enabled && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{channel.description}</p>
                  {!channel.enabled && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Enable this in notification settings first
                    </p>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !hasEnabledSelected}
            className="flex-1 btn btn-primary"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              `Send Test ${selectedCount > 0 ? `(${selectedCount})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAlertModal;
