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

const CheckInCard = ({ checkIn }) => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [extendingButton, setExtendingButton] = useState(null); // Track which extend button is loading
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(checkIn.notes || '');
  const [photoURLs, setPhotoURLs] = useState(checkIn.photoURLs || checkIn.photoURL ? [checkIn.photoURL] : []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [optimisticAlertTime, setOptimisticAlertTime] = useState(null); // For optimistic updates
  const { executeOptimistic } = useOptimisticUpdate();

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

  const handleComplete = async () => {
    // Check if user has a safety passcode set
    if (userData?.security?.safetyPasscode) {
      setShowPasscodeModal(true);
      return;
    }

    // If no passcode, proceed with completion
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
      // Correct passcode - proceed with completion
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
    // Navigate home immediately, complete check-in in background
    navigate('/');

    // Show success message as popup
    toast.success('You\'re safe! Welcome home 💜', {
      duration: 4000,
      icon: '✅',
    });

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
    } catch (error) {
      console.error('Error completing check-in:', error);
      toast.error('Failed to complete check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuressCode = async () => {
    // Navigate home immediately to look normal
    navigate('/');

    // Show fake success message
    toast.success('You\'re safe! Welcome home 💜', {
      duration: 4000,
      icon: '✅',
    });

    // Secretly trigger emergency alert to all besties in circle
    try {
      // Complete the check-in normally (so it looks legitimate)
      await apiService.completeCheckIn({ checkInId: checkIn.id });

      // Create a secret emergency alert
      const alertData = {
        userId: checkIn.userId,
        checkInId: checkIn.id,
        type: 'duress_code_used',
        message: `🚨 DURESS CODE USED - ${userData?.displayName || 'User'} may be in danger!`,
        location: checkIn.location,
        timestamp: Timestamp.now(),
        priority: 'critical',
      };

      // Add to alerts collection
      await addDoc(collection(db, 'alerts'), alertData);

      // Note: The backend should handle sending notifications to besties in the circle
      // This is done silently without showing any indication to the user
    } catch (error) {
      console.error('Error handling duress code:', error);
      // Don't show error to user - maintain the illusion that everything is normal
    }
  };

  const handleExtend = async (minutes) => {
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
            const storageRef = ref(storage, `checkin-photos/${checkIn.userId}/${Date.now()}_${i}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            newPhotoURLs.push(downloadURL);
          }

          const updatedPhotoURLs = [...previousPhotoURLs, ...newPhotoURLs];

          // Update Firestore
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

  const removePhoto = async (index) => {
    const previousPhotoURLs = [...photoURLs];
    const updatedPhotoURLs = photoURLs.filter((_, i) => i !== index);

    await executeOptimistic({
      optimisticUpdate: () => {
        // Remove photo immediately from UI
        setPhotoURLs(updatedPhotoURLs);
      },
      serverUpdate: async () => {
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
              +1h
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
            onClick={handleComplete}
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
              {checkIn.location}
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
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm font-semibold text-gray-600">
                {uploadingPhoto ? 'Uploading...' : photoURLs.length > 0 ? 'Add More Photos' : 'Add Photos'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
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
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none resize-none"
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
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-xs font-semibold text-gray-500">NOTES:</div>
                  {!isAlerted && (
                    <button
                      onClick={() => setEditingNotes(true)}
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
                onClick={() => setEditingNotes(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 text-sm font-semibold text-gray-600 hover:border-primary hover:bg-primary/5 transition-all"
              >
                📝 Add Notes
              </button>
            )}
          </div>
        )}
      </div>

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
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-display text-text-primary mb-2">🔒 Enter Passcode</h2>
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
                className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-center text-3xl tracking-widest"
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
