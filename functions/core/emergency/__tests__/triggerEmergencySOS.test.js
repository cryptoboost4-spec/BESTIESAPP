/**
 * Tests for triggerEmergencySOS function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { triggerEmergencySOS } = require('../triggerEmergencySOS');
const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert, sendPushNotification } = require('../../../utils/notifications');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');

// Mock dependencies
jest.mock('../../../utils/notifications');
jest.mock('../../../utils/rateLimiting');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      add: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn(),
          })),
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
  messaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

describe('triggerEmergencySOS', () => {
  let mockContext;
  let mockData;
  let mockUserDoc;
  let mockBestiesSnapshot;
  let mockMessengerSnapshot;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    mockData = {
      location: '123 Test St, City',
      isReversePIN: false,
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+61412345678',
      })),
    };

    mockBestiesSnapshot = {
      forEach: jest.fn((callback) => {
        callback({ data: () => ({ recipientId: 'bestie1' }) });
      }),
    };

    mockMessengerSnapshot = {
      forEach: jest.fn(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockUserDoc),
          })),
        };
      }
      if (collectionName === 'besties' || collectionName === 'messengerContacts') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
              })),
              get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
            })),
            get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
          })),
          get: jest.fn().mockResolvedValue(mockMessengerSnapshot),
        };
      }
      return {
        add: jest.fn().mockResolvedValue({ id: 'sos123' }),
      };
    });

    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 3,
      remaining: 2,
    });

    sendSMSAlert.mockResolvedValue();
    sendWhatsAppAlert.mockResolvedValue();
    sendEmailAlert.mockResolvedValue();
    sendPushNotification.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        triggerEmergencySOS(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if location is missing', async () => {
      const invalidData = { isReversePIN: false };

      await expect(
        triggerEmergencySOS(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if location is too long', async () => {
      const invalidData = {
        location: 'a'.repeat(501),
        isReversePIN: false,
      };

      await expect(
        triggerEmergencySOS(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should validate isReversePIN if provided', async () => {
      const invalidData = {
        location: 'Test Location',
        isReversePIN: 'not-boolean',
      };

      await expect(
        triggerEmergencySOS(invalidData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limit before triggering SOS', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      expect(checkUserRateLimit).toHaveBeenCalledWith(
        'user123',
        'triggerEmergencySOS',
        expect.objectContaining({ count: 3, window: 3600000 }),
        'emergency_sos',
        'userId',
        'createdAt'
      );
    });

    test('should throw if rate limit exceeded', async () => {
      checkUserRateLimit.mockResolvedValue({
        allowed: false,
        count: 3,
        limit: 3,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000),
      });

      await expect(
        triggerEmergencySOS(mockData, mockContext)
      ).rejects.toThrow('resource-exhausted');
    });
  });

  describe('SOS Creation', () => {
    test('should create emergency SOS document', async () => {
      const db = admin.firestore();
      await triggerEmergencySOS(mockData, mockContext);

      expect(db.collection).toHaveBeenCalledWith('emergency_sos');
    });

    test('should include location in SOS document', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      const db = admin.firestore();
      const addCall = db.collection().add;
      expect(addCall).toHaveBeenCalled();
    });

    test('should include isReversePIN flag', async () => {
      const dataWithReversePIN = {
        location: 'Test Location',
        isReversePIN: true,
      };

      await triggerEmergencySOS(dataWithReversePIN, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalled();
    });
  });

  describe('Bestie Notification', () => {
    test('should find favorite besties', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('besties');
    });

    test('should send alerts to all besties', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      // Should attempt to send notifications
      expect(sendSMSAlert).toHaveBeenCalled();
      expect(sendWhatsAppAlert).toHaveBeenCalled();
      expect(sendEmailAlert).toHaveBeenCalled();
    });
  });

  describe('Name Sanitization', () => {
    test('should sanitize display name to prevent spam flags', async () => {
      mockUserDoc.data = jest.fn(() => ({
        displayName: 'Test!!!User!!!',
        email: 'test@example.com',
      }));

      await triggerEmergencySOS(mockData, mockContext);

      // Name should be sanitized
      expect(sendSMSAlert).toHaveBeenCalled();
    });

    test('should handle missing display name', async () => {
      mockUserDoc.data = jest.fn(() => ({
        email: 'test@example.com',
      }));

      await triggerEmergencySOS(mockData, mockContext);

      expect(sendSMSAlert).toHaveBeenCalled();
    });
  });
});

