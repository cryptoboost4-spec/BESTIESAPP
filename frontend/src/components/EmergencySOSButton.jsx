import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import haptic from '../utils/hapticFeedback';

// Universal emergency number - 112 works in most countries
const EMERGENCY_NUMBER = '112';


const EmergencySOSButton = ({ hasActiveAlert = false }) => {
  const { currentUser, userData } = useAuth();
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [alertSent, setAlertSent] = useState(false); // Show orange alert screen after SOS sent
  const [holdProgress, setHoldProgress] = useState(0); // Progress for hold-to-cancel (0-100)
  const [showPasscodeModal, setShowPasscodeModal] = useState(false); // Show passcode verification modal
  const [passcodeInput, setPasscodeInput] = useState('');
  const countdownInterval = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const { executeOptimistic} = useOptimisticUpdate();

  // Prevent navigation away from orange alert screen
  useEffect(() => {
    if (!alertSent) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Emergency alert is active! Hold the cancel button for 10 seconds to dismiss.';
      return e.returnValue;
    };

    // Add event listener to warn before leaving page
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [alertSent]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
    };
  }, []);

  const handleSOSPress = () => {
    // Emergency haptic feedback when button is pressed
    haptic.emergency();

    // 5 second countdown before sending
    setCountdown(5);
    setActivating(true);

    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
          sendSOS();
          return null;
        }
        // Warning haptic feedback during countdown
        haptic.warning();
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    // Clear the interval to prevent SOS from sending
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    setActivating(false);
    setCountdown(null);
    toast('SOS cancelled');
  };

  const sendSOS = async () => {
    // Use optimistic update - show alert screen immediately
    await executeOptimistic({
      optimisticUpdate: () => {
        // Show orange alert screen instantly - user needs immediate feedback
        setActivating(false);
        setAlertSent(true);
      },
      serverUpdate: async () => {
        // Get location in background
        let location = 'Location unavailable';
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            location = `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          } catch (err) {
            console.error('Location error:', err);
          }
        }

        // Create emergency alert (matches backend collection name)
        const docRef = await addDoc(collection(db, 'emergency_sos'), {
          userId: currentUser.uid,
          userName: userData?.displayName || 'User',
          location,
          timestamp: Timestamp.now(),
          status: 'active',
          type: 'sos',
          message: '🚨 EMERGENCY - User needs immediate help!'
        });

        // Track analytics
        const { logAnalyticsEvent } = require('../services/firebase');
        logAnalyticsEvent('sos_triggered', {
          is_reverse_pin: false,
          has_location: !!location
        });

        return docRef;
      },
      rollback: () => {
        // Hide alert screen if backend fails
        setAlertSent(false);
        setActivating(false);
      },
      successMessage: '🚨 Emergency alert sent to all besties!',
      errorMessage: 'Failed to send emergency alert. Please try again.',
      skipSuccessToast: false
    });
  };

  const handleHoldStart = () => {
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);

    // Update progress every 50ms
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min((elapsed / 10000) * 100, 100); // 10 seconds = 100%
      setHoldProgress(progress);

      if (progress >= 100) {
        // Held for 10 seconds - cancel alert
        handleCancelAlert();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    // User released before 10 seconds
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
    toast.error('Hold button for 10 seconds to cancel alert');
  };

  const sendDuressAlert = async () => {
    try {
      // Get location
      let location = 'Location unavailable';
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          location = `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        } catch (err) {
          console.error('Location error:', err);
        }
      }

      // Create duress alert
      await addDoc(collection(db, 'emergency_sos'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'User',
        location,
        timestamp: Timestamp.now(),
        status: 'active',
        type: 'duress',
        message: '🚨 DURESS CODE USED - User is in danger and being forced to cancel!'
      });
    } catch (error) {
      console.error('Error sending duress alert:', error);
    }
  };

  const verifyPasscode = () => {
    const safetyCode = userData?.security?.safetyPasscode;
    const duressCode = userData?.security?.duressCode;

    if (passcodeInput === safetyCode) {
      // Correct safety passcode - cancel alert
      setShowPasscodeModal(false);
      setPasscodeInput('');
      setAlertSent(false);
      setHoldProgress(0);
      toast.success('Emergency alert cancelled');
    } else if (passcodeInput === duressCode && duressCode) {
      // Duress code entered - appear to cancel but actually send emergency alert
      setShowPasscodeModal(false);
      setPasscodeInput('');
      toast.success('Emergency alert cancelled');
      // Secretly send duress alert
      sendDuressAlert();
      // Hide the alert screen to make it appear cancelled
      setTimeout(() => {
        setAlertSent(false);
        setHoldProgress(0);
      }, 1000);
    } else {
      // Incorrect passcode
      toast.error('Incorrect passcode');
      setPasscodeInput('');
    }
  };

  const handleCancelAlert = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    // Check if passcode is required
    if (userData?.security?.safetyPasscode) {
      // Show passcode verification modal
      setShowPasscodeModal(true);
    } else {
      // No passcode required, cancel immediately
      setAlertSent(false);
      setHoldProgress(0);
      toast.success('Emergency alert cancelled');
    }
  };

  // Orange alert screen after SOS is sent (LOCKED - must hold 10 seconds to escape)
  if (alertSent) {
    return (
      <div className="fixed inset-0 bg-orange-500/95 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-md w-full my-8">
          <div className="text-8xl mb-6">
            🚨
          </div>
          <h2 className="text-4xl font-display text-white mb-4">
            EMERGENCY ALERT SENT
          </h2>
          <p className="text-xl text-white mb-8">
            Your besties have been notified!
          </p>

          {/* Emergency Number - 112 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <h3 className="text-white font-bold text-lg mb-3">📞 Call Emergency Services</h3>

            <a
              href={`tel:${EMERGENCY_NUMBER}`}
              className="bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-lg p-6 transition-all block mb-3"
            >
              <div className="text-5xl mb-2">🚨</div>
              <div className="text-white text-5xl font-bold mb-2">{EMERGENCY_NUMBER}</div>
              <div className="text-white text-sm font-semibold">Tap to call</div>
            </a>

            <p className="text-white/80 text-xs mt-3">
              112 is the international emergency number and works in most countries worldwide
            </p>
          </div>

          {/* Hold-to-Cancel Button */}
          <div className="relative">
            <button
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              className="btn bg-white text-orange-600 text-xl px-12 py-6 font-bold relative overflow-hidden w-full"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 bg-green-500/30 transition-all"
                style={{ width: `${holdProgress}%` }}
              ></div>
              <span className="relative z-10">
                {holdProgress === 0 ? 'HOLD TO CANCEL' : `${Math.ceil((100 - holdProgress) / 10)}s`}
              </span>
            </button>
            <p className="text-sm text-white mt-4">
              Hold for 10 seconds to cancel the emergency alert
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activating) {
    return (
      <div className="fixed inset-0 bg-danger/95 z-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-9xl font-display text-white mb-8 animate-pulse">
            {countdown}
          </div>
          <h2 className="text-3xl font-display text-white mb-4">
            EMERGENCY SOS
          </h2>
          <p className="text-xl text-white mb-8">
            Sending alert to all besties...
          </p>
          <button
            onClick={handleCancel}
            className="btn bg-white text-danger text-xl px-12 py-4"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleSOSPress}
        className={`fixed bottom-20 right-4 w-16 h-16 ${hasActiveAlert ? 'bg-yellow-500 animate-pulse' : 'bg-danger'} text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 flex flex-col items-center justify-center transition-all duration-200 z-40`}
        title="Emergency SOS - Hold for 5 seconds"
      >
        <span className="text-2xl">{hasActiveAlert ? '⚠️' : '🆘'}</span>
        <span className="text-[10px] font-bold">{hasActiveAlert ? 'ALERT' : 'SOS'}</span>
      </button>

      {/* Passcode Verification Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 animate-scale-up">
            <h2 className="text-2xl font-display text-text-primary mb-2 text-center">
              🔒 Enter Safety Passcode
            </h2>
            <p className="text-sm text-text-secondary mb-6 text-center">
              Verify your passcode to cancel the emergency alert
            </p>

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  verifyPasscode();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none text-center text-2xl font-bold tracking-widest mb-4"
              placeholder="••••"
              autoFocus
              maxLength={8}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscodeInput('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={verifyPasscode}
                disabled={!passcodeInput}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                Verify
              </button>
            </div>

            <p className="text-xs text-text-secondary text-center mt-4">
              Don't have a passcode set? <a href="/settings" className="text-primary underline">Set one up</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencySOSButton;
