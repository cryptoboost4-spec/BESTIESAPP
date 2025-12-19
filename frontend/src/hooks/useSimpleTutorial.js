import { useState, useEffect } from 'react';

/**
 * Simple tutorial hook - just tracks if a tutorial has been shown/completed
 * @param {string} tutorialKey - 'besties', 'profile', or 'settings'
 * @returns {{ showTutorial: boolean, completeTutorial: () => void, resetTutorial: () => void }}
 */
export const useSimpleTutorial = (tutorialKey) => {
  const storageKey = `${tutorialKey}Tutorial_complete`;
  
  // Initialize from localStorage
  const [isComplete, setIsComplete] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(storageKey);
    const isCompleteValue = stored === 'true';
    console.log(`[${tutorialKey} Tutorial] Initial state from localStorage:`, {
      storageKey,
      storedValue: stored,
      isComplete: isCompleteValue
    });
    return isCompleteValue;
  });
  
  const [isReady, setIsReady] = useState(false);

  // Mark as ready after initial load
  useEffect(() => {
    setIsReady(true);
    console.log(`[${tutorialKey} Tutorial] Hook ready. isComplete:`, isComplete);
  }, []);

  // Show tutorial if NOT complete and ready
  const showTutorial = isReady && !isComplete;
  
  // Debug logging
  useEffect(() => {
    console.log(`[${tutorialKey} Tutorial] State update:`, {
      isReady,
      isComplete,
      showTutorial,
      localStorageValue: typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    });
  }, [isReady, isComplete, showTutorial, storageKey, tutorialKey]);

  // Mark tutorial as complete
  const completeTutorial = () => {
    setIsComplete(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      console.log(`[${tutorialKey} Tutorial] Marked as complete`);
    }
  };

  // Reset tutorial (for testing)
  const resetTutorial = () => {
    setIsComplete(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      console.log(`[${tutorialKey} Tutorial] Reset`);
    }
  };

  return {
    showTutorial,
    isComplete,
    completeTutorial,
    resetTutorial
  };
};

export default useSimpleTutorial;

