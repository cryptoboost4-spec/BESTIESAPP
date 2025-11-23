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
import SafeLoader from './checkin/SafeLoader';
import CheckInTimer from './checkin/CheckInTimer';
import CheckInPhotos from './checkin/CheckInPhotos';
import CheckInNotes from './checkin/CheckInNotes';
import PasscodeModal from './checkin/PasscodeModal';

const CheckInCard = ({ checkIn }) => {
  const { userData } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSafeLoader, setShowSafeLoader] = useState(false);
  const [extendingButton, setExtendingButton] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(checkIn.notes || '');
  const [photoURLs, setPhotoURLs] = useState(checkIn.photoURLs || checkIn.photoURL ? [checkIn.photoURL] : []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [optimisticAlertTime, setOptimisticAlertTime] = useState(null);
  const { executeOptimistic } = useOptimisticUpdate();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(checkIn.location || '');

  // Passcode verification states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const alertTime = optimisticAlertTime || checkIn.alertTime.toDate();
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

  const completeCheckIn = async () => {
    setShowSafeLoader(true);

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

      // Keep loader showing for 2 seconds
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

    const currentAlertTime = optimisticAlertTime || checkIn.alertTime.toDate();
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
          setOptimisticAlertTime(checkInSnap.data().alertTime.toDate());
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

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUpdatingLocation(true);
    haptic.medium();

    try {
      // Get FAST location first
      const fastPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 10000
        });
      });

      const { latitude: fastLat, longitude: fastLng, accuracy: fastAccuracy } = fastPosition.coords;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${fastLat},${fastLng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      let locationName = `GPS: ${fastLat.toFixed(6)}, ${fastLng.toFixed(6)}`;
      if (data.results && data.results.length > 0) {
        locationName = data.results[0].formatted_address;
      }

      await updateDoc(doc(db, 'checkins', checkIn.id), {
        location: locationName,
        gpsCoords: { lat: fastLat, lng: fastLng },
        locationAccuracy: fastAccuracy,
        locationUpdatedAt: Timestamp.now(),
      });

      setCurrentLocation(locationName);
      toast.success('Location updated!');
      setUpdatingLocation(false);

      // Get accurate GPS in background
      navigator.geolocation.getCurrentPosition(
        async (accuratePosition) => {
          const { latitude: accLat, longitude: accLng, accuracy: accAccuracy } = accuratePosition.coords;

          if (fastAccuracy - accAccuracy > 50) {
            const accResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${accLat},${accLng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const accData = await accResponse.json();

            let accLocationName = `GPS: ${accLat.toFixed(6)}, ${accLng.toFixed(6)}`;
            if (accData.results && accData.results.length > 0) {
              accLocationName = accData.results[0].formatted_address;
            }

            await updateDoc(doc(db, 'checkins', checkIn.id), {
              location: accLocationName,
              gpsCoords: { lat: accLat, lng: accLng },
              locationAccuracy: accAccuracy,
              locationUpdatedAt: Timestamp.now(),
            });

            setCurrentLocation(accLocationName);
          }
        },
        (error) => {
          console.log('Background accurate GPS failed:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
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
    return <SafeLoader />;
  }

  return (
    <div className={`card p-6 ${isAlerted ? 'border-2 border-danger' : ''}`}>
      {/* Timer */}
      <CheckInTimer
        timeLeft={timeLeft}
        duration={checkIn.duration}
        isAlerted={isAlerted}
        onExtend={handleExtend}
        extendingButton={extendingButton}
      />

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
        <CheckInPhotos
          photoURLs={photoURLs}
          isAlerted={isAlerted}
          uploadingPhoto={uploadingPhoto}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={removePhoto}
        />
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
    </div>
  );
};

export default CheckInCard;
