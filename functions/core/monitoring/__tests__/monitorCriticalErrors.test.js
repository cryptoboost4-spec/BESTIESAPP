/**
 * Tests for monitorCriticalErrors trigger
 */
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const { monitorCriticalErrors } = require('../monitorCriticalErrors');

jest.mock('@sendgrid/mail');
// Use global mocks from jest.setup.js

describe('monitorCriticalErrors', () => {
  let mockSnapshot;
  let mockContext;
  let mockRecentErrorsSnapshot;
  let mockCollectionFn;

  beforeEach(() => {
    mockContext = {
      params: { errorId: 'error123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Test error',
        userId: 'user123',
        timestamp: Date.now(),
      })),
    };

    mockRecentErrorsSnapshot = {
      forEach: jest.fn((callback) => {
        callback({ data: () => ({ userId: 'user123' }) });
        callback({ data: () => ({ userId: 'user456' }) });
      }),
    };

    const db = admin.firestore();
    mockCollectionFn = jest.fn((collectionName) => {
      if (collectionName === 'errors') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockRecentErrorsSnapshot),
            })),
          })),
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
      };
    });
    db.collection = mockCollectionFn;

    sgMail.send = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Critical Error Detection', () => {
    test('should detect critical error types', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Test error',
        timestamp: Date.now(),
      }));

      await monitorCriticalErrors(mockSnapshot, mockContext);

      // Should check for recent errors
      expect(mockCollectionFn).toHaveBeenCalledWith('errors');
    });

    test('should not alert for non-critical errors', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'custom_error',
        message: 'User-specific error',
        timestamp: Date.now(),
      }));

      const result = await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(result).toBeNull();
      expect(sgMail.send).not.toHaveBeenCalled();
    });
  });

  describe('Multiple User Detection', () => {
    test('should alert if multiple users affected', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Database error',
        timestamp: Date.now(),
      }));

      await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(sgMail.send).toHaveBeenCalled();
    });

    test('should not alert for single user errors', async () => {
      mockRecentErrorsSnapshot.forEach = jest.fn((callback) => {
        callback({ data: () => ({ userId: 'user123' }) });
      });

      mockSnapshot.data = jest.fn(() => ({
        type: 'custom_error',
        message: 'User-specific error',
        timestamp: Date.now(),
      }));

      const result = await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(result).toBeNull();
    });
  });

  describe('System Error Detection', () => {
    test('should alert for Firebase errors', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Firebase connection failed',
        timestamp: Date.now(),
      }));

      await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(sgMail.send).toHaveBeenCalled();
    });

    test('should alert for database errors', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Database unavailable',
        timestamp: Date.now(),
      }));

      await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(sgMail.send).toHaveBeenCalled();
    });
  });

  describe('Email Alerts', () => {
    test('should send email alert to admin', async () => {
      mockSnapshot.data = jest.fn(() => ({
        type: 'uncaught_error',
        message: 'Database error',
        timestamp: Date.now(),
      }));

      await monitorCriticalErrors(mockSnapshot, mockContext);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.stringMatching(/SITE ISSUE|SYSTEM ERROR/),
        })
      );
    });
  });
});

