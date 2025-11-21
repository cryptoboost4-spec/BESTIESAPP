import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import haptic from '../utils/hapticFeedback';

// Luxury loader for "I'm Safe" confirmation
const SafeLoader = () => {
  const navigate = useNavigate();
  const messages = [
    { text: "Welcome home, beautiful! 💖", subtext: "We're so relieved you're safe" },
    { text: "You made it safely! ✨", subtext: "Your besties can rest easy now" },
    { text: "Safe and sound! 🌸", subtext: "Taking care of yourself like a queen" },
    { text: "You're home safe! 💕", subtext: "That's all that matters" },
  ];

  // Pick one random message
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  // Redirect to home after 2 seconds
  useEffect(() => {
    // Navigate to home after 2 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating celebration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-celebration-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.4,
            }}
          >
            <span className="text-3xl">
              {['🎉', '✨', '💚', '🌟', '💫', '🎊', '🦋', '🌸'][Math.floor(Math.random() * 8)]}
            </span>
          </div>
        ))}
      </div>

      {/* Luxury celebration card */}
      <div className="w-full max-w-lg text-center relative z-10">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(16,185,129,0.3)] border border-emerald-200/50">
          {/* Decorative corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-300/50 rounded-tl-xl"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-300/50 rounded-tr-xl"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-300/50 rounded-bl-xl"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-300/50 rounded-br-xl"></div>

          {/* Success animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Pulsing glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-green-300 to-teal-300 rounded-full animate-pulse-slow opacity-40 blur-xl"></div>

            {/* Checkmark with heart */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-28 h-28">
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>
                  <filter id="successGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Circle background */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="url(#successGradient)"
                  filter="url(#successGlow)"
                  className="animate-scale-bounce"
                />

                {/* Large checkmark */}
                <path
                  d="M30,50 L42,62 L70,34"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-success"
                />
              </svg>
            </div>
          </div>

          {/* Celebration message */}
          <h2 className="font-display text-3xl md:text-4xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent mb-3 leading-tight">
            {message.text}
          </h2>

        <p className="text-xl text-text-secondary font-semibold mb-8 animate-fade-in">
          {message.subtext}
        </p>

          {/* Celebrating animation */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="text-3xl animate-bounce-gentle">🎉</span>
            <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>💚</span>
            <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.4s'}}>✨</span>
          </div>

          {/* Gentle reminder */}
          <p className="text-xs text-gray-400 italic">
            Until next time, stay safe bestie! 💕
          </p>
        </div>
      </div>

      <style>{`
        @keyframes celebration-float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }
        @keyframes scale-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes draw-success {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-celebration-float {
          animation: celebration-float 5s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-scale-bounce {
          animation: scale-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-draw-success {
          animation: draw-success 0.8s ease-in-out 0.3s forwards;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const CheckInCard = ({ checkIn }) => {
  const { userData } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSafeLoader, setShowSafeLoader] = useState(false);
  const [extendingButton, setExtendingButton] = useState(null); // Track which extend button is loading
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(checkIn.notes || '');
  const [photoURLs, setPhotoURLs] = useState(checkIn.photoURLs || checkIn.photoURL ? [checkIn.photoURL] : []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [optimisticAlertTime, setOptimisticAlertTime] = useState(null); // For optimistic updates
  const { executeOptimistic } = useOptimisticUpdate();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(checkIn.location || '');

  // Passcode verification states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Use optimistic time if available, otherwise use the actual check-in time
      const alertTime = optimisticAlertTime || checkIn.alertTime.toDate();
      const now = new Date();
      const diff = alertTime - now;
      setTimeLeft(Math.max(0, diff));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [checkIn.alertTime, optimisticAlertTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = () => {
    const totalDuration = checkIn.duration * 60 * 1000;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const handleComplete = async (isAlarm = false) => {
    // Check if user has a safety passcode set
    if (userData?.security?.safetyPasscode) {
      setShowPasscodeModal(true);
      return;
    }

    // If no passcode, trigger haptic based on context
    if (!isAlarm) {
      haptic.success();
    }

    // Proceed with completion
    await completeCheckIn();
  };

  const handlePasscodeSubmit = async () => {
    const safetyPasscode = userData?.security?.safetyPasscode;
    const duressCode = userData?.security?.duressCode;

    if (!enteredPasscode) {
      toast.error('Please enter your passcode');
      return;
    }

    // Check if it's the duress code
    if (duressCode && enteredPasscode === duressCode) {
      // Duress code entered - fake success but trigger secret alert
      setShowPasscodeModal(false);
      setEnteredPasscode('');
      await handleDuressCode();
      return;
    }

    // Check if it's the safety passcode
    if (enteredPasscode === safetyPasscode) {
      // Correct passcode - trigger haptic for successful verification
      haptic.success();

      // Proceed with completion
      setShowPasscodeModal(false);
      setEnteredPasscode('');
      await completeCheckIn();
      return;
    }

    // Wrong passcode
    toast.error('Incorrect passcode');
    setEnteredPasscode('');
  };

  const completeCheckIn = async () => {
    // Show cute loader immediately
    setShowSafeLoader(true);

    // Complete check-in in background
    try {
      setLoading(true);
      const result = await apiService.completeCheckIn({ checkInId: checkIn.id });

      if (!result.data?.success) {
        throw new Error(result.error?.message || 'Failed to complete check-in');
      }

      // Verify the status changed by checking Firestore
      const checkInRef = doc(db, 'checkins', checkIn.id);
      const checkInSnap = await getDoc(checkInRef);

      if (!checkInSnap.exists() || checkInSnap.data().status !== 'completed') {
        throw new Error('Check-in status verification failed');
      }

      // Keep loader showing for 2 seconds to let user enjoy the message
      setTimeout(() => {
        navigate('/');
        toast.success('You\'re safe! Welcome home 💜', {
          duration: 4000,
          icon: '✅',
        });
      }, 2000);
    } catch (error) {
      console.error('Error completing check-in:', error);
      setShowSafeLoader(false);
      toast.error('Failed to complete check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuressCode = async () => {
    // Show same loader to look normal
    setShowSafeLoader(true);

    // Secretly trigger emergency alert to all besties in circle
    try {
      // Complete the check-in normally (so it looks legitimate)
      await apiService.completeCheckIn({ checkInId: checkIn.id });

      // Create a secret emergency alert (type looks normal to hide duress)
      const alertData = {
        userId: checkIn.userId,
        checkInId: checkIn.id,
        type: 'alert', // ✅ Looks like normal alert to anyone viewing
        _internal_duress: true, // ⚠️ Internal flag - backend uses this, hidden from UI
        message: `🚨 DURESS CODE USED - ${userData?.displayName || 'User'} may be in danger!`,
        location: checkIn.location,
        timestamp: Timestamp.now(),
        priority: 'critical',
      };

      // Add to alerts collection
      await addDoc(collection(db, 'alerts'), alertData);

      // Note: The backend should handle sending notifications to besties in the circle
      // This is done silently without showing any indication to the user

      // Keep loader showing for 2 seconds then navigate to maintain normal appearance
      setTimeout(() => {
        navigate('/');
        toast.success('You\'re safe! Welcome home 💜', {
          duration: 4000,
          icon: '✅',
        });
      }, 2000);
    } catch (error) {
      console.error('Error handling duress code:', error);
      // Don't show error to user - maintain the illusion that everything is normal
      // Navigate anyway to not raise suspicion
      setTimeout(() => {
        navigate('/');
        toast.success('You\'re safe! Welcome home 💜', {
          duration: 4000,
          icon: '✅',
        });
      }, 2000);
    }
  };

  const handleExtend = async (minutes) => {
    haptic.light();

    // Optimistic update - immediately show the new time
    const currentAlertTime = optimisticAlertTime || checkIn.alertTime.toDate();
    const newAlertTime = new Date(currentAlertTime.getTime() + minutes * 60 * 1000);
    setOptimisticAlertTime(newAlertTime);
    setExtendingButton(minutes);

    // Show immediate feedback
    toast.success(`Extended by ${minutes} minutes!`, { duration: 2000 });

    try {
      const result = await apiService.extendCheckIn({ checkInId: checkIn.id, additionalMinutes: minutes });

      if (result.data?.success) {
        // Verify the new alert time
        const checkInRef = doc(db, 'checkins', checkIn.id);
        const checkInSnap = await getDoc(checkInRef);

        if (checkInSnap.exists()) {
          // Backend confirmed - update with actual time from server
          setOptimisticAlertTime(checkInSnap.data().alertTime.toDate());
        } else {
          throw new Error('Unable to verify extension');
        }
      } else {
        throw new Error(result.error?.message || 'Failed to extend check-in');
      }
    } catch (error) {
      console.error('Error extending check-in:', error);

      // Revert optimistic update on error
      setOptimisticAlertTime(null);

      if (error.code === 'unavailable') {
        toast.error('Cannot reach server. Extension cancelled.', { duration: 4000 });
      } else {
        toast.error(error.message || 'Failed to extend check-in. Extension cancelled.', { duration: 4000 });
      }
    } finally {
      setExtendingButton(null);
    }
  };

  const handleSaveNotes = async () => {
    const previousNotes = checkIn.notes || '';

    await executeOptimistic({
      optimisticUpdate: () => {
        // Close editing mode immediately
        setEditingNotes(false);
      },
      serverUpdate: async () => {
        await updateDoc(doc(db, 'checkins', checkIn.id), {
          notes: notes,
        });
      },
      rollback: () => {
        // Reopen editing mode with previous notes
        setNotes(previousNotes);
        setEditingNotes(true);
      },
      successMessage: 'Notes updated!',
      errorMessage: 'Failed to save notes'
    });
  };

  const handlePhotoUpload = async (e) => {
    haptic.medium();

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the 5 photo limit
    if (photoURLs.length + files.length > 5) {
      toast.error('You can only have up to 5 photos per check-in');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Photos must be less than 5MB`);
        return;
      }
    }

    setUploadingPhoto(true);

    // Create optimistic preview URLs for instant display
    const optimisticURLs = files.map(file => URL.createObjectURL(file));
    const previousPhotoURLs = [...photoURLs];

    await executeOptimistic({
      optimisticUpdate: () => {
        // Show photos immediately with blob URLs
        setPhotoURLs([...photoURLs, ...optimisticURLs]);
      },
      serverUpdate: async () => {
        try {
          const newPhotoURLs = [];

          // Upload each file
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
              const storageRef = ref(storage, `checkin-photos/${checkIn.userId}/${Date.now()}_${i}_${file.name}`);
              await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(storageRef);

              // Only add to array if we got a valid URL
              if (downloadURL) {
                newPhotoURLs.push(downloadURL);
              } else {
                console.warn(`Failed to get download URL for photo ${i}`);
              }
            } catch (photoError) {
              console.error(`Error uploading photo ${i}:`, photoError);
              toast.error(`Failed to upload ${file.name}`);
              // Continue with other photos
            }
          }

          // Filter out any undefined values before updating Firestore
          const updatedPhotoURLs = [...previousPhotoURLs, ...newPhotoURLs].filter(url => url !== undefined && url !== null);

          // Update Firestore (Firestore doesn't accept undefined values)
          await updateDoc(doc(db, 'checkins', checkIn.id), {
            photoURLs: updatedPhotoURLs,
          });

          // Replace blob URLs with real URLs
          setPhotoURLs(updatedPhotoURLs);

          // Clean up blob URLs
          optimisticURLs.forEach(url => URL.revokeObjectURL(url));

          return updatedPhotoURLs;
        } finally {
          setUploadingPhoto(false);
        }
      },
      rollback: () => {
        // Revert to previous photos on error
        setPhotoURLs(previousPhotoURLs);
        // Clean up blob URLs
        optimisticURLs.forEach(url => URL.revokeObjectURL(url));
        setUploadingPhoto(false);
      },
      successMessage: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`,
      errorMessage: 'Failed to upload photos'
    });
  };

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUpdatingLocation(true);
    haptic.medium();

    try {
      // STEP 1: Get FAST location first (network-based, appears instant to user)
      const fastPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,     // Use network/WiFi for speed
          timeout: 5000,                  // 5 second timeout
          maximumAge: 10000               // Accept cached location up to 10s old
        });
      });

      const { latitude: fastLat, longitude: fastLng, accuracy: fastAccuracy } = fastPosition.coords;

      console.log(`Fast location: ${fastAccuracy} meters accuracy`);

      // Use reverse geocoding to get address from fast location
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${fastLat},${fastLng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      let locationName = `GPS: ${fastLat.toFixed(6)}, ${fastLng.toFixed(6)}`;
      if (data.results && data.results.length > 0) {
        locationName = data.results[0].formatted_address;
      }

      // Update Firestore with fast location (user sees this immediately)
      await updateDoc(doc(db, 'checkins', checkIn.id), {
        location: locationName,
        gpsCoords: { lat: fastLat, lng: fastLng },
        locationAccuracy: fastAccuracy,
        locationUpdatedAt: Timestamp.now(),
      });

      setCurrentLocation(locationName);
      toast.success('Location updated!');
      setUpdatingLocation(false);

      // STEP 2: Get ACCURATE location in background (GPS-based, silently updates)
      console.log('Getting accurate GPS location in background...');
      navigator.geolocation.getCurrentPosition(
        async (accuratePosition) => {
          const { latitude: accLat, longitude: accLng, accuracy: accAccuracy } = accuratePosition.coords;

          console.log(`Accurate location: ${accAccuracy} meters accuracy (improved from ${fastAccuracy}m)`);

          // Only update if accuracy improved significantly (>50 meters better)
          if (fastAccuracy - accAccuracy > 50) {
            // Get address for accurate location
            const accResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${accLat},${accLng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const accData = await accResponse.json();

            let accLocationName = `GPS: ${accLat.toFixed(6)}, ${accLng.toFixed(6)}`;
            if (accData.results && accData.results.length > 0) {
              accLocationName = accData.results[0].formatted_address;
            }

            // Silently update with more accurate location
            await updateDoc(doc(db, 'checkins', checkIn.id), {
              location: accLocationName,
              gpsCoords: { lat: accLat, lng: accLng },
              locationAccuracy: accAccuracy,
              locationUpdatedAt: Timestamp.now(),
            });

            setCurrentLocation(accLocationName);
            console.log('Location silently updated with accurate GPS');
          } else {
            console.log('Accurate location not significantly better, keeping fast location');
          }
        },
        (error) => {
          // Silently fail on background GPS - fast location is already saved
          console.log('Background accurate GPS failed (not critical):', error);
        },
        {
          enableHighAccuracy: true,      // Use GPS for accuracy
          timeout: 15000,                 // 15 second timeout
          maximumAge: 0                   // Don't use cached location
        }
      );

    } catch (error) {
      console.error('Error updating location:', error);
      if (error.code === 1) {
        toast.error('Location permission denied. Please enable location access.', { duration: 4000 });
      } else if (error.code === 3) {
        toast.error('Location timeout. Please try again.', { duration: 3000 });
      } else {
        toast.error('Failed to update location');
      }
      setUpdatingLocation(false);
    }
  };

  const removePhoto = async (index) => {
    haptic.light();

    const previousPhotoURLs = [...photoURLs];
    const updatedPhotoURLs = photoURLs.filter((_, i) => i !== index).filter(url => url !== undefined && url !== null);

    await executeOptimistic({
      optimisticUpdate: () => {
        // Remove photo immediately from UI
        setPhotoURLs(updatedPhotoURLs);
      },
      serverUpdate: async () => {
        // Ensure no undefined values in Firestore update
        await updateDoc(doc(db, 'checkins', checkIn.id), {
          photoURLs: updatedPhotoURLs,
        });
      },
      rollback: () => {
        // Restore photo on error
        setPhotoURLs(previousPhotoURLs);
      },
      successMessage: 'Photo removed',
      errorMessage: 'Failed to remove photo'
    });
  };

  const isAlerted = checkIn.status === 'alerted';

  // Show safe loader when completing check-in
  if (showSafeLoader) {
    return <SafeLoader />;
  }

  return (
    <div className={`card p-6 ${isAlerted ? 'border-2 border-danger' : ''}`}>
      {/* Timer - Bigger and at top */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-semibold text-text-secondary">Time remaining:</span>
          <span className={`font-display text-3xl ${timeLeft === 0 ? 'text-danger' : 'text-primary'}`}>
            {timeLeft === 0 ? 'EXPIRED' : formatTime(timeLeft)}
          </span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Extend Buttons - Right under timer */}
        {!isAlerted && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={() => handleExtend(15)}
              disabled={extendingButton !== null}
              className="btn btn-secondary text-sm py-2 active:scale-95"
            >
              +15m
            </button>
            <button
              onClick={() => handleExtend(30)}
              disabled={extendingButton !== null}
              className="btn btn-secondary text-sm py-2 active:scale-95"
            >
              +30m
            </button>
            <button
              onClick={() => handleExtend(60)}
              disabled={extendingButton !== null}
              className="btn btn-secondary text-sm py-2 active:scale-95"
            >
              +60m
            </button>
          </div>
        )}
      </div>

      {/* I'm Safe Button */}
      {!isAlerted && (
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full btn btn-success text-lg mb-6"
        >
          ✅ I'm Safe!
        </button>
      )}

      {isAlerted && (
        <div className="bg-danger/10 border border-danger rounded-xl p-4 text-center mb-6">
          <p className="font-semibold text-danger mb-2">
            🚨 Your besties have been alerted!
          </p>
          <p className="text-sm text-text-secondary mb-4">
            They know you haven't checked in
          </p>
          <button
            onClick={() => {
              haptic.warning();
              handleComplete(true);
            }}
            disabled={loading}
            className="btn btn-success w-full"
          >
            ✅ I'm Safe! (False Alarm)
          </button>
        </div>
      )}

      {/* Header - Address */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-text-primary">
              {currentLocation || 'No location set'}
            </h3>
            {isAlerted && (
              <span className="badge badge-warning text-xs">ALERTED</span>
            )}
          </div>
        </div>
      </div>

      {/* Photos Section */}
      {(photoURLs.length > 0 || !isAlerted) && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-text-secondary mb-2">
            Photos ({photoURLs.length}/5)
          </div>

          {/* Placeholder broken image when no photos */}
          {photoURLs.length === 0 && (
            <div className={`mb-3 p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="text-6xl mb-2 opacity-50">🖼️</div>
              <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No photos yet</div>
            </div>
          )}

          {/* Photo grid */}
          {photoURLs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {photoURLs.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Check-in ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {!isAlerted && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold hover:bg-red-600 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add more photos */}
          {!isAlerted && photoURLs.length < 5 && (
            <label className={`border-2 border-dashed ${isDark ? 'border-gray-600 hover:bg-primary/10' : 'border-gray-300 hover:bg-primary/5'} rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all`}>
              <div className="text-4xl mb-2">📷</div>
              <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {uploadingPhoto ? 'Uploading...' : photoURLs.length > 0 ? 'Add More Photos' : 'Add Photos'}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Click to upload (up to 5, max 5MB each)
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="mb-4">
        {editingNotes ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full p-3 border-2 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-xl focus:border-primary focus:outline-none resize-none`}
              rows="3"
              placeholder="Add notes about your check-in..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNotes}
                className="btn btn-primary text-sm flex-1"
              >
                💾 Save Notes
              </button>
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setNotes(checkIn.notes || '');
                }}
                className="btn btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {notes ? (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-xl`}>
                <div className="flex items-start justify-between mb-1">
                  <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>NOTES:</div>
                  {!isAlerted && (
                    <button
                      onClick={() => {
                        haptic.light();
                        setEditingNotes(true);
                      }}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-secondary">{notes}</p>
              </div>
            ) : !isAlerted && (
              <button
                onClick={() => {
                  haptic.light();
                  setEditingNotes(true);
                }}
                className={`w-full border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-300 hover:bg-primary/10' : 'border-gray-300 text-gray-600 hover:bg-primary/5'} rounded-xl p-3 text-sm font-semibold hover:border-primary transition-all`}
              >
                📝 Add Notes
              </button>
            )}
          </div>
        )}
      </div>

      {/* Location Update Button */}
      {!isAlerted && (
        <div className="mb-4">
          <button
            onClick={handleUpdateLocation}
            disabled={updatingLocation}
            className={`w-full border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-300 hover:bg-primary/10' : 'border-gray-300 text-gray-600 hover:bg-primary/5'} rounded-xl p-3 text-sm font-semibold hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            📍 {updatingLocation ? 'Updating Location...' : 'Note Current Location'}
          </button>
        </div>
      )}

      {/* Meeting With & Social Media */}
      {(checkIn.meetingWith || checkIn.socialMediaLinks) && (
        <div className="mb-4">
          {checkIn.meetingWith && (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-xl mb-2`}>
              <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>MEETING WITH:</div>
              <p className="text-sm text-text-primary font-semibold">{checkIn.meetingWith}</p>
            </div>
          )}
          {checkIn.socialMediaLinks && (
            <div className={`${isDark ? 'bg-purple-900/30' : 'bg-purple-50'} p-3 rounded-xl border-2 ${isDark ? 'border-purple-800' : 'border-purple-200'}`}>
              <div className={`text-xs font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'} mb-1`}>THEIR SOCIAL MEDIA:</div>
              <p className="text-sm text-text-primary">{checkIn.socialMediaLinks}</p>
            </div>
          )}
        </div>
      )}

      {/* Besties */}
      <div className="mb-4">
        <div className="text-sm text-text-secondary mb-2">
          Watching over you: {checkIn.bestieIds?.length || 0} besties
        </div>
      </div>

      {/* Created Time */}
      <div className="mt-4 text-xs text-text-secondary text-center">
        Started {formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true })}
      </div>

      {/* Passcode Verification Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full p-6`}>
            <h2 className={`text-2xl font-display ${isDark ? 'text-gray-100' : 'text-text-primary'} mb-2`}>🔒 Enter Passcode</h2>
            <p className="text-text-secondary mb-4">
              Enter your safety passcode to mark yourself safe
            </p>

            <div className="mb-6">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasscodeSubmit();
                  }
                }}
                className={`w-full px-3 py-3 border-2 ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:border-primary focus:outline-none text-center text-3xl tracking-widest`}
                placeholder="••••"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasscodeModal(false);
                  setEnteredPasscode('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePasscodeSubmit}
                disabled={!enteredPasscode}
                className="flex-1 btn btn-success"
              >
                Confirm
              </button>
            </div>

            <p className="text-xs text-text-secondary text-center mt-4">
              Forgot your passcode? Update it in Settings
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInCard;
