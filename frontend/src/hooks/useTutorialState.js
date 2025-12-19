import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Hook to manage tutorial state in both localStorage and Firestore
 * Provides quick access via localStorage and syncs across devices via Firestore
 */
export const useTutorialState = () => {
  const { currentUser } = useAuth();
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(null);
  const [tutorialStateLoaded, setTutorialStateLoaded] = useState(false);
  const currentStepRef = useRef(null); // Track current step to prevent duplicate updates

  // Load initial state from localStorage and Firestore
  // Only run once when currentUser changes (not on every render)
  useEffect(() => {
    if (!currentUser) {
      setTutorialStateLoaded(true);
      return;
    }

    // Prevent multiple simultaneous syncs
    let isMounted = true;

    // Load from localStorage first (quick access)
    const localComplete = localStorage.getItem('tutorial_complete') === 'true';
    let localStep = localStorage.getItem('current_tutorial_step');
    
    // Clean up old 'intro' step if it exists
    if (localStep === 'intro') {
      localStorage.removeItem('current_tutorial_step');
      localStep = null;
    }
    
    setTutorialComplete(localComplete);
    const initialStep = localStep || null;
    setCurrentTutorialStep(initialStep);
    currentStepRef.current = initialStep;

    // Then sync with Firestore (cross-device) - only once on mount
    const syncWithFirestore = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const firestoreComplete = data.tutorialComplete || false;
          let firestoreStep = data.currentTutorialStep || null;

          // Clean up old 'intro' step if it exists in Firestore
          if (firestoreStep === 'intro') {
            firestoreStep = null;
            // Update Firestore to remove intro
            try {
              await updateDoc(userRef, {
                currentTutorialStep: null
              });
            } catch (error) {
              console.error('[useTutorialState] Error cleaning up intro step:', error);
            }
          }

          // Firestore takes precedence if it exists
          const finalStep = firestoreStep === 'intro' ? null : firestoreStep;
          const finalComplete = firestoreComplete;
          
          if (!isMounted) return; // Check again before updating state
          
          if (finalComplete !== localComplete || finalStep !== localStep) {
            setTutorialComplete(finalComplete);
            setCurrentTutorialStep(finalStep);
            currentStepRef.current = finalStep;
            
            // Update localStorage to match Firestore
            localStorage.setItem('tutorial_complete', finalComplete.toString());
            if (finalStep) {
              localStorage.setItem('current_tutorial_step', finalStep);
            } else {
              localStorage.removeItem('current_tutorial_step');
            }
          }
        }
      } catch (error) {
        console.error('[useTutorialState] Error syncing tutorial state with Firestore:', error);
        // Continue with localStorage state if Firestore fails
      } finally {
        if (isMounted) {
          console.log('[useTutorialState] Firestore sync completed, tutorialStateLoaded set to true');
          setTutorialStateLoaded(true);
        }
      }
    };

    syncWithFirestore();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]); // Only depend on uid, not the whole currentUser object

  // Safety net: Clean up 'intro' step if it somehow gets into state
  useEffect(() => {
    if (currentTutorialStep === 'intro') {
      console.warn('Detected invalid "intro" step in state, cleaning up...');
      setCurrentTutorialStep(null);
      localStorage.removeItem('current_tutorial_step');
      
      // Also clean up in Firestore if user is logged in
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        updateDoc(userRef, { currentTutorialStep: null }).catch(error => {
          console.error('Error cleaning up intro step in Firestore:', error);
        });
      }
    }
  }, [currentTutorialStep, currentUser]);

  // Update tutorial complete state
  const markTutorialComplete = async (skipFirestore = false) => {
    setTutorialComplete(true);
    setCurrentTutorialStep(null);
    currentStepRef.current = null;
    
    // Update localStorage
    localStorage.setItem('tutorial_complete', 'true');
    localStorage.removeItem('current_tutorial_step');

    // Update Firestore (unless explicitly skipped)
    if (!skipFirestore && currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          tutorialComplete: true,
          currentTutorialStep: null
        });
      } catch (error) {
        console.error('Error updating tutorial state in Firestore:', error);
        // Non-critical - localStorage is updated
      }
    }
  };

  // Update current tutorial step
  const setTutorialStep = async (step) => {
    // Silently clean up old 'intro' step if it's passed
    if (step === 'intro') {
      step = null;
    }
    
    // Validate step is one of the allowed values
    const validSteps = ['welcome', 'allButtons', 'quickCheckIns', 'afterQuickCheckIn', 'custom', 'rideshare', 'walking', 'quickmeet'];
    if (step && !validSteps.includes(step)) {
      console.warn('[useTutorialState] Invalid tutorial step attempted:', step, '- ignoring');
      return;
    }
    
    // Prevent duplicate updates if step is already set to the same value
    if (step === currentStepRef.current) {
      return; // Already set to this step, skip update
    }
    
    // If setting step, ensure tutorial is not marked complete
    if (step) {
      setTutorialComplete(false);
    }
    
    currentStepRef.current = step; // Update ref immediately
    setCurrentTutorialStep(step);
    
    // Update localStorage
    if (step) {
      localStorage.setItem('current_tutorial_step', step);
      localStorage.setItem('tutorial_complete', 'false');
    } else {
      localStorage.removeItem('current_tutorial_step');
    }

    // Update Firestore
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          currentTutorialStep: step,
          ...(step ? { tutorialComplete: false } : {})
        });
      } catch (error) {
        console.error('[useTutorialState] Error updating tutorial step in Firestore:', error);
        // Non-critical - localStorage is updated
      }
    }
  };

  // Reset tutorial (for testing or if user wants to retake)
  const resetTutorial = async () => {
    setTutorialComplete(false);
    setCurrentTutorialStep(null);
    currentStepRef.current = null;
    
    localStorage.removeItem('tutorial_complete');
    localStorage.removeItem('current_tutorial_step');

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          tutorialComplete: false,
          currentTutorialStep: null
        });
      } catch (error) {
        console.error('Error resetting tutorial state in Firestore:', error);
      }
    }
  };

  return {
    tutorialComplete,
    currentTutorialStep,
    tutorialStateLoaded,
    markTutorialComplete,
    setTutorialStep,
    resetTutorial
  };
};

