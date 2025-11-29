/**
 * Verification utility for Firebase Functions configuration
 * Checks that all required environment variables are set
 */

const functions = require('firebase-functions');

/**
 * Required configuration variables by category
 */
const REQUIRED_CONFIG = {
  twilio: ['account_sid', 'auth_token', 'phone_number'],
  stripe: ['secret_key', 'publishable_key'],
  sendgrid: ['api_key'],
  app: ['url'],
  email: ['alerts_from', 'notifications_from', 'support_from', 'support_to'],
  admin: ['email'],
};

/**
 * Optional but recommended configuration
 */
const OPTIONAL_CONFIG = {
  google: ['maps_api_key'],
  telegram: ['bot_token'],
  facebook: ['page_token'],
  stripe: ['webhook_secret'],
};

/**
 * Verify all required configuration is set
 * @returns {Object} Verification result with status and details
 */
function verifyConfig() {
  const config = functions.config();
  const results = {
    valid: true,
    missing: [],
    present: [],
    optional: {
      missing: [],
      present: [],
    },
    errors: [],
  };

  // Check required config
  for (const [category, keys] of Object.entries(REQUIRED_CONFIG)) {
    for (const key of keys) {
      const value = config[category]?.[key];
      if (!value || value.trim() === '') {
        results.valid = false;
        results.missing.push(`${category}.${key}`);
      } else {
        results.present.push(`${category}.${key}`);
      }
    }
  }

  // Check optional config
  for (const [category, keys] of Object.entries(OPTIONAL_CONFIG)) {
    for (const key of keys) {
      const value = config[category]?.[key];
      if (!value || value.trim() === '') {
        results.optional.missing.push(`${category}.${key}`);
      } else {
        results.optional.present.push(`${category}.${key}`);
      }
    }
  }

  return results;
}

/**
 * Get a formatted report of configuration status
 * @returns {string} Human-readable report
 */
function getConfigReport() {
  const results = verifyConfig();
  let report = '\n📋 Firebase Functions Configuration Report\n';
  report += '='.repeat(50) + '\n\n';

  if (results.valid) {
    report += '✅ All required configuration is set!\n\n';
  } else {
    report += '❌ Missing required configuration:\n';
    results.missing.forEach(key => {
      report += `   - ${key}\n`;
    });
    report += '\n';
  }

  report += '✅ Present configuration:\n';
  results.present.forEach(key => {
    report += `   - ${key}\n`;
  });
  report += '\n';

  if (results.optional.missing.length > 0) {
    report += '⚠️  Optional configuration not set:\n';
    results.optional.missing.forEach(key => {
      report += `   - ${key}\n`;
    });
    report += '\n';
  }

  if (results.optional.present.length > 0) {
    report += '✅ Optional configuration present:\n';
    results.optional.present.forEach(key => {
      report += `   - ${key}\n`;
    });
    report += '\n';
  }

  report += '='.repeat(50) + '\n';
  return report;
}

/**
 * Verify and throw error if required config is missing
 * @throws {Error} If required configuration is missing
 */
function requireConfig() {
  const results = verifyConfig();
  if (!results.valid) {
    const missingList = results.missing.join(', ');
    throw new Error(
      `Missing required Firebase Functions configuration: ${missingList}\n\n` +
      `Run: firebase functions:config:get to see current config\n` +
      `Set missing values with: firebase functions:config:set <category>.<key>="<value>"`
    );
  }
}

module.exports = {
  verifyConfig,
  getConfigReport,
  requireConfig,
  REQUIRED_CONFIG,
  OPTIONAL_CONFIG,
};

