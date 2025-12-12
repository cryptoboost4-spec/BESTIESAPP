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
  const [tutorialStateLoaded, setTutorialStateLoaded] = useState(false);

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
    console.log('[Tutorial] Initial state loaded from localStorage:', { localComplete, localStep });

    // Then sync with Firestore (cross-device)
    const syncWithFirestore = async () => {
      try {
        console.log('[Tutorial] Starting Firestore sync...');
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const firestoreComplete = data.checkInTutorialComplete || false;
          let firestoreStep = data.currentCheckInTutorialStep || null;

          console.log('[Tutorial] Firestore state:', { firestoreComplete, firestoreStep });

          // Validate Firestore step
          if (firestoreStep && !VALID_STEPS.includes(firestoreStep)) {
            console.warn('[Tutorial] Invalid Firestore step detected:', firestoreStep, '- cleaning up');
            firestoreStep = null;
            try {
              await updateDoc(userRef, {
                currentCheckInTutorialStep: null
              });
            } catch (error) {
              console.error('[Tutorial] Error cleaning up invalid step:', error);
            }
          }

          // Firestore takes precedence if it exists
          if (firestoreComplete !== localComplete || firestoreStep !== localStep) {
            console.log('[Tutorial] Firestore state differs from localStorage, updating:', {
              firestoreComplete,
              firestoreStep,
              localComplete,
              localStep
            });
            setCheckInTutorialComplete(firestoreComplete);
            setCurrentCheckInTutorialStep(firestoreStep);

            // Update localStorage to match Firestore
            localStorage.setItem('checkInTutorial_complete', firestoreComplete.toString());
            if (firestoreStep) {
              localStorage.setItem('current_checkInTutorial_step', firestoreStep);
            } else {
              localStorage.removeItem('current_checkInTutorial_step');
            }
          } else {
            console.log('[Tutorial] Firestore state matches localStorage, no update needed');
          }
        } else {
          console.log('[Tutorial] User document does not exist in Firestore');
        }
        
        // Mark sync as complete
        console.log('[Tutorial] Firestore sync completed');
        setTutorialStateLoaded(true);
      } catch (error) {
        console.error('[Tutorial] Error syncing check-in tutorial state with Firestore:', error);
        // Continue with localStorage state if Firestore fails
        // Still mark as loaded so tutorial can proceed
        setTutorialStateLoaded(true);
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
    console.log('[Tutorial] setCheckInTutorialStep called with:', step);
    
    // Validate step is one of the allowed values
    if (step && !VALID_STEPS.includes(step)) {
      console.warn('[Tutorial] Invalid check-in tutorial step attempted:', step, '- ignoring');
      return;
    }

    // If setting step, ensure tutorial is not marked complete
    if (step) {
      console.log('[Tutorial] Setting step, marking tutorial as not complete');
      setCheckInTutorialComplete(false);
    }

    // Update state synchronously (this happens immediately)
    console.log('[Tutorial] Updating state synchronously - step will be available immediately');
    setCurrentCheckInTutorialStep(step);

    // Update localStorage (synchronous)
    if (step) {
      localStorage.setItem('current_checkInTutorial_step', step);
      localStorage.setItem('checkInTutorial_complete', 'false');
      console.log('[Tutorial] Updated localStorage with step:', step);
    } else {
      localStorage.removeItem('current_checkInTutorial_step');
      console.log('[Tutorial] Removed step from localStorage');
    }

    // Update Firestore (async, but state is already updated)
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          currentCheckInTutorialStep: step,
          ...(step ? { checkInTutorialComplete: false } : {})
        });
        console.log('[Tutorial] Updated Firestore with step:', step);
      } catch (error) {
        console.error('[Tutorial] Error updating check-in tutorial step in Firestore:', error);
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

  // Log state changes
  useEffect(() => {
    console.log('[Tutorial] State changed:', {
      checkInTutorialComplete,
      currentCheckInTutorialStep,
      tutorialStateLoaded
    });
  }, [checkInTutorialComplete, currentCheckInTutorialStep, tutorialStateLoaded]);

  return {
    checkInTutorialComplete,
    currentCheckInTutorialStep,
    markCheckInTutorialComplete,
    setCheckInTutorialStep,
    resetCheckInTutorial,
    isTutorialStateLoaded: tutorialStateLoaded,
    validSteps: VALID_STEPS
  };
};
