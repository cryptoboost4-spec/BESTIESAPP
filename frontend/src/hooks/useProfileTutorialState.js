import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { loadTutorialState, saveTutorialState } from '../utils/tutorialHelpers';

/**
 * Hook to manage Profile page tutorial state
 */
export const useProfileTutorialState = () => {
  const { currentUser } = useAuth();
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // null = not started, 0 = welcome card, 1-6 = steps
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
      const completed = loadTutorialState('profile', 'completed');
      if (completed === true) {
        setIsCompleted(true);
        setIsLoading(false);
        return;
      }

      // Try Firestore but don't let it block the tutorial
      // Firestore is optional - tutorial works fine with localStorage only
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        const docSnap = await getDoc(tutorialsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profile?.completed) {
            setIsCompleted(true);
            saveTutorialState('profile', { key: 'completed', value: true }, null);
          }
        }
      } catch (error) {
        // Firestore error is non-critical - tutorial will work with localStorage only
        // This is expected for new users or if Firestore rules haven't been set up yet
        console.debug('[Profile Tutorial] Firestore not available (expected for new users) - using localStorage only');
      } finally {
        // Always set loading to false, even if Firestore fails
        setIsLoading(false);
      }
    };

    loadState();
  }, [currentUser]);

  const startTutorial = () => {
    setTutorialActive(true);
    setCurrentStep(1); // Single step tutorial
  };

  const nextStep = () => {
    if (currentStep === 6) {
      completeTutorial();
    } else {
      setCurrentStep(currentStep + 1);
    }
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
    localStorage.setItem('profile_tutorial_completed', 'true');
    localStorage.setItem('profile_tutorial_completed_at', Date.now().toString());

    // Try to save to Firestore (optional, don't block on errors)
    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'profile.completed': true,
          'profile.completedAt': new Date()
        });
      } catch (error) {
        // Firestore save failed - that's okay, localStorage is sufficient
        console.debug('[Profile Tutorial] Could not sync to Firestore (localStorage saved successfully)');
      }
    }
    
    // Trigger celebration (parent component will handle)
    return true;
  };

  const saveDismissal = async () => {
    localStorage.setItem('profile_tutorial_dismissed', Date.now().toString());

    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'profile.dismissed': true,
          'profile.dismissedAt': new Date()
        });
      } catch (error) {
        // Firestore save failed - that's okay, localStorage is sufficient
        console.debug('[Profile Tutorial] Could not sync dismissal to Firestore (localStorage saved)');
      }
    }
  };

  const pauseTutorial = () => setIsPaused(true);
  const resumeTutorial = () => setIsPaused(false);

  const resetTutorial = async () => {
    setTutorialActive(false);
    setCurrentStep(null);
    setIsCompleted(false);
    setIsPaused(false);

    // Clear localStorage (immediate)
    localStorage.removeItem('profile_tutorial_completed');
    localStorage.removeItem('profile_tutorial_dismissed');
    localStorage.removeItem('profile_tutorial_completed_at');

    // Try to clear Firestore (optional)
    if (currentUser) {
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'profile.completed': false,
          'profile.completedAt': null,
          'profile.dismissed': false,
          'profile.dismissedAt': null
        });
      } catch (error) {
        // Firestore clear failed - that's okay, localStorage is cleared
        console.debug('[Profile Tutorial] Could not reset in Firestore (localStorage reset successfully)');
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
    setTutorialActive,
    skipTutorial,
    completeTutorial,
    pauseTutorial,
    resumeTutorial,
    resetTutorial
  };
};

