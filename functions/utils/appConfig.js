/**
 * Application configuration constants
 * Centralized URLs and app settings for consistency
 */

const functions = require('firebase-functions');

/**
 * Get app configuration from Firebase Functions config or use defaults
 */
const APP_CONFIG = {
  // Base URL
  URL: functions.config().app?.url || 'https://bestiesapp.web.app',
  
  // Specific routes (for notifications and links)
  ROUTES: {
    BESTIES: '/besties',
    PROFILE: '/profile',
    HOME: '/',
    SIGNUP: '/signup',
    SETTINGS: '/settings',
    SUBSCRIPTION_SUCCESS: '/subscription-success',
    SUBSCRIPTION_CANCEL: '/subscription-cancel',
    ERROR_DASHBOARD: '/error-dashboard',
  },
  
  // Full URLs
  getUrl: (path = '') => {
    const baseUrl = APP_CONFIG.URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },
  
  // Default logo URL
  LOGO_URL: '/logo192.png',
  
  // Default user photo fallback
  DEFAULT_USER_PHOTO: 'https://bestiesapp.web.app/logo192.png',
};

module.exports = APP_CONFIG;

