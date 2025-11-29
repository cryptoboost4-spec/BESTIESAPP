/**
 * Centralized logging utility
 * - In development: logs everything
 * - In production: only logs errors
 * - Prevents console statements from being included in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Log debug information (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Group related logs (development only)
   */
  group: (...args) => {
    if (isDevelopment) {
      console.group(...args);
    }
  },

  /**
   * End log group (development only)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

export default logger;

