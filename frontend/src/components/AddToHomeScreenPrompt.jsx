import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import haptic from '../utils/hapticFeedback';

/**
 * Enhanced PWA Install Prompt
 * - Captures beforeinstallprompt event for native install
 * - Shows after first check-in completion
 * - Detects iOS vs Android vs Desktop
 * - Uses native prompt when available, falls back to manual instructions
 * - Retry logic: if dismissed, ask again after next check-in
 */
const AddToHomeScreenPrompt = ({ currentUser, userData }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canUseNativePrompt, setCanUseNativePrompt] = useState(false);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      console.log('beforeinstallprompt event captured');
      // Save the event for later use
      setDeferredPrompt(e);
      setCanUseNativePrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
      setCanUseNativePrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Don't show if user permanently dismissed it
    if (userData?.settings?.dismissedAddToHomeScreen === true) {
      return;
    }

    // Detect device and browser
    const userAgent = navigator.userAgent;

    const detectedIOS = /iPhone|iPad|iPod/.test(userAgent);
    const detectedAndroid = /Android/.test(userAgent);
    const detectedSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
    const detectedChrome = /Chrome|CriOS/.test(userAgent) && !/EdgiOS/.test(userAgent);

    setIsIOS(detectedIOS);
    setIsAndroid(detectedAndroid);
    setIsSafari(detectedSafari);
    setIsChrome(detectedChrome);

    // Check if already installed as PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

    if (isInstalled) {
      return;
    }

    // Determine if we should show the prompt
    const shouldShow = () => {
      const completedCheckIns = userData?.stats?.completedCheckIns || 0;
      const lastDismissedAt = userData?.settings?.lastDismissedInstallPrompt;

      // Show after first check-in
      if (completedCheckIns >= 1) {
        // If never dismissed, show it
        if (!lastDismissedAt) {
          return true;
        }

        // If dismissed before, check if user has completed another check-in since
        const dismissedAtCheckInCount = userData?.settings?.dismissedAtCheckInCount || 0;
        if (completedCheckIns > dismissedAtCheckInCount) {
          // User completed another check-in since dismissing, ask again
          return true;
        }
      }

      return false;
    };

    if (shouldShow()) {
      // Show prompt after small delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }
  }, [userData]);

  const handleInstall = async () => {
    if (deferredPrompt && canUseNativePrompt) {
      // Use native browser prompt
      haptic.medium();
      deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
        // Save that user installed
        if (currentUser) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            'settings.installedPWA': true,
          });
        }
      } else if (outcome === 'dismissed') {
        console.log('User dismissed the install prompt');
        handleNoThanks();
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setCanUseNativePrompt(false);
    }
  };

  const handleNoThanks = async () => {
    setShowPrompt(false);
    haptic.light();

    // Save dismissal with current check-in count
    // This allows us to ask again after next check-in
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          'settings.lastDismissedInstallPrompt': new Date(),
          'settings.dismissedAtCheckInCount': userData?.stats?.completedCheckIns || 0,
        });
      } catch (error) {
        console.error('Error saving dismissal:', error);
      }
    }
  };

  const handleDismissForever = async () => {
    setShowPrompt(false);
    haptic.light();

    // Save to Firestore so we never show again
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          'settings.dismissedAddToHomeScreen': true,
        });
      } catch (error) {
        console.error('Error saving dismissal:', error);
      }
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl max-w-md w-full p-6 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📱</div>
          <h2 className="text-2xl font-display text-text-primary mb-2">
            Add Besties to Home Screen
          </h2>
          <p className="text-sm text-text-secondary">
            Quick access to safety check-ins, just like a real app! ✨
          </p>
        </div>

        {/* Native Prompt Button (Chrome, Edge, Samsung Internet, Opera) */}
        {canUseNativePrompt && deferredPrompt && (
          <div className="mb-6">
            <button
              onClick={handleInstall}
              className="w-full btn btn-primary text-lg py-4"
            >
              📲 Install App
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              One tap to add Besties to your home screen!
            </p>
          </div>
        )}

        {/* iOS Instructions (Safari only, no native prompt available) */}
        {isIOS && isSafari && (
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-center">📲 Quick Setup:</h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Tap the <strong>Share button</strong> at the bottom of Safari
                  </p>
                  {/* Animated iOS share icon */}
                  <div className="mt-2 flex justify-center">
                    <div className="relative">
                      <svg className="w-12 h-12 text-blue-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                  {/* Animated finger pointing down */}
                  <div className="mt-2 flex justify-center">
                    <div className="text-3xl animate-point-down">👇</div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Tap <strong>"Add"</strong> in the top right
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">✅ Done! Find Besties on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Manual Instructions (fallback when native prompt not available) */}
        {isAndroid && isChrome && !canUseNativePrompt && (
          <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl border-2 border-green-200 dark:border-green-700">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-center">📲 Quick Setup:</h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Tap the <strong>menu button</strong> (⋮) at the top right
                  </p>
                  {/* Animated dots */}
                  <div className="mt-2 flex justify-center">
                    <div className="flex flex-col gap-1 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                  </p>
                  {/* Animated finger pointing */}
                  <div className="mt-2 flex justify-center">
                    <div className="text-3xl animate-point-down">☝️</div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Tap <strong>"Install"</strong>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">✅ Done! Find Besties on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wrong browser warning for iOS */}
        {isIOS && !isSafari && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
            <p className="text-sm text-yellow-900 dark:text-yellow-100 text-center">
              ⚠️ You're using {isChrome ? 'Chrome' : 'a browser'}. To add Besties to your home screen, please open this page in <strong>Safari</strong>.
            </p>
          </div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && canUseNativePrompt && (
          <div className="mb-6">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Click the button above to install Besties on your computer for quick access!
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={handleNoThanks}
              className="flex-1 btn btn-secondary"
            >
              No Thanks
            </button>
            {!canUseNativePrompt && (
              <button
                onClick={handleDismissForever}
                className="flex-1 btn btn-primary"
              >
                Got It!
              </button>
            )}
          </div>
          <button
            onClick={handleDismissForever}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-1"
          >
            Don't show this again
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          {canUseNativePrompt
            ? "This makes Besties faster and easier to access 💜"
            : "Installing makes Besties work offline and load faster 💜"
          }
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes point-down {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-point-down {
          display: inline-block;
          animation: point-down 1.5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AddToHomeScreenPrompt;
