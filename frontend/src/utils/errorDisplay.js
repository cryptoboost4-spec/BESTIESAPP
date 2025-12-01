/**
 * Error Display Utility
 * 
 * Categorizes errors and provides appropriate display methods:
 * - INLINE: Form validation, field-specific errors
 * - CONTEXTUAL: Errors within a component/section context
 * - SUBTLE: Non-critical errors that don't block the UI
 * - TOAST: Critical errors that need immediate attention (keep as toast)
 */

import toast from 'react-hot-toast';

/**
 * Display error based on category
 */
export const displayError = {
  /**
   * Inline errors - for form validation, show next to fields
   * Returns error message to be displayed inline
   */
  inline: (message) => {
    return message; // Return message for InlineError component
  },

  /**
   * Contextual errors - for component/section-level errors
   * Shows error within the component context
   */
  contextual: (message, title = 'Error') => {
    return { message, title }; // Return object for ContextualError component
  },

  /**
   * Subtle errors - non-critical, dismissible
   * Shows as small notification that doesn't block UI
   */
  subtle: (message, type = 'error') => {
    return { message, type }; // Return object for SubtleNotification component
  },

  /**
   * Toast errors - critical errors that need immediate attention
   * Keep using toast for these
   */
  toast: (message, options = {}) => {
    toast.error(message, {
      duration: 4000,
      ...options
    });
  }
};

/**
 * Error categorization guide:
 * 
 * INLINE - Use for:
 * - Form validation errors
 * - Field-specific errors
 * - Input validation messages
 * 
 * CONTEXTUAL - Use for:
 * - Component initialization failures
 * - Data loading errors within a section
 * - Action failures that need retry
 * 
 * SUBTLE - Use for:
 * - Non-critical warnings
 * - Optional feature failures
 * - Background operation errors
 * 
 * TOAST - Keep for:
 * - Critical system errors
 * - Authentication failures
 * - Network errors that block functionality
 */

