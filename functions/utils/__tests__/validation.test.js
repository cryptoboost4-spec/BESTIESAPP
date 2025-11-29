/**
 * Validation Utility Tests
 */
const {
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
} = require('../validation');

const functions = require('firebase-functions');

describe('Validation Utilities', () => {
  describe('requireAuth', () => {
    test('should throw if context is null', () => {
      expect(() => requireAuth(null)).toThrow();
    });

    test('should throw if auth is null', () => {
      expect(() => requireAuth({ auth: null })).toThrow();
    });

    test('should return userId if authenticated', () => {
      const context = { auth: { uid: 'test-user-id' } };
      expect(requireAuth(context)).toBe('test-user-id');
    });
  });

  describe('validateId', () => {
    test('should throw if id is null', () => {
      expect(() => validateId(null)).toThrow();
    });

    test('should throw if id is not a string', () => {
      expect(() => validateId(123)).toThrow();
    });

    test('should throw if id is empty', () => {
      expect(() => validateId('')).toThrow();
    });

    test('should throw if id is too long', () => {
      expect(() => validateId('a'.repeat(101))).toThrow();
    });

    test('should throw if id contains invalid characters', () => {
      expect(() => validateId('test@id')).toThrow();
    });

    test('should return id if valid', () => {
      expect(validateId('valid-id_123')).toBe('valid-id_123');
    });
  });

  describe('validatePhoneNumber', () => {
    test('should throw if phone is null', () => {
      expect(() => validatePhoneNumber(null)).toThrow();
    });

    test('should throw if phone is not a string', () => {
      expect(() => validatePhoneNumber(123)).toThrow();
    });

    test('should accept valid phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe('+1234567890');
      expect(validatePhoneNumber('+61 412 345 678')).toBe('+61 412 345 678');
    });
  });

  describe('validateEmail', () => {
    test('should throw if email is null', () => {
      expect(() => validateEmail(null)).toThrow();
    });

    test('should throw if email is invalid', () => {
      expect(() => validateEmail('invalid')).toThrow();
      expect(() => validateEmail('invalid@')).toThrow();
      expect(() => validateEmail('@example.com')).toThrow();
    });

    test('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('validateLocation', () => {
    test('should throw if location is null', () => {
      expect(() => validateLocation(null)).toThrow();
    });

    test('should throw if location is too long', () => {
      expect(() => validateLocation('a'.repeat(501))).toThrow();
    });

    test('should accept valid location', () => {
      expect(validateLocation('123 Main St')).toBe('123 Main St');
    });
  });

  describe('validateDuration', () => {
    test('should throw if duration is not a number', () => {
      expect(() => validateDuration('30')).toThrow();
    });

    test('should throw if duration is below minimum', () => {
      expect(() => validateDuration(5)).toThrow();
    });

    test('should throw if duration is above maximum', () => {
      expect(() => validateDuration(200)).toThrow();
    });

    test('should accept valid duration', () => {
      expect(validateDuration(30)).toBe(30);
      expect(validateDuration(10)).toBe(10);
      expect(validateDuration(180)).toBe(180);
    });
  });

  describe('validateBestieIds', () => {
    test('should throw if not an array', () => {
      expect(() => validateBestieIds('not-array')).toThrow();
    });

    test('should throw if too few besties', () => {
      expect(() => validateBestieIds([])).toThrow();
    });

    test('should throw if too many besties', () => {
      expect(() => validateBestieIds(['1', '2', '3', '4', '5', '6'])).toThrow();
    });

    test('should throw if duplicate IDs', () => {
      expect(() => validateBestieIds(['1', '1'])).toThrow();
    });

    test('should accept valid bestie IDs', () => {
      expect(validateBestieIds(['id1', 'id2'])).toEqual(['id1', 'id2']);
    });
  });

  describe('validateBoolean', () => {
    test('should throw if not boolean', () => {
      expect(() => validateBoolean('true')).toThrow();
      expect(() => validateBoolean(1)).toThrow();
    });

    test('should accept boolean values', () => {
      expect(validateBoolean(true)).toBe(true);
      expect(validateBoolean(false)).toBe(false);
    });
  });

  describe('validateNumber', () => {
    test('should throw if not a number', () => {
      expect(() => validateNumber('123')).toThrow();
    });

    test('should throw if below minimum', () => {
      expect(() => validateNumber(5, 'value', 10)).toThrow();
    });

    test('should throw if above maximum', () => {
      expect(() => validateNumber(20, 'value', null, 10)).toThrow();
    });

    test('should accept valid number', () => {
      expect(validateNumber(15, 'value', 10, 20)).toBe(15);
    });
  });

  describe('validateEnum', () => {
    test('should throw if value not in allowed list', () => {
      expect(() => validateEnum('invalid', ['valid1', 'valid2'])).toThrow();
    });

    test('should accept valid enum value', () => {
      expect(validateEnum('valid1', ['valid1', 'valid2'])).toBe('valid1');
    });
  });
});

