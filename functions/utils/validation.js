/**
 * Input validation utilities for Cloud Functions
 * Provides standardized validation helpers to prevent invalid data
 */

const functions = require('firebase-functions');

/**
 * Validates that user is authenticated
 */
function requireAuth(context) {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  return context.auth.uid;
}

/**
 * Validates a string ID (checkInId, bestieId, etc.)
 */
function validateId(id, fieldName = 'ID', maxLength = 100) {
  if (!id || typeof id !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', `Invalid ${fieldName}: must be a string`);
  }
  if (id.length === 0 || id.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid ${fieldName}: length must be between 1 and ${maxLength}`);
  }
  // Basic sanitization - no special characters that could cause issues
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid ${fieldName}: contains invalid characters`);
  }
  return id;
}

/**
 * Validates a phone number (E.164 format preferred)
 */
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number is required and must be a string');
  }
  // Basic phone validation - should start with + and contain digits
  if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-()]/g, ''))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format');
  }
  return phone;
}

/**
 * Validates an email address
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required and must be a string');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }
  if (email.length > 254) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is too long');
  }
  return email;
}

/**
 * Validates a location string
 */
function validateLocation(location, maxLength = 500) {
  if (!location || typeof location !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Location is required and must be a string');
  }
  if (location.length === 0 || location.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `Location must be between 1 and ${maxLength} characters`);
  }
  return location;
}

/**
 * Validates check-in duration
 */
function validateDuration(duration, minMinutes = 10, maxMinutes = 180) {
  if (typeof duration !== 'number' || !Number.isInteger(duration)) {
    throw new functions.https.HttpsError('invalid-argument', 'Duration must be an integer');
  }
  if (duration < minMinutes || duration > maxMinutes) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Duration must be between ${minMinutes} and ${maxMinutes} minutes`
    );
  }
  return duration;
}

/**
 * Validates an array of bestie IDs
 */
function validateBestieIds(bestieIds, minCount = 1, maxCount = 5) {
  if (!Array.isArray(bestieIds)) {
    throw new functions.https.HttpsError('invalid-argument', 'Bestie IDs must be an array');
  }
  if (bestieIds.length < minCount || bestieIds.length > maxCount) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Must select between ${minCount} and ${maxCount} besties`
    );
  }
  // Validate each ID
  bestieIds.forEach((id, index) => {
    try {
      validateId(id, `bestie ID at index ${index}`);
    } catch (error) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid bestie ID at index ${index}`);
    }
  });
  // Check for duplicates
  if (new Set(bestieIds).size !== bestieIds.length) {
    throw new functions.https.HttpsError('invalid-argument', 'Duplicate bestie IDs are not allowed');
  }
  return bestieIds;
}

/**
 * Validates a boolean value
 */
function validateBoolean(value, fieldName = 'value') {
  if (typeof value !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', `${fieldName} must be a boolean`);
  }
  return value;
}

/**
 * Validates a number within a range
 */
function validateNumber(value, fieldName = 'value', min = null, max = null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new functions.https.HttpsError('invalid-argument', `${fieldName} must be a number`);
  }
  if (min !== null && value < min) {
    throw new functions.https.HttpsError('invalid-argument', `${fieldName} must be at least ${min}`);
  }
  if (max !== null && value > max) {
    throw new functions.https.HttpsError('invalid-argument', `${fieldName} must be at most ${max}`);
  }
  return value;
}

/**
 * Validates that a value is one of the allowed options
 */
function validateEnum(value, allowedValues, fieldName = 'value') {
  if (!allowedValues.includes(value)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value;
}

module.exports = {
  requireAuth,
  validateId,
  validatePhoneNumber,
  validateEmail,
  validateLocation,
  validateDuration,
  validateBestieIds,
  validateBoolean,
  validateNumber,
  validateEnum,
};

