/**
 * Shared utilities for tutorial system
 */

/**
 * Retry logic for finding refs
 * @param {Function} getRef - Function that returns the ref
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<HTMLElement|null>} The element or null if not found
 */
export const findRefWithRetry = (getRef, maxRetries = 3, delay = 100) => {
  return new Promise((resolve) => {
    let retries = 0;
    
    const tryFind = () => {
      const element = getRef();
      if (element?.current) {
        resolve(element.current);
        return;
      }
      
      if (retries < maxRetries) {
        retries++;
        setTimeout(tryFind, delay);
      } else {
        resolve(null);
      }
    };
    
    tryFind();
  });
};

/**
 * Track tutorial analytics event
 * @param {string} eventName - Event name
 * @param {Object} params - Event parameters
 */
export const trackTutorialEvent = (eventName, params = {}) => {
  // Check if analytics is available
  if (typeof window !== 'undefined' && window.analytics) {
    try {
      window.analytics.track(eventName, {
        ...params,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking tutorial event:', error);
    }
  } else {
    // Fallback: log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tutorial Analytics]', eventName, params);
    }
  }
};

/**
 * Save tutorial state to localStorage and Firestore
 * @param {string} tutorialName - Name of tutorial (e.g., 'besties', 'profile', 'settings')
 * @param {Object} state - State to save
 * @param {Function} updateFirestore - Function to update Firestore
 */
export const saveTutorialState = async (tutorialName, state, updateFirestore) => {
  // Save to localStorage
  const key = `${tutorialName}_tutorial_${state.key}`;
  if (state.value !== null && state.value !== undefined) {
    localStorage.setItem(key, JSON.stringify(state.value));
  } else {
    localStorage.removeItem(key);
  }
  
  // Save to Firestore if function provided
  if (updateFirestore) {
    try {
      await updateFirestore(tutorialName, state);
    } catch (error) {
      console.error(`Error saving ${tutorialName} tutorial state to Firestore:`, error);
      // Non-critical - localStorage is updated
    }
  }
};

/**
 * Load tutorial state from localStorage
 * @param {string} tutorialName - Name of tutorial
 * @param {string} key - State key
 * @returns {any} The stored value or null
 */
export const loadTutorialState = (tutorialName, key) => {
  const storageKey = `${tutorialName}_tutorial_${key}`;
  const value = localStorage.getItem(storageKey);
  if (value === null) return null;
  
  try {
    return JSON.parse(value);
  } catch {
    // If not JSON, return as string
    return value;
  }
};

/**
 * Calculate progress dots (filled vs unfilled)
 * @param {number} currentStep - Current step (1-indexed)
 * @param {number} totalSteps - Total number of steps
 * @returns {Array<{filled: boolean}>} Array of dot states
 */
export const getProgressDots = (currentStep, totalSteps) => {
  return Array.from({ length: totalSteps }, (_, i) => ({
    filled: i < currentStep
  }));
};

/**
 * Clear tutorial flow state (temporary state used during tutorial)
 * This clears post-tutorial flow state but preserves completion flags
 * so the tutorials don't re-appear and navigation works correctly
 */
export const clearAllTutorialState = () => {
  // Clear post-tutorial flow state (temporary)
  localStorage.removeItem('bestieCircle_postTutorialStep');
  localStorage.removeItem('bestieCircle_tutorialActive');
  localStorage.removeItem('livingCircle_readyToLearnDismissed');
  
  // Clear current step state (not completion flags)
  localStorage.removeItem('current_checkInTutorial_step');
  localStorage.removeItem('current_tutorial_step');
  
  // Mark all tutorials as complete so they don't re-appear
  localStorage.setItem('bestieCircle_tutorialComplete', 'true');
  localStorage.setItem('checkInTutorial_complete', 'true');
  localStorage.setItem('tutorial_complete', 'true');
  localStorage.setItem('bestiesTutorial_complete', 'true');
  localStorage.setItem('profileTutorial_complete', 'true');
  localStorage.setItem('besties_tooltip_dismissed', 'true');
  
  // Dispatch events to notify components immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bestieCircle_postTutorialStep_changed', {
      detail: { step: null }
    }));
    window.dispatchEvent(new CustomEvent('bestieCircle_tutorialComplete_changed', {
      detail: { complete: true }
    }));
    window.dispatchEvent(new CustomEvent('besties_tooltip_dismissed_changed', {
      detail: { dismissed: true }
    }));
  }
  
  console.log('[Tutorial] Tutorial flow state cleared, all tutorials marked complete');
};

