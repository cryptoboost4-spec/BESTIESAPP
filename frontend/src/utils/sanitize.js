/**
 * Input sanitization utilities
 * Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Unsanitized HTML string
 * @param {Object} options - DOMPurify options
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(dirty, options = {}) {
  if (typeof dirty !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  };

  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
}

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} text - Text that may contain HTML
 * @returns {string} Plain text with HTML removed
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user input for display (strips HTML, limits length)
 * @param {string} input - User input
 * @param {number} maxLength - Maximum length (default: 1000)
 * @returns {string} Sanitized text
 */
export function sanitizeUserInput(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }

  const sanitized = sanitizeText(input);
  return sanitized.substring(0, maxLength);
}

