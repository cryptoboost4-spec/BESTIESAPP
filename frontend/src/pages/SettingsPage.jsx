import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { authService, db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import apiService from '../services/api';
import notificationService from '../services/notifications';

const SettingsPage = () => {
  const { currentUser, userData } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(true);

  // Check if push notifications are supported and enabled
  useEffect(() => {
    const isSupported = notificationService.isSupported();
    setPushNotificationsSupported(isSupported);

    if (isSupported) {
      setPushNotificationsEnabled(userData?.notificationsEnabled || false);
    }
  }, [userData]);

  const handleSignOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate('/login');
    } else {
      toast.error('Sign out failed');
    }
  };

  const toggleNotification = async (type) => {
    if (!currentUser) return;

    try {
      const newValue = !userData?.notificationPreferences?.[type];

      // Validate WhatsApp requires phone number
      if (type === 'whatsapp' && newValue) {
        if (!userData?.phoneNumber) {
          toast.error('Please add your phone number in Edit Profile first', { duration: 5000 });
          return;
        }
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`notificationPreferences.${type}`]: newValue,
      });
      toast.success(`${type} notifications ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification setting');
    }
  };

  const toggleHoldData = async () => {
    if (!currentUser) return;

    try {
      const newValue = !userData?.settings?.holdData;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'settings.holdData': newValue,
      });
      toast.success(newValue ? 'Data will be kept indefinitely' : 'Data will be deleted after 24h');
    } catch (error) {
      console.error('Error updating data retention:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleSMSSubscription = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({ amount: 1, type: 'subscription' });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = async (amount) => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({ amount, type: 'donation' });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start donation');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to start donation');
    } finally {
      setLoading(false);
    }
  };

  const togglePushNotifications = async () => {
    if (!pushNotificationsSupported) {
      toast.error('Push notifications are not supported in your browser');
      return;
    }

    setLoading(true);
    try {
      if (pushNotificationsEnabled) {
        // Disable notifications
        const success = await notificationService.disableNotifications();
        if (success) {
          setPushNotificationsEnabled(false);
        }
      } else {
        // Enable notifications
        const success = await notificationService.enableNotifications();
        if (success) {
          setPushNotificationsEnabled(true);
        }
      }
    } catch (error) {
      console.error('Push notification error:', error);
      toast.error('Failed to update push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestAlert = async () => {
    setLoading(true);
    try {
      const result = await apiService.sendTestAlert();

      if (result.data && result.data.success) {
        const channels = result.data.channels;
        const testedChannels = [];
        if (channels.email) testedChannels.push('Email');
        if (channels.push) testedChannels.push('Push');

        if (testedChannels.length > 0) {
          toast.success(`Test alert sent to: ${testedChannels.join(', ')}. WhatsApp/SMS not tested to save costs, but use same system.`, { duration: 6000 });
        } else {
          toast.error('No notification channels enabled. Enable email to test alerts.', { duration: 5000 });
        }
      } else {
        toast.error('Failed to send test alert');
      }
    } catch (error) {
      console.error('Test alert error:', error);
      toast.error('Failed to send test alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences</p>
        </div>

        {/* Account Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Account</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary">Email</div>
              <div className="font-semibold text-text-primary">{currentUser?.email}</div>
            </div>

            <div>
              <div className="text-sm text-text-secondary">Display Name</div>
              <div className="font-semibold text-text-primary">{userData?.displayName}</div>
            </div>

            <div>
              <div className="text-sm text-text-secondary">Member Since</div>
              <div className="font-semibold text-text-primary">
                {userData?.stats?.joinedAt?.toDate().toLocaleDateString() || 'Recently'}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">WhatsApp (Free)</div>
                <div className="text-sm text-text-secondary">
                  {!userData?.phoneNumber ? (
                    <span className="text-orange-600">⚠️ Add phone number in profile first</span>
                  ) : (
                    'Get alerts via WhatsApp'
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleNotification('whatsapp')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  userData?.notificationPreferences?.whatsapp
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    userData?.notificationPreferences?.whatsapp
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
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
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
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
                    className="text-gray-400 hover:text-gray-600"
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
                    ? 'bg-gray-200 cursor-not-allowed'
                    : pushNotificationsEnabled
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotificationsEnabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {pushNotificationsSupported && !pushNotificationsEnabled && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                💡 Tip: Email and WhatsApp are more reliable for critical safety alerts
              </div>
            )}

            <div className="flex items-center justify-between opacity-50">
              <div>
                <div className="font-semibold text-text-primary">SMS</div>
                <div className="text-sm text-text-secondary">Requires subscription</div>
              </div>
              <div className="text-sm text-primary font-semibold">
                {userData?.smsSubscription?.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Test Alert Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
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

        {/* SMS Subscription */}
        {!userData?.smsSubscription?.active ? (
          <div className="card p-6 mb-6 bg-gradient-secondary">
            <h2 className="text-xl font-display text-text-primary mb-2">SMS Alerts</h2>
            <p className="text-text-secondary mb-4">
              Enable SMS alerts for just $1/month
            </p>
            <button
              onClick={handleSMSSubscription}
              disabled={loading}
              className="btn btn-primary"
            >
              Subscribe for $1/month
            </button>
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-green-50 border-2 border-green-300">
            <h2 className="text-xl font-display text-text-primary mb-2">✅ SMS Alerts Active</h2>
            <p className="text-text-secondary mb-4">
              You're subscribed to SMS alerts for $1/month
            </p>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await apiService.createPortalSession();
                  if (result.data && result.data.url) {
                    window.location.href = result.data.url;
                  } else {
                    toast.error('Failed to open subscription portal');
                  }
                } catch (error) {
                  console.error('Portal session error:', error);
                  toast.error('Failed to open subscription portal');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}

        {/* Data Retention */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">Dark Mode</div>
                <div className="text-sm text-text-secondary">
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isDark ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">Keep My Data</div>
                <div className="text-sm text-text-secondary">
                  {userData?.settings?.holdData
                    ? 'Data kept indefinitely'
                    : 'Data deleted after 24 hours'}
                </div>
              </div>
              <button
                onClick={toggleHoldData}
                className={`w-12 h-6 rounded-full transition-colors ${
                  userData?.settings?.holdData
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    userData?.settings?.holdData
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Donations */}
        {!userData?.donationStats?.isActive && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-display text-text-primary mb-2">
              Support Besties 💜
            </h2>
            <p className="text-text-secondary mb-4">
              Help us keep Besties free for everyone
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleDonation(1)}
                disabled={loading}
                className="btn btn-secondary"
              >
                $1/mo
              </button>
              <button
                onClick={() => handleDonation(5)}
                disabled={loading}
                className="btn btn-primary"
              >
                $5/mo
              </button>
              <button
                onClick={() => handleDonation(10)}
                disabled={loading}
                className="btn btn-secondary"
              >
                $10/mo
              </button>
            </div>
          </div>
        )}

        {/* Quick Access */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/templates')}
              className="btn btn-secondary text-left px-4 py-3"
            >
              <div className="text-sm">📋 Templates</div>
            </button>
            <button
              onClick={() => navigate('/favorites')}
              className="btn btn-secondary text-left px-4 py-3"
            >
              <div className="text-sm">📍 Favorites</div>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="btn btn-secondary text-left px-4 py-3"
            >
              <div className="text-sm">📊 History</div>
            </button>
            <button
              onClick={() => navigate('/export-data')}
              className="btn btn-secondary text-left px-4 py-3"
            >
              <div className="text-sm">📥 Export Data</div>
            </button>
            {userData?.isAdmin && (
              <>
                <button
                  onClick={() => navigate('/dev-analytics')}
                  className="btn btn-secondary text-left px-4 py-3"
                >
                  <div className="text-sm">📈 Analytics</div>
                </button>
                <button
                  onClick={() => navigate('/monitoring')}
                  className="btn bg-gradient-primary text-white text-left px-4 py-3"
                >
                  <div className="text-sm">🔍 Monitoring</div>
                </button>
                <button
                  onClick={() => navigate('/error-dashboard')}
                  className="btn bg-red-500 text-white text-left px-4 py-3 hover:bg-red-600"
                >
                  <div className="text-sm">🚨 Errors</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active Donation */}
        {userData?.donationStats?.isActive && (
          <div className="card p-6 mb-6 bg-gradient-primary text-white">
            <h2 className="text-xl font-display mb-2">Thank You! 💜</h2>
            <p className="mb-2">You're helping keep Besties free</p>
            <div className="text-2xl font-display">
              ${userData.donationStats.monthlyAmount}/month
            </div>
            <div className="text-sm mt-2 opacity-80">
              Total donated: ${userData.donationStats.totalDonated}
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full btn bg-red-500 text-white hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
