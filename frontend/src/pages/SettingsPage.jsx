import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { db, authService } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import notificationService from '../services/notifications';
import NotificationSettings from '../components/settings/NotificationSettings';
import MessengerLinkDisplay from '../components/settings/MessengerLinkDisplay';
import TestAlertModal from '../components/settings/TestAlertModal';
import DonationCard from '../components/DonationCard';
import PrivacySettings from '../components/settings/PrivacySettings';
import SecurityPasscodes from '../components/settings/SecurityPasscodes';
import PreferencesAndQuickAccess from '../components/settings/PreferencesAndQuickAccess';
import LegalSection from '../components/settings/LegalSection';
import PricingTiers from '../components/settings/PricingTiers';
import TutorialsSection from '../components/settings/TutorialsSection';
import { useSettingsTutorialState } from '../hooks/useSettingsTutorialState';
import SettingsTutorialOverlay from '../components/tutorials/settings/SettingsTutorialOverlay';
import { FEATURES } from '../config/features';

const SettingsPage = () => {
  const { currentUser, userData } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(true);

  // Tutorial state
  const tutorial = useSettingsTutorialState();

  // Refs for tutorial highlighting
  const notificationSettingsRef = useRef(null);
  const messengerLinkRef = useRef(null);
  const privacySettingsRef = useRef(null);
  const securityPasscodesRef = useRef(null);
  const preferencesRef = useRef(null);

  // SMS popup state
  const [showSMSPopup, setShowSMSPopup] = useState(false);

  // Test alert modal state
  const [showTestAlertModal, setShowTestAlertModal] = useState(false);

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

  // Auto-scroll to section based on hash (like EditProfilePage)
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove #
    if (hash) {
      // Wait for content to render
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Optional: highlight the section briefly
          element.style.transition = 'background-color 0.3s';
          element.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);

          // Mark profile completion tasks as reviewed
          if (currentUser && hash === 'notifications') {
            updateDoc(doc(db, 'users', currentUser.uid), {
              'profileCompletion.reviewedNotifications': true,
            }).catch(err => console.error('Error updating profile completion:', err));
          } else if (currentUser && hash === 'privacy') {
            updateDoc(doc(db, 'users', currentUser.uid), {
              'profileCompletion.reviewedPrivacy': true,
            }).catch(err => console.error('Error updating profile completion:', err));
          } else if (currentUser && hash === 'security') {
            updateDoc(doc(db, 'users', currentUser.uid), {
              'profileCompletion.reviewedPasscode': true,
            }).catch(err => console.error('Error updating profile completion:', err));
          }
        }
      }, 100);
    }
  }, [currentUser]);

  // Auto-start tutorial when coming from Profile page (after clicking Settings button)
  useEffect(() => {
    // Check if we're coming from Profile tutorial
    const fromProfileTutorial = location.state?.fromProfileTutorial || 
                                (typeof window !== 'undefined' && sessionStorage.getItem('fromProfileTutorial') === 'true');
    
    if (fromProfileTutorial && !tutorial.isLoading && !tutorial.tutorialActive) {
      // Clear the flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fromProfileTutorial');
      }
      
      // If tutorial was previously completed, reset it first
      if (tutorial.isCompleted) {
        tutorial.resetTutorial().then(() => {
          // Small delay to ensure state is updated
          setTimeout(() => {
            tutorial.startTutorial();
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_started', { page: 'settings', auto_started: true, from: 'profile', reset: true });
            }
          }, 200);
        });
      } else {
        // Tutorial not completed, just start it
        tutorial.startTutorial();
        if (typeof window !== 'undefined' && window.analytics) {
          window.analytics.track('tutorial_started', { page: 'settings', auto_started: true, from: 'profile' });
        }
      }
    }
  }, [location.state?.fromProfileTutorial, tutorial.isLoading, tutorial.isCompleted, tutorial.tutorialActive, tutorial.startTutorial, tutorial.resetTutorial]);

  // Timezone detection on mount (if not set)
  useEffect(() => {
    const detectTimezone = async () => {
      if (!currentUser || !userData) return;

      // Only set if user doesn't have timezone set
      if (!userData.timezone) {
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await updateDoc(doc(db, 'users', currentUser.uid), {
            timezone: timezone
          });
        } catch (error) {
          console.error('Error setting timezone:', error);
        }
      }
    };

    detectTimezone();
  }, [currentUser, userData]);

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

      // NEW: Check if user has credits
      if (!currentValue) {
        // Fetch current credit balance
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const smsCredits = userDoc.data()?.smsCredits || {};
        const balance = (smsCredits.freeCredits || 0) +
                       (smsCredits.subscriptionCredits || 0) +
                       (smsCredits.extraCredits || 0);

        if (balance < 1) {
          toast.error('You have no SMS credits. Purchase credits in Settings to enable SMS alerts.', {
            duration: 6000
          });
          return;
        }
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

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('notification_setting_changed', {
        notification_type: type,
        enabled: newValue
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

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('data_retention_changed', {
        hold_data: newValue
      });

      toast.success(newValue ? 'Data will be kept indefinitely' : 'Data will be deleted after 24h');
    } catch (error) {
      console.error('Error updating data retention:', error);
      toast.error('Failed to update setting');
    }
  };

  const toggleTestMode = async () => {
    if (!currentUser) return;

    try {
      const newValue = !userData?.testMode;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        testMode: newValue,
      });

      // Track analytics
      const { logAnalyticsEvent } = require('../services/firebase');
      logAnalyticsEvent('test_mode_changed', {
        enabled: newValue
      });

      toast.success(newValue ? 'Test mode enabled' : 'Test mode disabled');
    } catch (error) {
      console.error('Error updating test mode:', error);
      toast.error('Failed to update test mode');
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

  // eslint-disable-next-line no-unused-vars
  const handleSMSSubscription = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({ amount: 2, type: 'subscription' });

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

    // Optimistic update - update UI immediately
    const newValue = !pushNotificationsEnabled;
    setPushNotificationsEnabled(newValue);

    // Then do the actual work in the background
    setLoading(true);
    try {
      if (newValue) {
        // Enable notifications - this will request permission
        const success = await notificationService.enableNotifications();
        if (!success) {
          // Revert on failure
          setPushNotificationsEnabled(false);
          toast.error('Failed to enable push notifications');
        }
      } else {
        // Disable notifications
        const success = await notificationService.disableNotifications();
        if (!success) {
          // Revert on failure
          setPushNotificationsEnabled(true);
          toast.error('Failed to disable push notifications');
        }
      }
    } catch (error) {
      console.error('Push notification error:', error);
      // Revert on error
      setPushNotificationsEnabled(!newValue);
      toast.error('Failed to update push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestAlert = async (selectedChannels) => {
    setLoading(true);
    try {
      // Only send to channels that are selected AND enabled
      // Use database state (userData.notificationsEnabled) instead of local state (pushNotificationsEnabled)
      const channelsToTest = {};
      const channelErrors = [];
      
      if (selectedChannels.push) {
        if (userData?.notificationsEnabled && userData?.fcmToken) {
          channelsToTest.push = true;
        } else {
          if (!userData?.notificationsEnabled) {
            channelErrors.push('Push: Notifications not enabled in settings');
          } else if (!userData?.fcmToken) {
            channelErrors.push('Push: FCM token missing');
          }
        }
      }
      
      if (selectedChannels.telegram) {
        if (userData?.notificationPreferences?.telegram && userData?.telegramChatId) {
          channelsToTest.telegram = true;
        } else {
          if (!userData?.notificationPreferences?.telegram) {
            channelErrors.push('Telegram: Not enabled in settings');
          } else if (!userData?.telegramChatId) {
            channelErrors.push('Telegram: Not connected');
          }
        }
      }
      
      if (selectedChannels.sms) {
        if (userData?.notificationPreferences?.sms && userData?.phoneNumber) {
          channelsToTest.sms = true;
        } else {
          if (!userData?.notificationPreferences?.sms) {
            channelErrors.push('SMS: Not enabled in settings');
          } else if (!userData?.phoneNumber) {
            channelErrors.push('SMS: Phone number missing');
          }
        }
      }

      if (Object.keys(channelsToTest).length === 0) {
        const errorMsg = channelErrors.length > 0 
          ? `Cannot test selected channels:\n${channelErrors.join('\n')}\n\nPlease enable and configure the channels in settings first.`
          : 'No enabled channels selected. Please enable the channels you want to test in notification settings first.';
        toast.error(errorMsg, { duration: 7000 });
        setLoading(false);
        return;
      }

      // Backend expects channels wrapped in a 'channels' object
      const result = await apiService.sendTestAlert({ channels: channelsToTest });

      if (result.data && result.data.success) {
        const channels = result.data.channels;
        const testedChannels = [];
        const failedChannels = [];
        
        // Check which channels were requested vs which succeeded
        if (channelsToTest.push) {
          if (channels.push) {
            testedChannels.push('Push');
          } else {
            failedChannels.push('Push (check FCM token configuration)');
          }
        }
        if (channelsToTest.sms) {
          if (channels.sms) {
            testedChannels.push('SMS');
          } else {
            failedChannels.push('SMS (check Twilio configuration)');
          }
        }
        if (channelsToTest.telegram) {
          if (channels.telegram) {
            testedChannels.push('Telegram');
          } else {
            failedChannels.push('Telegram (check bot token configuration)');
          }
        }

        if (testedChannels.length > 0) {
          let message = `✅ Test alerts sent successfully to: ${testedChannels.join(', ')}!`;
          if (failedChannels.length > 0) {
            message += `\n\nFailed: ${failedChannels.join(', ')}`;
          }
          toast.success(message, { duration: 7000 });
          setShowTestAlertModal(false);
        } else {
          toast.error(`All test alerts failed:\n${failedChannels.join('\n')}`, { duration: 7000 });
        }
      } else {
        toast.error(result.data?.error || 'Failed to send test alert');
      }
    } catch (error) {
      console.error('Test alert error:', error);
      // Extract more detailed error message
      const errorMessage = error.message || error.details || 'Failed to send test alert';
      if (errorMessage.includes('failed-precondition')) {
        toast.error('No notification channels enabled. Please enable the channels you want to test in settings first.', { duration: 5000 });
      } else {
        toast.error(`Test alert failed: ${errorMessage}`, { duration: 5000 });
      }
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
        <div id="notifications" ref={notificationSettingsRef}>
          <NotificationSettings
            userData={userData}
            currentUserId={currentUser.uid}
            toggleNotification={toggleNotification}
            togglePushNotifications={togglePushNotifications}
            pushNotificationsSupported={pushNotificationsSupported}
            pushNotificationsEnabled={pushNotificationsEnabled}
            loading={loading}
            onOpenTestModal={() => {
              setShowTestAlertModal(true);
            }}
          />
        </div>

        {/* Messenger Integration */}
        {FEATURES.messengerAlerts && (
          <div id="messenger" ref={messengerLinkRef}>
            <MessengerLinkDisplay userId={currentUser?.uid} />
          </div>
        )}

        {/* Pricing Tiers */}
        <PricingTiers />

        {/* Donation Card */}
        <DonationCard />


        {/* Privacy Settings */}
        <div id="privacy" ref={privacySettingsRef}>
          <PrivacySettings userData={userData} currentUser={currentUser} />
        </div>



        {/* Security - Passcodes */}
        <div id="security" ref={securityPasscodesRef}>
          <SecurityPasscodes
            userData={userData}
            showPasscodeInfo={showPasscodeInfo}
            setShowPasscodeInfo={setShowPasscodeInfo}
            setPasscodeType={setPasscodeType}
            setShowPasscodeModal={setShowPasscodeModal}
            handleRemovePasscode={handleRemovePasscode}
            loading={loading}
          />
        </div>

        {/* Test Mode */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-display text-text-primary">Test Mode</h2>
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Test check-ins won't affect your stats or analytics
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userData?.testMode || false}
                onChange={toggleTestMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Tutorials Section */}
        <TutorialsSection />

        {/* Preferences */}
        <div ref={preferencesRef}>
          <PreferencesAndQuickAccess
            isDark={isDark}
            toggleDarkMode={toggleDarkMode}
            toggleHoldData={toggleHoldData}
            userData={userData}
            navigate={navigate}
          />
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

        {/* Legal & Policies */}
        <LegalSection navigate={navigate} />

        {/* Log Out Button */}
        <div className="card p-6 mb-6">
          <button
            onClick={handleSignOut}
            className="w-full btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 text-base font-medium transition-colors"
          >
            Log Out
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

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📱 About SMS Alerts
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• SMS alerts cost 1 credit per message per bestie</li>
                  <li>• Subscribe for $2/month to get 15 credits</li>
                  <li>• Free channels (Telegram, Email) are always free</li>
                  <li>• SMS is a fallback when free channels fail</li>
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

      {/* Test Alert Modal */}
      <TestAlertModal
        isOpen={showTestAlertModal}
        onClose={() => {
          setShowTestAlertModal(false);
        }}
        userData={userData}
        onSendTest={handleSendTestAlert}
        loading={loading}
      />

      {/* Tutorial Overlay */}
      {tutorial.tutorialActive && tutorial.currentStep && (
        <SettingsTutorialOverlay
          currentStep={tutorial.currentStep}
          onNext={() => {
            if (tutorial.currentStep === 5) {
              tutorial.completeTutorial();
            } else {
              tutorial.nextStep();
            }
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_step_completed', {
                page: 'settings',
                step: tutorial.currentStep,
                action: 'next'
              });
            }
          }}
          onBack={() => {
            if (tutorial.currentStep > 1) {
              tutorial.setCurrentStep(tutorial.currentStep - 1);
            }
          }}
          onSkip={() => {
            if (typeof window !== 'undefined' && window.analytics) {
              window.analytics.track('tutorial_skipped', {
                page: 'settings',
                at_step: tutorial.currentStep
              });
            }
            tutorial.skipTutorial();
          }}
          isPaused={tutorial.isPaused}
          onPause={() => tutorial.pauseTutorial()}
          onResume={() => tutorial.resumeTutorial()}
          hasMessenger={FEATURES.messengerAlerts}
          refs={{
            notificationSettings: notificationSettingsRef,
            messengerLink: messengerLinkRef,
            privacySettings: privacySettingsRef,
            securityPasscodes: securityPasscodesRef,
            preferences: preferencesRef
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;
