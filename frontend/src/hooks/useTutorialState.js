import { useState, useEffect } from 'react';
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

  // Load initial state from localStorage and Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Load from localStorage first (quick access)
    const localComplete = localStorage.getItem('tutorial_complete') === 'true';
    let localStep = localStorage.getItem('current_tutorial_step');
    
    // Clean up old 'intro' step if it exists
    if (localStep === 'intro') {
      localStorage.removeItem('current_tutorial_step');
      localStep = null;
    }
    
    setTutorialComplete(localComplete);
    setCurrentTutorialStep(localStep || null);

    // Then sync with Firestore (cross-device)
    const syncWithFirestore = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
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
              console.error('Error cleaning up intro step:', error);
            }
          }

          // Firestore takes precedence if it exists
          if (firestoreComplete !== localComplete || firestoreStep !== localStep) {
            setTutorialComplete(firestoreComplete);
            setCurrentTutorialStep(firestoreStep);
            
            // Update localStorage to match Firestore
            localStorage.setItem('tutorial_complete', firestoreComplete.toString());
            if (firestoreStep) {
              localStorage.setItem('current_tutorial_step', firestoreStep);
            } else {
              localStorage.removeItem('current_tutorial_step');
            }
          }
        }
      } catch (error) {
        console.error('Error syncing tutorial state with Firestore:', error);
        // Continue with localStorage state if Firestore fails
      }
    };

    syncWithFirestore();
  }, [currentUser]);

  // Update tutorial complete state
  const markTutorialComplete = async (skipFirestore = false) => {
    setTutorialComplete(true);
    setCurrentTutorialStep(null);
    
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
    // Validate step is one of the allowed values
    const validSteps = ['rideshare', 'walking', 'quickmeet', 'custom'];
    if (step && !validSteps.includes(step)) {
      console.warn('Invalid tutorial step attempted:', step, '- ignoring');
      return;
    }
    
    // If setting step, ensure tutorial is not marked complete
    if (step) {
      setTutorialComplete(false);
    }
    
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
        console.error('Error updating tutorial step in Firestore:', error);
        // Non-critical - localStorage is updated
      }
    }
  };

  // Reset tutorial (for testing or if user wants to retake)
  const resetTutorial = async () => {
    setTutorialComplete(false);
    setCurrentTutorialStep(null);
    
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
    markTutorialComplete,
    setTutorialStep,
    resetTutorial
  };
};

