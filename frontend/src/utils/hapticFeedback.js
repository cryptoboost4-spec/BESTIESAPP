/**
 * Haptic Feedback Utility
 * Provides vibration feedback for mobile devices
 * Falls back gracefully if not supported
 */

class HapticFeedback {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  /**
   * Light tap - for button presses, toggles
   */
  light() {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Medium impact - for form submissions, completions
   */
  medium() {
    if (this.isSupported) {
      navigator.vibrate(30);
    }
  }

  /**
   * Heavy impact - for important actions, deletions
   */
  heavy() {
    if (this.isSupported) {
      navigator.vibrate(50);
    }
  }

  /**
   * Success pattern - double tap
   */
  success() {
    if (this.isSupported) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  /**
   * Warning pattern - triple tap
   */
  warning() {
    if (this.isSupported) {
      navigator.vibrate([30, 20, 30, 20, 30]);
    }
  }

  /**
   * Error pattern - long buzz
   */
  error() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * Emergency pattern - intense repeating
   */
  emergency() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }

  /**
   * Selection pattern - subtle tick
   */
  selection() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }
}

export const haptic = new HapticFeedback();
export default haptic;
