/**
 * Utility functions for SMS sharing
 * Handles desktop/mobile detection and fallback to clipboard
 */

/**
 * Check if SMS links are supported on this device
 * SMS links only work on mobile devices
 */
export const isSMSSupported = () => {
  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check if SMS protocol is supported
  // On desktop, this will fail, so we return false
  return isMobile;
};

/**
 * Share via SMS with fallback to clipboard on desktop
 * @param {string} message - The message to share
 * @param {Function} onCopy - Optional callback when falling back to copy
 */
export const shareViaSMS = (message, onCopy = null) => {
  if (isSMSSupported()) {
    // Mobile device - use SMS link
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  } else {
    // Desktop - copy to clipboard instead
    navigator.clipboard.writeText(message).then(() => {
      if (onCopy) {
        onCopy();
      }
    }).catch((error) => {
      console.error('Failed to copy to clipboard:', error);
      if (onCopy) {
        onCopy();
      }
    });
  }
};

/**
 * Share via SMS with phone number
 * @param {string} phoneNumber - The phone number to send SMS to
 * @param {string} message - Optional message body
 * @param {Function} onCopy - Optional callback when falling back to copy
 */
export const shareViaSMSWithPhone = (phoneNumber, message = '', onCopy = null) => {
  if (isSMSSupported()) {
    // Mobile device - use SMS link with phone number
    if (message) {
      window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
      window.location.href = `sms:${phoneNumber}`;
    }
  } else {
    // Desktop - copy phone number and message to clipboard
    const textToCopy = message ? `${phoneNumber}\n\n${message}` : phoneNumber;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (onCopy) {
        onCopy();
      }
    }).catch((error) => {
      console.error('Failed to copy to clipboard:', error);
      if (onCopy) {
        onCopy();
      }
    });
  }
};

