import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';

// Emergency numbers by country
const EMERGENCY_NUMBERS = [
  { country: 'Australia', police: '000', ambulance: '000', fire: '000', flag: '🇦🇺' },
  { country: 'USA', police: '911', ambulance: '911', fire: '911', flag: '🇺🇸' },
  { country: 'UK', police: '999', ambulance: '999', fire: '999', flag: '🇬🇧' },
  { country: 'Canada', police: '911', ambulance: '911', fire: '911', flag: '🇨🇦' },
  { country: 'NZ', police: '111', ambulance: '111', fire: '111', flag: '🇳🇿' },
  { country: 'Europe', police: '112', ambulance: '112', fire: '112', flag: '🇪🇺' },
];

const EmergencySOSButton = () => {
  const { currentUser, userData } = useAuth();
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [alertSent, setAlertSent] = useState(false); // Show orange alert screen after SOS sent
  const [holdProgress, setHoldProgress] = useState(0); // Progress for hold-to-cancel (0-100)
  const countdownInterval = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const { executeOptimistic } = useOptimisticUpdate();

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

  const handleSOSPress = () => {
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

  const handleCancelAlert = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setAlertSent(false);
    setHoldProgress(0);
    toast.success('Emergency alert cancelled');
  };

  // Orange alert screen after SOS is sent (LOCKED - must hold 10 seconds to escape)
  if (alertSent) {
    return (
      <div className="fixed inset-0 bg-orange-500/95 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-md w-full my-8">
          <div className="text-8xl mb-6 animate-pulse">
            🚨
          </div>
          <h2 className="text-4xl font-display text-white mb-4">
            EMERGENCY ALERT SENT
          </h2>
          <p className="text-xl text-white mb-8">
            Your besties have been notified!
          </p>

          {/* Emergency Numbers */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <h3 className="text-white font-bold text-lg mb-3">📞 Emergency Numbers</h3>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_NUMBERS.map((country) => (
                <a
                  key={country.country}
                  href={`tel:${country.police}`}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 transition-all"
                >
                  <div className="text-2xl mb-1">{country.flag}</div>
                  <div className="text-white text-xs font-semibold">{country.country}</div>
                  <div className="text-white text-lg font-bold">{country.police}</div>
                </a>
              ))}
            </div>
            <p className="text-white/80 text-xs mt-3">Tap to call emergency services</p>
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
    <button
      onClick={handleSOSPress}
      className="fixed bottom-24 right-6 w-20 h-20 bg-danger text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 flex flex-col items-center justify-center transition-all duration-200 z-40 animate-pulse"
      title="Emergency SOS - Hold for 5 seconds"
    >
      <span className="text-3xl">🆘</span>
      <span className="text-xs font-bold">SOS</span>
    </button>
  );
};

export default EmergencySOSButton;
