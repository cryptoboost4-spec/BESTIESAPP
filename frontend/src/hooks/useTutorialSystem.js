import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Unified Tutorial System Hook
 *
 * Single source of truth for ALL tutorial state across the app.
 * Syncs between localStorage (fast cache) and Firestore (persistent source of truth).
 *
 * @returns {Object} Tutorial state and control functions
 */
export const useTutorialSystem = () => {
  const { currentUser } = useAuth();

  // Initialize state from localStorage (fast initial load)
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return getDefaultState();
    return loadFromLocalStorage();
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Load initial state from localStorage
  function loadFromLocalStorage() {
    try {
      // Check for new unified format first
      const unified = localStorage.getItem('_tutorial_system_state');
      if (unified) {
        return JSON.parse(unified);
      }

      // Fall back to migrating old keys
      return migrateOldKeys();
    } catch (error) {
      console.error('[TutorialSystem] Error loading from localStorage:', error);
      return getDefaultState();
    }
  }

  // Default state structure
  function getDefaultState() {
    return {
      home: {
        complete: false,
        currentStep: null,
      },
      checkIn: {
        complete: false,
        currentStep: null,
      },
      bestieCircle: {
        complete: false,
        currentStep: null,
        postTutorialStep: null,
        tutorialActive: false,
      },
      besties: {
        complete: false,
        tooltipDismissed: false,
      },
      profile: {
        complete: false,
        tooltipDismissed: false,
      },
      settings: {
        complete: false,
        currentStep: null,
      },
      system: {
        allComplete: false,
        onboardingComplete: false,
        lastUpdated: null,
        migrated: false,
      },
    };
  }

  // Migrate old localStorage keys to new unified format
  function migrateOldKeys() {
    console.log('[TutorialSystem] Migrating old localStorage keys...');

    const newState = getDefaultState();

    // Map old keys to new structure
    const migrations = {
      'tutorial_complete': (value) => {
        newState.home.complete = value === 'true';
      },
      'current_tutorial_step': (value) => {
        newState.home.currentStep = value;
      },
      'checkInTutorial_complete': (value) => {
        newState.checkIn.complete = value === 'true';
      },
      'current_checkInTutorial_step': (value) => {
        newState.checkIn.currentStep = value;
      },
      'bestieCircle_tutorialComplete': (value) => {
        newState.bestieCircle.complete = value === 'true';
      },
      'bestieCircle_postTutorialStep': (value) => {
        newState.bestieCircle.postTutorialStep = value;
      },
      'bestieCircle_tutorialActive': (value) => {
        newState.bestieCircle.tutorialActive = value === 'true';
      },
      'bestiesTutorial_complete': (value) => {
        newState.besties.complete = value === 'true';
      },
      'profileTutorial_complete': (value) => {
        newState.profile.complete = value === 'true';
      },
      'settingsTutorial_complete': (value) => {
        newState.settings.complete = value === 'true';
      },
    };

    // Perform migration
    Object.entries(migrations).forEach(([oldKey, migrate]) => {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        migrate(value);
        console.log(`[TutorialSystem] Migrated ${oldKey} = ${value}`);
      }
    });

    // Check if all tutorials are complete
    newState.system.allComplete =
      newState.home.complete &&
      newState.checkIn.complete &&
      newState.bestieCircle.complete &&
      newState.besties.complete &&
      newState.profile.complete &&
      newState.settings.complete;

    newState.system.migrated = true;
    newState.system.lastUpdated = new Date().toISOString();

    // Save migrated state - inline save since useCallback isn't defined yet during initial load
    try {
      localStorage.setItem('_tutorial_system_state', JSON.stringify(newState));
    } catch (e) {
      console.error('[TutorialSystem] Error saving migrated state:', e);
    }

    // Clean up old keys
    Object.keys(migrations).forEach(oldKey => {
      localStorage.removeItem(oldKey);
    });

    console.log('[TutorialSystem] Migration complete:', newState);
    return newState;
  }

  // Dispatch custom events for backward compatibility
  const dispatchTutorialEvents = useCallback((newState) => {
    if (typeof window === 'undefined') return;

    const events = [
      { key: 'bestieCircle_tutorialComplete', value: newState.bestieCircle.complete },
      { key: 'tutorial_complete', value: newState.home.complete },
      { key: 'checkInTutorial_complete', value: newState.checkIn.complete },
    ];

    events.forEach(({ key, value }) => {
      window.dispatchEvent(new CustomEvent(`${key}_changed`, {
        detail: { complete: value }
      }));
    });
  }, []);

  // Save state to localStorage
  const saveToLocalStorage = useCallback((newState) => {
    try {
      localStorage.setItem('_tutorial_system_state', JSON.stringify(newState));

      // Also set individual keys for backwards compatibility
      localStorage.setItem('tutorial_complete', String(newState.home.complete));
      localStorage.setItem('checkInTutorial_complete', String(newState.checkIn.complete));
      localStorage.setItem('bestieCircle_tutorialComplete', String(newState.bestieCircle.complete));
      localStorage.setItem('bestiesTutorial_complete', String(newState.besties.complete));
      localStorage.setItem('profileTutorial_complete', String(newState.profile.complete));
      localStorage.setItem('settingsTutorial_complete', String(newState.settings.complete));

      // Dispatch events for components that listen to specific keys
      dispatchTutorialEvents(newState);
    } catch (error) {
      console.error('[TutorialSystem] Error saving to localStorage:', error);
    }
  }, [dispatchTutorialEvents]);

  // Sync with Firestore on mount
  useEffect(() => {
    if (!currentUser) {
      setIsLoaded(true);
      return;
    }

    const syncFromFirestore = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log('[TutorialSystem] User doc does not exist, using localStorage state');
          setIsLoaded(true);
          setIsSynced(true);
          return;
        }

        const userData = userSnap.data();
        const firestoreState = userData.tutorialState;

        // If Firestore has unified state, use it
        if (firestoreState) {
          console.log('[TutorialSystem] Loaded from Firestore:', firestoreState);

          // Merge with defaults to handle missing fields
          const mergedState = {
            ...getDefaultState(),
            ...firestoreState,
            system: {
              ...getDefaultState().system,
              ...firestoreState.system,
              onboardingComplete: userData.onboardingCompleted || false,
            },
          };

          setState(mergedState);
          saveToLocalStorage(mergedState);
        } else {
          // Migrate from old Firestore fields
          console.log('[TutorialSystem] Migrating from old Firestore fields...');
          const defaultState = getDefaultState();
          const migratedState = {
            ...defaultState,
            home: {
              complete: userData.tutorialComplete || false,
              currentStep: userData.currentTutorialStep || null,
            },
            checkIn: {
              complete: userData.checkInTutorialComplete || false,
              currentStep: userData.currentCheckInTutorialStep || null,
            },
            bestieCircle: {
              complete: userData.bestieCircleTutorialComplete || false,
              currentStep: null,
              postTutorialStep: null,
              tutorialActive: false,
            },
            system: {
              ...defaultState.system,
              onboardingComplete: userData.onboardingCompleted || false,
              allComplete: false,
              lastUpdated: new Date().toISOString(),
            },
          };

          setState(migratedState);
          saveToLocalStorage(migratedState);

          // Save back to Firestore in new format
          await updateDoc(userRef, { tutorialState: migratedState });
        }

        setIsLoaded(true);
        setIsSynced(true);
      } catch (error) {
        console.error('[TutorialSystem] Error syncing from Firestore:', error);
        setIsLoaded(true);
        setIsSynced(false);
      }
    };

    syncFromFirestore();
  }, [currentUser, saveToLocalStorage]);

  // Sync to Firestore when state changes (debounced)
  useEffect(() => {
    if (!currentUser || !isLoaded || !isSynced) return;

    const timeoutId = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          tutorialState: state,
          // Also update old fields for backwards compatibility
          tutorialComplete: state.home.complete,
          currentTutorialStep: state.home.currentStep,
          checkInTutorialComplete: state.checkIn.complete,
          currentCheckInTutorialStep: state.checkIn.currentStep,
          bestieCircleTutorialComplete: state.bestieCircle.complete,
        });
        console.log('[TutorialSystem] Synced to Firestore:', state);
      } catch (error) {
        console.error('[TutorialSystem] Error syncing to Firestore:', error);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [state, currentUser, isLoaded, isSynced]);

  // Sync to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    saveToLocalStorage(state);
  }, [state, isLoaded, saveToLocalStorage]);

  // Mark tutorial as complete
  const markComplete = useCallback((tutorialName) => {
    setState(prev => {
      const newState = {
        ...prev,
        [tutorialName]: {
          ...prev[tutorialName],
          complete: true,
          currentStep: null,
        },
      };

      // Update allComplete flag
      newState.system.allComplete =
        newState.home.complete &&
        newState.checkIn.complete &&
        newState.bestieCircle.complete &&
        newState.besties.complete &&
        newState.profile.complete &&
        newState.settings.complete;

      newState.system.lastUpdated = new Date().toISOString();

      console.log(`[TutorialSystem] Marked ${tutorialName} as complete`);
      return newState;
    });
  }, []);

  // Set tutorial step
  const setStep = useCallback((tutorialName, step) => {
    setState(prev => ({
      ...prev,
      [tutorialName]: {
        ...prev[tutorialName],
        currentStep: step,
      },
      system: {
        ...prev.system,
        lastUpdated: new Date().toISOString(),
      },
    }));
    console.log(`[TutorialSystem] Set ${tutorialName} step to:`, step);
  }, []);

  // Set post-tutorial step (for bestie circle flow)
  const setPostTutorialStep = useCallback((step) => {
    setState(prev => ({
      ...prev,
      bestieCircle: {
        ...prev.bestieCircle,
        postTutorialStep: step,
      },
      system: {
        ...prev.system,
        lastUpdated: new Date().toISOString(),
      },
    }));

    // Also update localStorage for backward compatibility
    if (step) {
      localStorage.setItem('bestieCircle_postTutorialStep', step);
    } else {
      localStorage.removeItem('bestieCircle_postTutorialStep');
    }

    console.log('[TutorialSystem] Set post-tutorial step:', step);
  }, []);

  // Set bestie circle tutorial active state
  const setBestieCircleActive = useCallback((active) => {
    setState(prev => ({
      ...prev,
      bestieCircle: {
        ...prev.bestieCircle,
        tutorialActive: active,
      },
    }));

    localStorage.setItem('bestieCircle_tutorialActive', String(active));
    console.log('[TutorialSystem] Set bestie circle active:', active);
  }, []);

  // Reset all tutorials (for testing/debugging)
  const resetAll = useCallback(() => {
    const newState = getDefaultState();
    setState(newState);
    saveToLocalStorage(newState);
    console.log('[TutorialSystem] Reset all tutorials');
  }, [saveToLocalStorage]);

  // Return state and control functions
  return {
    // Tutorial states
    home: state.home,
    checkIn: state.checkIn,
    bestieCircle: state.bestieCircle,
    besties: state.besties,
    profile: state.profile,
    settings: state.settings,
    system: state.system,

    // Computed flags
    allComplete: state.system.allComplete,
    onboardingComplete: state.system.onboardingComplete,
    isLoaded,
    isSynced,

    // Navigation helpers
    shouldShowNavigation: state.system.onboardingComplete && (
      state.system.allComplete ||
      (state.bestieCircle.complete && !state.bestieCircle.postTutorialStep)
    ),

    // Control functions
    markComplete,
    setStep,
    setPostTutorialStep,
    setBestieCircleActive,
    resetAll,
  };
};

export default useTutorialSystem;
