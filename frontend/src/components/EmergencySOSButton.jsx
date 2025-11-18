import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EmergencySOSButton = () => {
  const { currentUser, userData } = useAuth();
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const handleSOSPress = () => {
    // 5 second countdown before sending
    setCountdown(5);
    setActivating(true);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sendSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    setActivating(false);
    setCountdown(null);
    toast('SOS cancelled');
  };

  const sendSOS = async () => {
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

      // Create emergency alert (matches backend collection name)
      await addDoc(collection(db, 'emergency_sos'), {
        userId: currentUser.uid,
        userName: userData?.displayName || 'User',
        location,
        timestamp: Timestamp.now(),
        status: 'active',
        type: 'sos',
        message: '🚨 EMERGENCY - User needs immediate help!'
      });

      toast.success('🚨 Emergency alert sent to all besties!');
      setActivating(false);
    } catch (error) {
      console.error('Error sending SOS:', error);
      toast.error('Failed to send emergency alert');
      setActivating(false);
    }
  };

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
