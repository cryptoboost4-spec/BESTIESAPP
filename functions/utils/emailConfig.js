/**
 * Email configuration constants
 * Centralized email addresses for consistency and easy updates
 */

const functions = require('firebase-functions');

/**
 * Get email addresses from config or use defaults
 */
const EMAIL_CONFIG = {
  // From addresses
  ALERTS: functions.config().email?.alerts_from || 'alerts@bestiesapp.com',
  NOTIFICATIONS: functions.config().email?.notifications_from || 'notifications@bestiesapp.com',
  SUPPORT: functions.config().email?.support_from || 'support@bestiesapp.com',
  
  // To addresses
  ADMIN: functions.config().admin?.email || 'admin@bestiesapp.com',
  SUPPORT_TO: functions.config().email?.support_to || 'support@bestiesapp.com',
};

module.exports = EMAIL_CONFIG;

