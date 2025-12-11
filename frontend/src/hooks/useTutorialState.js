import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Hook to manage tutorial state in both localStorage and Firestore
 * Provides quick access via localStorage and syncs across devices via Firestore
 */
export const useTutorialState = () => {
  const { currentUser, userData } = useAuth();
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(null);

  // Load initial state from localStorage and Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Load from localStorage first (quick access)
    const localComplete = localStorage.getItem('tutorial_complete') === 'true';
    const localStep = localStorage.getItem('current_tutorial_step');
    
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
          const firestoreStep = data.currentTutorialStep || null;

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
    setCurrentTutorialStep(step);
    
    // Update localStorage
    if (step) {
      localStorage.setItem('current_tutorial_step', step);
    } else {
      localStorage.removeItem('current_tutorial_step');
    }

    // Update Firestore
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          currentTutorialStep: step
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

