/**
 * Tests for monitorCriticalErrors trigger
 */
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const { monitorCriticalErrors } = require('../monitorCriticalErrors');

jest.mock('@sendgrid/mail');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
        })),
        get: jest.fn(),
      })),
      get: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

describe('monitorCriticalErrors', () => {
  let mockSnapshot;
  let mockContext;
  let mockRecentErrorsSnapshot;

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
    db.collection = jest.fn(() => ({
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockRecentErrorsSnapshot),
        })),
      })),
    }));

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
      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('errors');
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
          subject: expect.stringContaining('SITE ISSUE'),
        })
      );
    });
  });
});

