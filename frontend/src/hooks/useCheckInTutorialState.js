import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Valid steps for check-in tutorial (constant)
const VALID_STEPS = [
  'location',
  'whoMeeting',
  'socialMedia',
  'duration',
  'bestieSelection',
  'notesPhotos',
  'final'
];

/**
 * Hook to manage check-in tutorial state
 * First-time only tutorial that walks users through creating their first check-in
 */
export const useCheckInTutorialState = () => {
  const { currentUser } = useAuth();
  const [checkInTutorialComplete, setCheckInTutorialComplete] = useState(false);
  const [currentCheckInTutorialStep, setCurrentCheckInTutorialStep] = useState(null);

  // Load initial state from localStorage and Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Load from localStorage first (quick access)
    const localComplete = localStorage.getItem('checkInTutorial_complete') === 'true';
    let localStep = localStorage.getItem('current_checkInTutorial_step');

    // Validate step
    if (localStep && !VALID_STEPS.includes(localStep)) {
      localStorage.removeItem('current_checkInTutorial_step');
      localStep = null;
    }

    setCheckInTutorialComplete(localComplete);
    setCurrentCheckInTutorialStep(localStep || null);

    // Then sync with Firestore (cross-device)
    const syncWithFirestore = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const firestoreComplete = data.checkInTutorialComplete || false;
          let firestoreStep = data.currentCheckInTutorialStep || null;

          // Validate Firestore step
          if (firestoreStep && !VALID_STEPS.includes(firestoreStep)) {
            firestoreStep = null;
            try {
              await updateDoc(userRef, {
                currentCheckInTutorialStep: null
              });
            } catch (error) {
              console.error('Error cleaning up invalid step:', error);
            }
          }

          // Firestore takes precedence if it exists
          if (firestoreComplete !== localComplete || firestoreStep !== localStep) {
            setCheckInTutorialComplete(firestoreComplete);
            setCurrentCheckInTutorialStep(firestoreStep);

            // Update localStorage to match Firestore
            localStorage.setItem('checkInTutorial_complete', firestoreComplete.toString());
            if (firestoreStep) {
              localStorage.setItem('current_checkInTutorial_step', firestoreStep);
            } else {
              localStorage.removeItem('current_checkInTutorial_step');
            }
          }
        }
      } catch (error) {
        console.error('Error syncing check-in tutorial state with Firestore:', error);
        // Continue with localStorage state if Firestore fails
      }
    };

    syncWithFirestore();
  }, [currentUser]);

  // Mark tutorial as complete
  const markCheckInTutorialComplete = async (skipFirestore = false) => {
    setCheckInTutorialComplete(true);
    setCurrentCheckInTutorialStep(null);

    // Update localStorage
    localStorage.setItem('checkInTutorial_complete', 'true');
    localStorage.removeItem('current_checkInTutorial_step');

    // Update Firestore (unless explicitly skipped)
    if (!skipFirestore && currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          checkInTutorialComplete: true,
          currentCheckInTutorialStep: null
        });
      } catch (error) {
        console.error('Error updating check-in tutorial state in Firestore:', error);
        // Non-critical - localStorage is updated
      }
    }
  };

  // Update current tutorial step
  const setCheckInTutorialStep = async (step) => {
    // Validate step is one of the allowed values
    if (step && !VALID_STEPS.includes(step)) {
      console.warn('Invalid check-in tutorial step attempted:', step, '- ignoring');
      return;
    }

    // If setting step, ensure tutorial is not marked complete
    if (step) {
      setCheckInTutorialComplete(false);
    }

    setCurrentCheckInTutorialStep(step);

    // Update localStorage
    if (step) {
      localStorage.setItem('current_checkInTutorial_step', step);
      localStorage.setItem('checkInTutorial_complete', 'false');
    } else {
      localStorage.removeItem('current_checkInTutorial_step');
    }

    // Update Firestore
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          currentCheckInTutorialStep: step,
          ...(step ? { checkInTutorialComplete: false } : {})
        });
      } catch (error) {
        console.error('Error updating check-in tutorial step in Firestore:', error);
        // Non-critical - localStorage is updated
      }
    }
  };

  // Reset tutorial (for testing or if user wants to retake)
  const resetCheckInTutorial = async () => {
    setCheckInTutorialComplete(false);
    setCurrentCheckInTutorialStep(null);

    localStorage.removeItem('checkInTutorial_complete');
    localStorage.removeItem('current_checkInTutorial_step');

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          checkInTutorialComplete: false,
          currentCheckInTutorialStep: null
        });
      } catch (error) {
        console.error('Error resetting check-in tutorial state in Firestore:', error);
      }
    }
  };

  return {
    checkInTutorialComplete,
    currentCheckInTutorialStep,
    markCheckInTutorialComplete,
    setCheckInTutorialStep,
    resetCheckInTutorial,
    validSteps: VALID_STEPS
  };
};
