/**
 * Phone number utility functions for E.164 formatting
 * E.164 format: +[country code][phone number]
 * Example: +61412345678
 */

/**
 * Format a phone number to E.164 standard
 * @param {string} phoneNumber - The phone number to format
 * @param {string} countryCode - The country code (e.g., '+61', '+1')
 * @returns {string} - Formatted phone number in E.164 format
 */
export const formatToE164 = (phoneNumber, countryCode = '+1') => {
  if (!phoneNumber) return '';

  // If already in E.164 format (starts with +), return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber.replace(/\s/g, '');
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If empty after cleaning, return empty string
  if (!digitsOnly) return '';

  // Add country code if not present
  return `${countryCode}${digitsOnly}`;
};

/**
 * Detect country code from phone number
 * @param {string} phoneNumber - The phone number
 * @returns {string} - Detected country code or default '+1'
 */
export const detectCountryCode = (phoneNumber) => {
  if (!phoneNumber) return '+1';

  if (phoneNumber.startsWith('+1')) return '+1';
  if (phoneNumber.startsWith('+44')) return '+44';
  if (phoneNumber.startsWith('+61')) return '+61';
  if (phoneNumber.startsWith('+91')) return '+91';

  // Default to US/Canada
  return '+1';
};

/**
 * Parse E.164 phone number to separate country code and number
 * @param {string} e164Number - Phone number in E.164 format
 * @returns {object} - { countryCode, phoneNumber }
 */
export const parseE164 = (e164Number) => {
  if (!e164Number || !e164Number.startsWith('+')) {
    return { countryCode: '+1', phoneNumber: e164Number || '' };
  }

  // Try to match known country codes
  if (e164Number.startsWith('+1')) {
    return { countryCode: '+1', phoneNumber: e164Number.slice(2) };
  }
  if (e164Number.startsWith('+44')) {
    return { countryCode: '+44', phoneNumber: e164Number.slice(3) };
  }
  if (e164Number.startsWith('+61')) {
    return { countryCode: '+61', phoneNumber: e164Number.slice(3) };
  }
  if (e164Number.startsWith('+91')) {
    return { countryCode: '+91', phoneNumber: e164Number.slice(3) };
  }

  // Fallback: assume first 1-3 digits are country code
  const match = e164Number.match(/^\+(\d{1,3})(.*)$/);
  if (match) {
    return { countryCode: `+${match[1]}`, phoneNumber: match[2] };
  }

  return { countryCode: '+1', phoneNumber: e164Number };
};

/**
 * Display phone number in a user-friendly format
 * @param {string} e164Number - Phone number in E.164 format
 * @returns {string} - Formatted display string
 */
export const formatForDisplay = (e164Number) => {
  if (!e164Number) return '';

  const { countryCode, phoneNumber } = parseE164(e164Number);

  // Format based on country
  if (countryCode === '+1') {
    // US/Canada: +1 (555) 123-4567
    if (phoneNumber.length === 10) {
      return `${countryCode} (${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
  } else if (countryCode === '+61') {
    // Australia: +61 412 345 678
    if (phoneNumber.length === 9) {
      return `${countryCode} ${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
  } else if (countryCode === '+44') {
    // UK: +44 7911 123456
    if (phoneNumber.length === 10) {
      return `${countryCode} ${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
    }
  } else if (countryCode === '+91') {
    // India: +91 98765 43210
    if (phoneNumber.length === 10) {
      return `${countryCode} ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }
  }

  // Fallback: just add space after country code
  return `${countryCode} ${phoneNumber}`;
};

/**
 * Validate E.164 phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export const isValidE164 = (phoneNumber) => {
  if (!phoneNumber) return false;

  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

/**
 * Normalize phone number from various formats to E.164
 * Handles common Australian formats:
 * - 0412 345 678 -> +61412345678
 * - 04 1234 5678 -> +61412345678
 * - 412345678 -> +61412345678
 */
export const normalizeAustralianPhone = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Already in E.164
  if (phoneNumber.startsWith('+61')) {
    return phoneNumber.replace(/\s/g, '');
  }

  // Remove all non-digits
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If starts with 0, remove it (Australian mobile numbers)
  const withoutLeadingZero = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;

  // Add +61
  return `+61${withoutLeadingZero}`;
};

const phoneUtils = {
  formatToE164,
  detectCountryCode,
  parseE164,
  formatForDisplay,
  isValidE164,
  normalizeAustralianPhone,
};

export default phoneUtils;
