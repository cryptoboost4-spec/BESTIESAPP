import React, { useState, useEffect, useRef, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, Timestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import useOptimisticUpdate from '../hooks/useOptimisticUpdate';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import haptic from '../utils/hapticFeedback';
import { useCheckInCompletion } from '../hooks/useCheckInCompletion';
import { useCheckInLocation } from '../hooks/useCheckInLocation';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';
import SafeLoader from './checkin/SafeLoader';
import CheckInNotes from './checkin/CheckInNotes';
import PasscodeModal from './checkin/PasscodeModal';
import EditTimeModal from './checkin/EditTimeModal';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
import CheckInTutorialOverlay from './CheckInTutorialOverlay';

const CheckInCard = ({ checkIn }) => {
  const { currentUser, userData } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [extendingButton, setExtendingButton] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(checkIn.notes || '');
  const [photoURLs, setPhotoURLs] = useState(
    checkIn.photoURLs?.length > 0 
      ? checkIn.photoURLs.filter(url => url && url.trim() !== '') 
      : checkIn.photoURL 
        ? [checkIn.photoURL] 
        : []
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [optimisticAlertTime, setOptimisticAlertTime] = useState(null);
  const { executeOptimistic } = useOptimisticUpdate();
  const { completeCheckIn, loading, showSafeLoader, setShowSafeLoader } = useCheckInCompletion(checkIn.id, currentUser);
  const { currentLocation, setCurrentLocation } = useCheckInLocation(checkIn.id);

  // Passcode verification states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  
  // Edit time modal state
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  
  // File input ref for photo upload
  const fileInputRef = useRef(null);
  
  // Tutorial state
  const { currentCheckInTutorialStep, setCheckInTutorialStep } = useCheckInTutorialState();
  const cardRef = useRef(null);
  const safeButtonRef = useRef(null);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // Sync photo URLs when checkIn prop changes
  useEffect(() => {
    const newPhotoURLs = checkIn.photoURLs?.length > 0 
      ? checkIn.photoURLs.filter(url => url && url.trim() !== '') 
      : checkIn.photoURL 
        ? [checkIn.photoURL] 
        : [];
    setPhotoURLs(newPhotoURLs);
  }, [checkIn.photoURLs, checkIn.photoURL]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Handle null/undefined alertTime safely
      const alertTime = optimisticAlertTime || 
        (checkIn.alertTime?.toDate ? checkIn.alertTime.toDate() : null);
      
      if (!alertTime) {
        setTimeLeft(0);
        return;
      }
      
      const now = new Date();
      const diff = alertTime - now;
      setTimeLeft(Math.max(0, diff));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [checkIn.alertTime, optimisticAlertTime]);

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
      setShowPasscodeModal(false);
      setEnteredPasscode('');
      await handleDuressCode();
      return;
    }

    // Check if it's the safety passcode
    if (enteredPasscode === safetyPasscode) {
      haptic.success();
      setShowPasscodeModal(false);
      setEnteredPasscode('');
      await completeCheckIn();
      return;
    }

    // Wrong passcode
    toast.error('Incorrect passcode');
    setEnteredPasscode('');
  };

  // Initialize location from checkIn
  useEffect(() => {
    if (checkIn.location) {
      setCurrentLocation(checkIn.location);
    }
  }, [checkIn.location, setCurrentLocation]);

  const handleDuressCode = async () => {
    setShowSafeLoader(true);

    try {
      await apiService.completeCheckIn({ checkInId: checkIn.id });

      // Create a secret emergency alert
      const alertData = {
        userId: checkIn.userId,
        checkInId: checkIn.id,
        type: 'alert',
        _internal_duress: true,
        message: `🚨 DURESS CODE USED - ${userData?.displayName || 'User'} may be in danger!`,
        location: checkIn.location,
        timestamp: Timestamp.now(),
        priority: 'critical',
      };

      await addDoc(collection(db, 'alerts'), alertData);

      setTimeout(() => {
        navigate('/');
        toast.success('You\'re safe! Welcome home 💜', {
          duration: 4000,
          icon: '✅',
        });
      }, 2000);
    } catch (error) {
      console.error('Error handling duress code:', error);
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

    // Handle null/undefined alertTime safely
    const currentAlertTime = optimisticAlertTime || 
      (checkIn.alertTime?.toDate ? checkIn.alertTime.toDate() : null);
    
    if (!currentAlertTime) {
      toast.error('Unable to extend check-in: missing alert time');
      return;
    }
    
    const newAlertTime = new Date(currentAlertTime.getTime() + minutes * 60 * 1000);
    setOptimisticAlertTime(newAlertTime);
    setExtendingButton(minutes);

    toast.success(`Extended by ${minutes} minutes!`, { duration: 2000 });

    try {
      const result = await apiService.extendCheckIn({ checkInId: checkIn.id, additionalMinutes: minutes });

      if (result.data?.success) {
        const checkInRef = doc(db, 'checkins', checkIn.id);
        const checkInSnap = await getDoc(checkInRef);

        if (checkInSnap.exists()) {
          const alertTime = checkInSnap.data().alertTime;
          if (alertTime?.toDate) {
            setOptimisticAlertTime(alertTime.toDate());
          }

          // Track analytics
          const { logAnalyticsEvent } = require('../services/firebase');
          logAnalyticsEvent('checkin_extended', {
            minutes_added: minutes,
            checkin_id: checkIn.id
          });
        } else {
          throw new Error('Unable to verify extension');
        }
      } else {
        throw new Error(result.error?.message || 'Failed to extend check-in');
      }
    } catch (error) {
      console.error('Error extending check-in:', error);
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
        setEditingNotes(false);
      },
      serverUpdate: async () => {
        await updateDoc(doc(db, 'checkins', checkIn.id), {
          notes: notes,
        });
      },
      rollback: () => {
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

    if (photoURLs.length + files.length > 5) {
      toast.error('You can only have up to 5 photos per check-in');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Photos must be less than 5MB`);
        return;
      }
    }

    setUploadingPhoto(true);

    const optimisticURLs = files.map(file => URL.createObjectURL(file));
    const previousPhotoURLs = [...photoURLs];

    await executeOptimistic({
      optimisticUpdate: () => {
        setPhotoURLs([...photoURLs, ...optimisticURLs]);
      },
      serverUpdate: async () => {
        try {
          const newPhotoURLs = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
              const storageRef = ref(storage, `checkin-photos/${checkIn.userId}/${Date.now()}_${i}_${file.name}`);
              await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(storageRef);

              if (downloadURL) {
                newPhotoURLs.push(downloadURL);
              }
            } catch (photoError) {
              console.error(`Error uploading photo ${i}:`, photoError);
              toast.error(`Failed to upload ${file.name}`);
            }
          }

          const updatedPhotoURLs = [...previousPhotoURLs, ...newPhotoURLs].filter(url => url !== undefined && url !== null);

          await updateDoc(doc(db, 'checkins', checkIn.id), {
            photoURLs: updatedPhotoURLs,
          });

          setPhotoURLs(updatedPhotoURLs);
          optimisticURLs.forEach(url => URL.revokeObjectURL(url));

          return updatedPhotoURLs;
        } finally {
          setUploadingPhoto(false);
        }
      },
      rollback: () => {
        setPhotoURLs(previousPhotoURLs);
        optimisticURLs.forEach(url => URL.revokeObjectURL(url));
        setUploadingPhoto(false);
      },
      successMessage: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`,
      errorMessage: 'Failed to upload photos'
    });
  };


  const removePhoto = async (index) => {
    haptic.light();

    const previousPhotoURLs = [...photoURLs];
    const updatedPhotoURLs = photoURLs.filter((_, i) => i !== index).filter(url => url !== undefined && url !== null);

    await executeOptimistic({
      optimisticUpdate: () => {
        setPhotoURLs(updatedPhotoURLs);
      },
      serverUpdate: async () => {
        await updateDoc(doc(db, 'checkins', checkIn.id), {
          photoURLs: updatedPhotoURLs,
        });
      },
      rollback: () => {
        setPhotoURLs(previousPhotoURLs);
      },
      successMessage: 'Photo removed',
      errorMessage: 'Failed to remove photo'
    });
  };

  const isAlerted = checkIn.status === 'alerted';

  if (showSafeLoader) {
    // Check if this is user's first check-in completion
    const isFirstCheckIn = (userData?.stats?.completedCheckIns || 0) === 0;
    return <SafeLoader isFirstCheckIn={isFirstCheckIn} />;
  }

  // Format time for display (MM:SS or HH:MM:SS)
  const formatTimeDisplay = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const totalDuration = checkIn.duration * 60 * 1000;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  // Get check-in title based on type
  const getCheckInTitle = () => {
    // Check for rideshare (notes format: "🚗 Rideshare - Vehicle: {rego}")
    if (checkIn.notes?.includes('🚗 Rideshare - Vehicle:')) {
      const regoMatch = checkIn.notes.match(/Vehicle: (.+)/);
      const rego = regoMatch ? regoMatch[1].trim() : '';
      return rego ? `Rideshare - ${rego}` : 'Rideshare';
    }
    
    // Check for walking (notes format: "🚶‍♀️ Walking alone")
    if (checkIn.notes?.includes('🚶‍♀️ Walking alone') || checkIn.notes?.includes('Walking alone')) {
      return 'Walking';
    }
    
    // Check for quick meet - if meetingWith exists and location is empty/not set, it's likely quick meet
    if (checkIn.meetingWith) {
      // If location is not set or is "No location set", it's likely a quick meet
      if (!currentLocation || currentLocation === 'No location set' || !checkIn.location) {
        return `Quick Meet - ${checkIn.meetingWith}`;
      }
      // Otherwise it's a custom check-in with meetingWith, so just show the name
      return checkIn.meetingWith;
    }
    
    // Custom check-in: use location if available
    if (currentLocation && currentLocation !== 'No location set') {
      return currentLocation;
    }
    
    // Fallback to default
    return 'Active Check-in';
  };

  // Handle photo upload button click
  const handlePhotoUploadClick = () => {
    if (!isAlerted && photoURLs.length < 5) {
      haptic.light();
      fileInputRef.current?.click();
    }
  };

  // Check if ending soon (less than 20% time remaining)
  const isEndingSoon = () => {
    const totalDuration = checkIn.duration * 60 * 1000;
    return timeLeft > 0 && (timeLeft / totalDuration) < 0.2;
  };

  return (
    <div ref={cardRef} className={`flex flex-col overflow-hidden rounded-xl bg-surface-light/80 dark:bg-gray-800/80 shadow-soft backdrop-blur-sm ${isAlerted ? 'border-2 border-danger' : ''}`}>
      <div className="flex w-full grow flex-col items-stretch justify-center gap-4 p-5">
        {/* Header with title and timer */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-display text-2xl leading-tight text-text-primary dark:text-gray-100">
              {getCheckInTitle()}
            </p>
            {isEndingSoon() && !isAlerted && (
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-300 dark:from-yellow-500/50 dark:to-orange-500/50 px-3 py-1 text-xs font-bold text-yellow-900 dark:text-yellow-100 shadow-inner-soft">
                <span className="material-symbols-outlined !text-base">hourglass_top</span>
                Ending Soon
              </span>
            )}
            {!isEndingSoon() && !isAlerted && !checkIn.isTest && (
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 px-3 py-1 text-xs font-bold text-text-primary dark:text-gray-200 shadow-inner-soft">
                <span className="material-symbols-outlined !text-base">schedule</span>
                Active
              </span>
            )}
            {checkIn.isTest && (
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 text-xs font-bold">
                🧪 Test
              </span>
            )}
            {isAlerted && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 text-xs font-bold">
                🚨 ALERTED
              </span>
            )}
          </div>
          <div className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400">
            {timeLeft === 0 ? '00:00:00' : formatTimeDisplay(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isAlerted 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : isEndingSoon()
                ? 'bg-gradient-to-r from-accent to-orange-400'
                : 'bg-gradient-to-r from-primary to-secondary'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Status message */}
        {!isAlerted && (
          <p className="text-sm font-semibold text-text-secondary dark:text-gray-400">
            {isEndingSoon() 
              ? "Just a little longer! Let your guardians know you're safe."
              : "Your besties are watching over you. Check in when you're safe!"}
          </p>
        )}

        {isAlerted && (
          <p className="text-sm font-semibold text-danger dark:text-red-400">
            Your besties have been alerted! They know you haven't checked in.
          </p>
        )}

        {/* Extend time buttons */}
        {!isAlerted && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExtend(15)}
              disabled={extendingButton !== null}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700 text-sm font-bold leading-normal text-text-secondary dark:text-gray-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +15m
            </button>
            <button
              onClick={() => handleExtend(30)}
              disabled={extendingButton !== null}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700 text-sm font-bold leading-normal text-text-secondary dark:text-gray-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +30m
            </button>
            <button
              onClick={() => handleExtend(60)}
              disabled={extendingButton !== null}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700 text-sm font-bold leading-normal text-text-secondary dark:text-gray-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +60m
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 bg-white/50 dark:bg-gray-800/50 p-3">
        <div className="flex flex-1 gap-3">
          <button
            onClick={() => setShowEditTimeModal(true)}
            className="flex h-12 min-w-[48px] max-w-[480px] flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700 text-sm font-bold leading-normal text-text-secondary dark:text-gray-300 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">more_time</span>
          </button>
          <label
            onClick={handlePhotoUploadClick}
            className="flex h-12 min-w-[48px] max-w-[480px] flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-100 dark:bg-gray-700 text-sm font-bold leading-normal text-text-secondary dark:text-gray-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isAlerted || uploadingPhoto || photoURLs.length >= 5}
            />
            <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
          </label>
        </div>
        <button
          ref={safeButtonRef}
          onClick={isAlerted ? () => {
            haptic.warning();
            handleComplete(true);
          } : async () => {
            // If in checkedIn tutorial step, show next steps info
            if (currentCheckInTutorialStep === 'checkedIn') {
              // Show next steps information
              toast.success('Great job! 🎉\n\nNext steps:\n• You\'ll see a success screen\n• Then you\'ll return to the home page\n• We\'ll show you how to continue learning about the app!', {
                duration: 6000,
                icon: '💜'
              });
              await handleComplete();
              // The step will advance in SafeLoader/HomePage after check-in completes
            } else {
              await handleComplete();
            }
          }}
          disabled={loading}
          className="flex min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-lg h-12 px-4 bg-gradient-to-br from-green-300 to-cyan-300 dark:from-green-500 dark:to-cyan-500 text-green-900 dark:text-green-100 text-base font-bold leading-normal shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-xl">verified</span>
          <span className="truncate">I'm Safe!</span>
        </button>
      </div>

      {/* Extended details section - collapsible or always visible */}
      <div className="px-5 pb-4 space-y-4">
        {/* Display photos if any */}
        {photoURLs.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-text-secondary dark:text-gray-400 mb-2">
              Photos ({photoURLs.length}/5)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photoURLs.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Check-in ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl bg-gray-200 dark:bg-gray-700"
                    loading="lazy"
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
          </div>
        )}

        {/* Notes Section */}
        <CheckInNotes
          notes={notes}
          setNotes={setNotes}
          editingNotes={editingNotes}
          setEditingNotes={setEditingNotes}
          onSaveNotes={handleSaveNotes}
          isAlerted={isAlerted}
          checkInNotes={checkIn.notes}
        />

        {/* Meeting With & Social Media */}
        {(checkIn.meetingWith || checkIn.socialMediaLinks) && (
          <div>
            {checkIn.meetingWith && (
              <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50/80'} p-3 rounded-xl mb-2 backdrop-blur-sm`}>
                <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>MEETING WITH:</div>
                <p className="text-sm text-text-primary dark:text-gray-200 font-semibold">{checkIn.meetingWith}</p>
              </div>
            )}
            {checkIn.socialMediaLinks && (
              <div className={`${isDark ? 'bg-purple-900/30' : 'bg-purple-50/80'} p-3 rounded-xl border-2 ${isDark ? 'border-purple-800/50' : 'border-purple-200/50'} backdrop-blur-sm`}>
                <div className={`text-xs font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'} mb-1`}>THEIR SOCIAL MEDIA:</div>
                <p className="text-sm text-text-primary dark:text-gray-200">{checkIn.socialMediaLinks}</p>
              </div>
            )}
          </div>
        )}

        {/* Besties count */}
        <div>
          <div className="text-sm text-text-secondary dark:text-gray-400 mb-2">
            Watching over you: {checkIn.bestieIds?.length || 0} besties
          </div>
        </div>

        {/* Created Time */}
        <div className="text-xs text-text-secondary dark:text-gray-500 text-center">
          Started {formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true })}
        </div>
      </div>

      {/* Passcode Verification Modal */}
      {showPasscodeModal && (
        <PasscodeModal
          enteredPasscode={enteredPasscode}
          setEnteredPasscode={setEnteredPasscode}
          onSubmit={handlePasscodeSubmit}
          onClose={() => {
            setShowPasscodeModal(false);
            setEnteredPasscode('');
          }}
          isDark={isDark}
        />
      )}

      {/* Edit Time Modal */}
      <EditTimeModal
        isOpen={showEditTimeModal}
        onClose={() => setShowEditTimeModal(false)}
        checkInId={checkIn.id}
        currentAlertTime={optimisticAlertTime || 
          (checkIn.alertTime?.toDate ? checkIn.alertTime.toDate() : new Date())}
        onTimeUpdated={(newTime) => setOptimisticAlertTime(newTime)}
        isDark={isDark}
      />

      {/* Tutorial Overlay for checkedIn step */}
      {currentCheckInTutorialStep === 'checkedIn' && cardRef.current && !tooltipDismissed && (
        <CheckInTutorialOverlay
          currentStep="checkedIn"
          onStepComplete={(action) => {
            if (action === 'continue') {
              // User clicked "Got it" - dismiss tooltip but keep tutorial state
              setTooltipDismissed(true);
            }
          }}
          onSkipTutorial={() => {
            setCheckInTutorialStep(null);
          }}
          highlightedElementRef={cardRef}
          tooltipConfig={{
            title: 'Your Active Check-In',
            body: `This is your active check-in page! Here you can:\n• Add notes about your situation\n• Add photos for your besties\n• Add more time if you need longer\n• Update your location\n\nWhen you're ready to complete your check-in, click the "I'm Safe" button. This will mark your check-in as complete and let your besties know you're safe! 💜`,
            overlayOnElement: false,
            buttons: [
              { text: 'Got it', action: 'continue', primary: true }
            ]
          }}
        />
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(CheckInCard, (prevProps, nextProps) => {
  // Only re-render if checkIn data actually changed
  return prevProps.checkIn?.id === nextProps.checkIn?.id &&
         prevProps.checkIn?.status === nextProps.checkIn?.status &&
         prevProps.checkIn?.alertTime?.toMillis?.() === nextProps.checkIn?.alertTime?.toMillis?.() &&
         JSON.stringify(prevProps.checkIn?.photoURLs) === JSON.stringify(nextProps.checkIn?.photoURLs);
});
