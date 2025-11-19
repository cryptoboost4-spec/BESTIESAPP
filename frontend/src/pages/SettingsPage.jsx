import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { authService, db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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

  // Edit mode states
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phoneNumber: '',
    bio: ''
  });

  // SMS popup state
  const [showSMSPopup, setShowSMSPopup] = useState(false);
  const [smsWeeklyCount, setSmsWeeklyCount] = useState(0);

  // Check if push notifications are supported and enabled
  useEffect(() => {
    const isSupported = notificationService.isSupported();
    setPushNotificationsSupported(isSupported);

    if (isSupported) {
      setPushNotificationsEnabled(userData?.notificationsEnabled || false);
    }
  }, [userData]);

  // Load user data for editing
  useEffect(() => {
    if (userData) {
      setEditForm({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
        bio: userData.profile?.bio || ''
      });
    }
  }, [userData]);

  // Load SMS weekly count
  useEffect(() => {
    const loadSmsCount = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSmsWeeklyCount(data.smsWeeklyCount || 0);
        }
      } catch (error) {
        console.error('Error loading SMS count:', error);
      }
    };

    loadSmsCount();
  }, [currentUser]);

  const handleSignOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate('/login');
    } else {
      toast.error('Sign out failed');
    }
  };

  const handleSaveDetails = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editForm.displayName,
        phoneNumber: editForm.phoneNumber,
        'profile.bio': editForm.bio,
      });
      toast.success('Profile updated successfully!');
      setIsEditingDetails(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (type) => {
    if (!currentUser) return;

    // Special handling for SMS
    if (type === 'sms') {
      const currentValue = userData?.notificationPreferences?.sms || false;

      // If enabling for the first time
      if (!currentValue && !userData?.hasSeenSMSPopup) {
        setShowSMSPopup(true);
        return;
      }

      // Check weekly limit
      if (!currentValue && smsWeeklyCount >= 5) {
        toast.error('You\'ve reached the weekly limit of 5 SMS alerts. Limit resets every Monday.', { duration: 6000 });
        return;
      }
    }

    try {
      const newValue = !userData?.notificationPreferences?.[type];

      // Validate WhatsApp requires phone number
      if (type === 'whatsapp' && newValue) {
        toast.error('WhatsApp integration coming soon! 🚀', { duration: 4000 });
        return;
      }

      // Validate Facebook
      if (type === 'facebook' && newValue) {
        toast.error('Facebook integration coming soon! 🚀', { duration: 4000 });
        return;
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

  const handleSMSPopupAccept = async () => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'notificationPreferences.sms': true,
        hasSeenSMSPopup: true,
      });
      setShowSMSPopup(false);
      toast.success('SMS notifications enabled!');
    } catch (error) {
      console.error('Error enabling SMS:', error);
      toast.error('Failed to enable SMS');
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
        // Enable notifications - this will request permission
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
          toast.success(`Test alert sent to: ${testedChannels.join(', ')}. WhatsApp/SMS/Facebook not tested to save costs, but use same system.`, { duration: 6000 });
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

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences</p>
        </div>

        {/* Account Section - Editable */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-text-primary">Account</h2>
            {!isEditingDetails ? (
              <button
                onClick={() => setIsEditingDetails(true)}
                className="text-primary font-semibold hover:underline text-sm"
              >
                ✏️ Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingDetails(false)}
                  className="text-gray-600 font-semibold hover:underline text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  disabled={loading}
                  className="text-primary font-semibold hover:underline text-sm"
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Email</div>
              <div className="font-semibold text-text-primary">{currentUser?.email}</div>
              <div className="text-xs text-text-secondary mt-1">Email cannot be changed</div>
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Display Name</div>
              {isEditingDetails ? (
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                />
              ) : (
                <div className="font-semibold text-text-primary">{userData?.displayName || 'Not set'}</div>
              )}
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Phone Number</div>
              {isEditingDetails ? (
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+1234567890"
                />
              ) : (
                <div className="font-semibold text-text-primary">{userData?.phoneNumber || 'Not set'}</div>
              )}
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Bio</div>
              {isEditingDetails ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              ) : (
                <div className="font-semibold text-text-primary">{userData?.profile?.bio || 'Not set'}</div>
              )}
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
            <div className="flex items-center justify-between opacity-50">
              <div>
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  WhatsApp
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                <div className="text-sm text-text-secondary">WhatsApp integration in development</div>
              </div>
              <button
                onClick={() => toggleNotification('whatsapp')}
                className="w-12 h-6 rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                disabled
              >
                <div className="w-5 h-5 bg-white rounded-full transition-transform translate-x-1" />
              </button>
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div>
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  Facebook Messenger
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                <div className="text-sm text-text-secondary">Facebook integration in development</div>
              </div>
              <button
                onClick={() => toggleNotification('facebook')}
                className="w-12 h-6 rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                disabled
              >
                <div className="w-5 h-5 bg-white rounded-full transition-transform translate-x-1" />
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
                💡 Tip: Email, WhatsApp, and Facebook are more reliable for critical safety alerts
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">SMS Alerts</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
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
                    className="text-gray-400 hover:text-gray-600"
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
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    userData?.notificationPreferences?.sms
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {userData?.notificationPreferences?.sms && smsWeeklyCount >= 4 && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                ⚠️ You're approaching the weekly limit of 5 SMS alerts. Consider using email or WhatsApp for unlimited free alerts.
              </div>
            )}
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
            <h2 className="text-xl font-display text-text-primary mb-2">Premium SMS Alerts</h2>
            <p className="text-text-secondary mb-4">
              Get up to 20 SMS alerts per month for just $1/month
            </p>
            <ul className="text-sm text-text-secondary mb-4 space-y-1">
              <li>✓ 20 SMS alerts per month</li>
              <li>✓ Priority delivery</li>
              <li>✓ No weekly limits</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={handleSMSSubscription}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                Subscribe for $1/month
              </button>
              <button
                onClick={() => navigate('/about')}
                className="btn btn-secondary"
              >
                Learn More
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-green-50 border-2 border-green-300">
            <h2 className="text-xl font-display text-text-primary mb-2">✅ Premium SMS Active</h2>
            <p className="text-text-secondary mb-4">
              You're subscribed to premium SMS alerts - up to 20 SMS per month
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

        {/* Privacy Settings */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-2">Privacy</h2>
          <p className="text-sm text-text-secondary mb-4">Control what your besties can see on your profile</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">Show Stats to Besties</div>
                <div className="text-sm text-text-secondary">
                  {userData?.privacySettings?.showStatsToBesties !== false
                    ? 'Besties can see your stats'
                    : 'Stats are private'}
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const newValue = !(userData?.privacySettings?.showStatsToBesties !== false);
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      'privacySettings.showStatsToBesties': newValue,
                    });
                    toast.success(newValue ? 'Stats now visible to besties' : 'Stats are now private');
                  } catch (error) {
                    console.error('Error updating privacy:', error);
                    toast.error('Failed to update privacy setting');
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors ${
                  userData?.privacySettings?.showStatsToBesties !== false
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    userData?.privacySettings?.showStatsToBesties !== false
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-semibold text-text-primary mb-2">Check-in Visibility</div>
                <div className="text-sm text-text-secondary mb-3">
                  Control who can see your check-ins (last 7 days)
                </div>
              </div>

              <div className="space-y-2">
                {/* Option 1: All Besties */}
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'all_besties' ? '#FF6B9D' : '#e5e7eb'
                  }}>
                  <input
                    type="radio"
                    name="checkInVisibility"
                    value="all_besties"
                    checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'all_besties'}
                    onChange={async (e) => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          'privacySettings.checkInVisibility': 'all_besties',
                        });
                        toast.success('All besties can now see your check-ins');
                      } catch (error) {
                        console.error('Error updating privacy:', error);
                        toast.error('Failed to update privacy setting');
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">All Besties</div>
                    <div className="text-sm text-text-secondary">
                      All your besties can see your check-ins. Only selected besties get notifications.
                    </div>
                  </div>
                </label>

                {/* Option 2: Circle Only */}
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'circle' ? '#FF6B9D' : '#e5e7eb'
                  }}>
                  <input
                    type="radio"
                    name="checkInVisibility"
                    value="circle"
                    checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'circle'}
                    onChange={async (e) => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          'privacySettings.checkInVisibility': 'circle',
                        });
                        toast.success('Only circle besties can see your check-ins');
                      } catch (error) {
                        console.error('Error updating privacy:', error);
                        toast.error('Failed to update privacy setting');
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">Bestie Circle Only</div>
                    <div className="text-sm text-text-secondary">
                      Only your top 5 circle besties can see your check-ins. Only selected besties get notifications.
                    </div>
                  </div>
                </label>

                {/* Option 3: Alerts Only */}
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'alerts_only' ? '#FF6B9D' : '#e5e7eb'
                  }}>
                  <input
                    type="radio"
                    name="checkInVisibility"
                    value="alerts_only"
                    checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'alerts_only'}
                    onChange={async (e) => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          'privacySettings.checkInVisibility': 'alerts_only',
                        });
                        toast.success('Check-ins only visible when alerts trigger');
                      } catch (error) {
                        console.error('Error updating privacy:', error);
                        toast.error('Failed to update privacy setting');
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">Alerts Only (Most Private)</div>
                    <div className="text-sm text-text-secondary">
                      Check-ins are hidden until an alert goes off. Only selected besties get notifications.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
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
            <div className="grid grid-cols-3 gap-3 mb-3">
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
            <button
              onClick={() => navigate('/about')}
              className="w-full btn bg-white border-2 border-primary text-primary hover:bg-primary/5"
            >
              Learn More About Besties →
            </button>
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
          className="w-full btn bg-red-500 text-white hover:bg-red-600 mb-6"
        >
          Sign Out
        </button>
      </div>

      {/* SMS First-Time Popup */}
      {showSMSPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📱</div>
              <h2 className="text-2xl font-display text-text-primary mb-2">About SMS Alerts</h2>
            </div>

            <div className="space-y-3 text-sm text-gray-700 mb-6">
              <p className="font-semibold text-primary">
                SMS alerts are currently FREE during beta testing!
              </p>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold mb-1">Free Tier Limits:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Up to 5 SMS alerts per week</li>
                  <li>Resets every Monday</li>
                  <li>You've used {smsWeeklyCount}/5 this week</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-semibold mb-1">Important to Know:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>SMS messages are expensive to send</li>
                  <li>Once WhatsApp and Facebook integrations launch, SMS will become a premium feature ($1/month for up to 20 alerts)</li>
                  <li>We recommend using email or WhatsApp for unlimited free alerts</li>
                </ul>
              </div>

              <p className="text-xs text-gray-600 italic">
                By enabling SMS, you understand these limitations and agree to use SMS responsibly.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSMSPopup(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSMSPopupAccept}
                className="flex-1 btn btn-primary"
              >
                I Understand - Enable SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
