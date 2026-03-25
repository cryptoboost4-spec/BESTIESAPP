import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { loadTutorialState, saveTutorialState } from '../utils/tutorialHelpers';
import { getDocOnce } from '../utils/firestoreHelpers';

/**
 * Hook to manage Besties page tutorial state
 */
export const useBestiesTutorialState = () => {
  const { currentUser } = useAuth();
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // null = not started, 1 = single step only
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tutorial state on mount
  useEffect(() => {
    const loadState = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      // Check localStorage first (fast)
      const completed = loadTutorialState('besties', 'completed');
      if (completed === true) {
        setIsCompleted(true);
        setIsLoading(false);
        return;
      }

      // Try Firestore but don't let it block the tutorial
      // Firestore is optional - tutorial works fine with localStorage only
      // Uses onSnapshot with error callback instead of getDoc to prevent Firebase
      // from logging "Uncaught Error in snapshot listener" before our catch runs.
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        const docSnap = await getDocOnce(tutorialsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.besties?.completed) {
            setIsCompleted(true);
            saveTutorialState('besties', { key: 'completed', value: true }, null);
          }
        }
      } catch (error) {
        // Firestore error is non-critical - tutorial will work with localStorage only
        // This is expected for new users or if Firestore rules haven't been set up yet
        console.debug('[Besties Tutorial] Firestore not available (expected for new users) - using localStorage only');
      } finally {
        // Always set loading to false, even if Firestore fails
        setIsLoading(false);
      }
    };

    loadState();
  }, [currentUser]);

  const startTutorial = () => {
    setTutorialActive(true);
    setCurrentStep(1); // Skip welcome card (0), go straight to step 1
  };

  const nextStep = () => {
    // Tutorial is single step - complete immediately when called
    completeTutorial();
  };

  const skipTutorial = async () => {
    setTutorialActive(false);
    setCurrentStep(null);
    await saveDismissal();
  };

  const completeTutorial = async () => {
    setTutorialActive(false);
    setCurrentStep(null);
    setIsCompleted(true);

    // Save to localStorage (immediate)
    localStorage.setItem('besties_tutorial_completed', 'true');
    localStorage.setItem('besties_tutorial_completed_at', Date.now().toString());

    // Try to save to Firestore (optional, don't block on errors)
    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'besties.completed': true,
          'besties.completedAt': new Date()
        });
      } catch (error) {
        // Firestore save failed - that's okay, localStorage is sufficient
        console.debug('[Besties Tutorial] Could not sync to Firestore (localStorage saved successfully)');
      }
    }
    
    // Trigger celebration (parent component will handle)
    return true;
  };

  const saveDismissal = async () => {
    localStorage.setItem('besties_tutorial_dismissed', Date.now().toString());

    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'besties.dismissed': true,
          'besties.dismissedAt': new Date()
        });
      } catch (error) {
        // Firestore save failed - that's okay, localStorage is sufficient
        console.debug('[Besties Tutorial] Could not sync dismissal to Firestore (localStorage saved)');
      }
    }
  };

  const pauseTutorial = () => setIsPaused(true);
  const resumeTutorial = () => setIsPaused(false);
  
  const stopTutorial = () => {
    setTutorialActive(false);
  };

  const resetTutorial = async () => {
    setTutorialActive(false);
    setCurrentStep(null);
    setIsCompleted(false);
    setIsPaused(false);

    // Clear localStorage (immediate)
    localStorage.removeItem('besties_tutorial_completed');
    localStorage.removeItem('besties_tutorial_dismissed');
    localStorage.removeItem('besties_tutorial_completed_at');

    // Try to clear Firestore (optional)
    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'besties.completed': false,
          'besties.completedAt': null,
          'besties.dismissed': false,
          'besties.dismissedAt': null
        });
      } catch (error) {
        // Firestore clear failed - that's okay, localStorage is cleared
        console.debug('[Besties Tutorial] Could not reset in Firestore (localStorage reset successfully)');
      }
    }
  };

  return {
    tutorialActive,
    currentStep,
    isCompleted,
    isPaused,
    isLoading,
    startTutorial,
    nextStep,
    setCurrentStep,
    skipTutorial,
    completeTutorial,
    pauseTutorial,
    resumeTutorial,
    resetTutorial,
    setTutorialActive: stopTutorial
  };
};

