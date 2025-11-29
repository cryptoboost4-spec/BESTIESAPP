import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for optimistic UI updates with automatic rollback on errors
 *
 * @example
 * const { executeOptimistic, isProcessing } = useOptimisticUpdate();
 *
 * await executeOptimistic({
 *   optimisticUpdate: () => setLocalState(newValue),
 *   serverUpdate: async () => await apiCall(),
 *   onSuccess: () => toast.success('Done!'),
 *   onError: () => setLocalState(oldValue),
 *   errorMessage: 'Failed to update'
 * });
 */
export const useOptimisticUpdate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef(null);

  const executeOptimistic = useCallback(async ({
    optimisticUpdate,
    serverUpdate,
    onSuccess,
    onError,
    rollback,
    successMessage,
    errorMessage = 'Something went wrong. Please try again.',
    showLoadingToast = false,
    loadingMessage = 'Processing...',
    skipSuccessToast = false
  }) => {
    // Prevent duplicate requests
    if (isProcessing) {
      console.warn('Request already in progress');
      return { success: false, error: 'Request in progress' };
    }

    setIsProcessing(true);
    let loadingToast = null;

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Apply optimistic update immediately (makes UI feel instant)
      if (optimisticUpdate) {
        optimisticUpdate();
      }

      // Show loading toast if needed (optional, since UI already updated)
      if (showLoadingToast) {
        loadingToast = toast.loading(loadingMessage);
      }

      // Step 2: Send request to backend
      const result = await serverUpdate();

      // Step 3: Handle success
      if (onSuccess) {
        onSuccess(result);
      }

      if (successMessage && !skipSuccessToast) {
        if (loadingToast) {
          toast.success(successMessage, { id: loadingToast });
        } else {
          toast.success(successMessage);
        }
      } else if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      setIsProcessing(false);
      return { success: true, data: result };

    } catch (error) {
      // Error is already handled and shown to user via toast
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Optimistic update failed:', error);
      }

      // Step 4: Rollback optimistic update on error
      if (rollback) {
        rollback();
      }

      if (onError) {
        onError(error);
      }

      // Show error message
      const errorMsg = error.message || errorMessage;
      if (loadingToast) {
        toast.error(errorMsg, { id: loadingToast });
      } else {
        toast.error(errorMsg);
      }

      setIsProcessing(false);
      return { success: false, error: errorMsg };
    }
  }, [isProcessing]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
  }, []);

  return {
    executeOptimistic,
    isProcessing,
    cancel
  };
};

/**
 * Hook for managing optimistic local state with rollback
 *
 * @example
 * const [checkIns, setCheckIns, rollback] = useOptimisticState([...initialCheckIns]);
 *
 * // Update optimistically
 * setCheckIns(prev => prev.filter(c => c.id !== checkInId));
 *
 * // Rollback if backend fails
 * rollback();
 */
export const useOptimisticState = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [previousValue, setPreviousValue] = useState(initialValue);

  const setOptimisticValue = useCallback((newValue) => {
    setPreviousValue(value);
    setValue(typeof newValue === 'function' ? newValue(value) : newValue);
  }, [value]);

  const rollback = useCallback(() => {
    setValue(previousValue);
  }, [previousValue]);

  const commit = useCallback(() => {
    setPreviousValue(value);
  }, [value]);

  return [value, setOptimisticValue, rollback, commit];
};

export default useOptimisticUpdate;
