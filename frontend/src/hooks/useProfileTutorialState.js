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

      // Check Firestore (cross-device sync)
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
        console.error('Error loading Profile tutorial state:', error);
      }

      setIsLoading(false);
    };

    loadState();
  }, [currentUser]);

  const startTutorial = () => {
    setTutorialActive(true);
    setCurrentStep(1); // Skip welcome card (0), go straight to step 1
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

    // Save to both localStorage and Firestore
    await saveTutorialState('profile', { key: 'completed', value: true }, async () => {
      if (currentUser) {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        await updateDoc(tutorialsRef, {
          'profile.completed': true,
          'profile.completedAt': new Date()
        });
      }
    });

    localStorage.setItem('profile_tutorial_completed_at', Date.now().toString());
    
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
        console.error('Error saving Profile tutorial dismissal:', error);
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

    // Clear localStorage
    localStorage.removeItem('profile_tutorial_completed');
    localStorage.removeItem('profile_tutorial_dismissed');
    localStorage.removeItem('profile_tutorial_completed_at');

    // Clear Firestore
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
        console.error('Error resetting Profile tutorial in Firestore:', error);
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
    resetTutorial
  };
};

