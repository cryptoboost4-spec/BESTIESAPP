import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { db, authService } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import notificationService from '../services/notifications';
import NotificationSettings from '../components/settings/NotificationSettings';
import PremiumSMSSection from '../components/settings/PremiumSMSSection';
import PrivacySettings from '../components/settings/PrivacySettings';
import SecurityPasscodes from '../components/settings/SecurityPasscodes';
import PreferencesAndQuickAccess from '../components/settings/PreferencesAndQuickAccess';
import LegalSection from '../components/settings/LegalSection';

const SettingsPage = () => {
  const { currentUser, userData } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(true);

  // SMS popup state
  const [showSMSPopup, setShowSMSPopup] = useState(false);
  const [smsWeeklyCount, setSmsWeeklyCount] = useState(0);

  // Passcode states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeType, setPasscodeType] = useState(null); // 'safety' or 'duress'
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscodeInfo, setShowPasscodeInfo] = useState(false);

  // Check if push notifications are supported and enabled
  useEffect(() => {
    const isSupported = notificationService.isSupported();
    setPushNotificationsSupported(isSupported);

    if (isSupported) {
      setPushNotificationsEnabled(userData?.notificationsEnabled || false);
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

  const handleSavePasscode = async () => {
    if (!passcode) {
      toast.error('Please enter a passcode');
      return;
    }

    if (passcode.length < 4) {
      toast.error('Passcode must be at least 4 digits');
      return;
    }

    if (passcode !== confirmPasscode) {
      toast.error('Passcodes do not match');
      return;
    }

    // Check that safety and duress codes are different
    if (passcodeType === 'duress') {
      if (passcode === userData?.security?.safetyPasscode) {
        toast.error('Duress code must be different from safety passcode');
        return;
      }
    } else if (passcodeType === 'safety') {
      if (passcode === userData?.security?.duressCode) {
        toast.error('Safety passcode must be different from duress code');
        return;
      }
    }

    setLoading(true);
    try {
      const fieldName = passcodeType === 'safety' ? 'safetyPasscode' : 'duressCode';
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`security.${fieldName}`]: passcode,
      });

      toast.success(`${passcodeType === 'safety' ? 'Safety passcode' : 'Duress code'} updated!`);
      setShowPasscodeModal(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeType(null);
    } catch (error) {
      console.error('Error saving passcode:', error);
      toast.error('Failed to save passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePasscode = async (type) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const fieldName = type === 'safety' ? 'safetyPasscode' : 'duressCode';
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`security.${fieldName}`]: null,
      });

      toast.success(`${type === 'safety' ? 'Safety passcode' : 'Duress code'} removed`);
    } catch (error) {
      console.error('Error removing passcode:', error);
      toast.error('Failed to remove passcode');
    } finally {
      setLoading(false);
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

  // eslint-disable-next-line no-unused-vars
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

  const handleSignOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate('/login');
    } else {
      toast.error('Sign out failed');
    }
  };

  return (
    <div className="min-h-screen bg-pattern">

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences</p>
        </div>
        {/* Notification Preferences */}
        <NotificationSettings
          userData={userData}
          toggleNotification={toggleNotification}
          togglePushNotifications={togglePushNotifications}
          pushNotificationsSupported={pushNotificationsSupported}
          pushNotificationsEnabled={pushNotificationsEnabled}
          loading={loading}
          smsWeeklyCount={smsWeeklyCount}
          handleSendTestAlert={handleSendTestAlert}
        />
        {/* SMS Subscription */}
        <PremiumSMSSection
          userData={userData}
          handleSMSSubscription={handleSMSSubscription}
          loading={loading}
          setLoading={setLoading}
          navigate={navigate}
        />

        
        {/* Privacy Settings */}
        <PrivacySettings userData={userData} currentUser={currentUser} />



        {/* Security - Passcodes */}
        <SecurityPasscodes
          userData={userData}
          showPasscodeInfo={showPasscodeInfo}
          setShowPasscodeInfo={setShowPasscodeInfo}
          setPasscodeType={setPasscodeType}
          setShowPasscodeModal={setShowPasscodeModal}
          handleRemovePasscode={handleRemovePasscode}
          loading={loading}
        />

        {/* Preferences */}
        <PreferencesAndQuickAccess
          isDark={isDark}
          toggleDarkMode={toggleDarkMode}
          toggleHoldData={toggleHoldData}
          userData={userData}
          navigate={navigate}
        />

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

        {/* Legal & Policies */}
        <LegalSection navigate={navigate} />

        {/* Log Out Button */}
        <div className="card p-6 mb-6">
          <button
            onClick={handleSignOut}
            className="w-full btn bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
          >
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-display text-text-primary mb-2">
              {passcodeType === 'safety' ? '🔒 Set Safety Passcode' : '⚠️ Set Duress Code'}
            </h2>
            <p className="text-text-secondary mb-4">
              {passcodeType === 'safety'
                ? 'This passcode will be required to end check-ins and cancel alerts.'
                : 'This code appears to cancel alerts but secretly triggers an emergency alert to your besties.'}
            </p>

            {passcodeType === 'duress' && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  ⚠️ <strong>Warning:</strong> Use your duress code only in genuine emergencies when you're being forced to cancel an alert under duress.
                </p>
              </div>
            )}

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  {passcodeType === 'safety' ? 'Passcode' : 'Duress Code'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none text-center text-2xl tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-text-secondary mt-1">At least 4 digits</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Confirm {passcodeType === 'safety' ? 'Passcode' : 'Code'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none text-center text-2xl tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasscodeModal(false);
                    setPasscode('');
                    setConfirmPasscode('');
                    setPasscodeType(null);
                  }}
                  className="flex-1 btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePasscode}
                  disabled={loading || !passcode || !confirmPasscode}
                  className={`flex-1 btn ${passcodeType === 'duress' ? 'bg-orange-600 hover:bg-orange-700' : 'btn-primary'} text-white`}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
              {(passcodeType === 'safety' && userData?.security?.safetyPasscode) || (passcodeType === 'duress' && userData?.security?.duressCode) ? (
                <button
                  onClick={() => {
                    handleRemovePasscode(passcodeType);
                    setShowPasscodeModal(false);
                    setPasscode('');
                    setConfirmPasscode('');
                    setPasscodeType(null);
                  }}
                  disabled={loading}
                  className="w-full btn bg-red-500 text-white hover:bg-red-600 text-sm"
                >
                  Remove {passcodeType === 'safety' ? 'Safety Passcode' : 'Duress Code'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SMS First-Time Popup */}
      {showSMSPopup && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📱</div>
              <h2 className="text-2xl font-display text-text-primary mb-2">About SMS Alerts</h2>
            </div>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
              <p className="font-semibold text-primary">
                SMS alerts are currently FREE during beta testing!
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                <p className="font-semibold mb-1">Free Tier Limits:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Up to 5 SMS alerts per week</li>
                  <li>Resets every Monday</li>
                  <li>You've used {smsWeeklyCount}/5 this week</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                <p className="font-semibold mb-1">Important to Know:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>SMS messages are expensive to send</li>
                  <li>Once WhatsApp and Facebook integrations launch, SMS will become a premium feature ($1/month for up to 20 alerts)</li>
                  <li>We recommend using email or WhatsApp for unlimited free alerts</li>
                </ul>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
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
