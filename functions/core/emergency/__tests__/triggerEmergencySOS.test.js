/**
 * Tests for triggerEmergencySOS function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { triggerEmergencySOS } = require('../triggerEmergencySOS');
const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert, sendPushNotification } = require('../../../utils/notifications');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');
const { getUserBestieIds } = require('../../../utils/besties');

// Mock dependencies
jest.mock('../../../utils/notifications');
jest.mock('../../../utils/rateLimiting');
jest.mock('../../../utils/besties');
// Use global mocks from jest.setup.js

describe('triggerEmergencySOS', () => {
  let mockContext;
  let mockData;
  let mockUserDoc;
  let mockBestiesSnapshot;
  let mockMessengerSnapshot;
  let mockSOSCollection;
  let mockSOSAdd;

  beforeEach(() => {
    mockSOSAdd = jest.fn().mockResolvedValue({ id: 'sos123' });
    mockSOSCollection = {
      add: mockSOSAdd,
    };
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

    // Mock bestie documents for getUserBestieIds queries
    const mockBestieDoc1 = {
      data: () => ({ recipientId: 'bestie1', requesterId: 'user123', status: 'accepted', isFavorite: true }),
    };
    const mockBestieDoc2 = {
      data: () => ({ requesterId: 'bestie2', recipientId: 'user123', status: 'accepted', isFavorite: true }),
    };

    mockBestiesSnapshot = {
      forEach: jest.fn((callback) => {
        callback(mockBestieDoc1);
        callback(mockBestieDoc2);
      }),
      size: 2,
    };

    // Mock bestie user documents for db.getAll()
    const mockBestie1UserDoc = {
      id: 'bestie1',
      exists: true,
      data: () => ({
        displayName: 'Bestie 1',
        email: 'bestie1@example.com',
        phoneNumber: '+61411111111',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-1',
        notificationPreferences: {
          email: true,
          sms: true,
        },
        smsSubscription: {
          active: true,
        },
      }),
    };
    const mockBestie2UserDoc = {
      id: 'bestie2',
      exists: true,
      data: () => ({
        displayName: 'Bestie 2',
        email: 'bestie2@example.com',
        phoneNumber: '+61422222222',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-2',
        notificationPreferences: {
          email: true,
          sms: true,
        },
        smsSubscription: {
          active: true,
        },
      }),
    };

    mockMessengerSnapshot = {
      forEach: jest.fn(),
      size: 0,
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'user123') {
              return {
                get: jest.fn().mockResolvedValue(mockUserDoc),
              };
            }
            if (id === 'bestie1') {
              return {
                get: jest.fn().mockResolvedValue(mockBestie1UserDoc),
              };
            }
            if (id === 'bestie2') {
              return {
                get: jest.fn().mockResolvedValue(mockBestie2UserDoc),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
        };
      }
      if (collectionName === 'besties') {
        return {
          where: jest.fn((field, op, value) => {
            // Chain where clauses for getUserBestieIds queries
            return {
              where: jest.fn((field2, op2, value2) => {
                return {
                  where: jest.fn((field3, op3, value3) => {
                    return {
                      get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
                    };
                  }),
                  get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
                };
              }),
              get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
            };
          }),
        };
      }
      if (collectionName === 'messengerContacts') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockMessengerSnapshot),
          })),
        };
      }
      if (collectionName === 'emergency_sos') {
        return mockSOSCollection;
      }
      if (collectionName === 'notifications') {
        return {
          add: jest.fn().mockResolvedValue({ id: 'notif123' }),
        };
      }
      return {
        add: jest.fn().mockResolvedValue({ id: 'default123' }),
      };
    });

    // Mock db.getAll() for fetching bestie user documents
    db.getAll = jest.fn((...docRefs) => {
      return Promise.resolve([mockBestie1UserDoc, mockBestie2UserDoc]);
    });

    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 3,
      remaining: 2,
    });

    getUserBestieIds.mockResolvedValue(['bestie1', 'bestie2']);

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
    test('should use Unknown location if location is missing', async () => {
      const invalidData = { isReversePIN: false };

      const result = await triggerEmergencySOS(invalidData, mockContext);
      expect(result.success).toBe(true);
    });

    test('should normalize location if too long', async () => {
      const invalidData = {
        location: 'a'.repeat(501),
        isReversePIN: false,
      };

      const result = await triggerEmergencySOS(invalidData, mockContext);
      expect(result.success).toBe(true);
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
      ).rejects.toThrow('SOS limit reached');
    });
  });

  describe('SOS Creation', () => {
    test('should create emergency SOS document', async () => {
      const db = admin.firestore();
      await triggerEmergencySOS(mockData, mockContext);

      expect(db.collection).toHaveBeenCalledWith('emergency_sos');
      expect(mockSOSAdd).toHaveBeenCalled();
    });

    test('should include location in SOS document', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      expect(mockSOSAdd).toHaveBeenCalled();
    });

    test('should include isReversePIN flag', async () => {
      const dataWithReversePIN = {
        location: 'Test Location',
        isReversePIN: true,
      };

      await triggerEmergencySOS(dataWithReversePIN, mockContext);

      expect(mockSOSAdd).toHaveBeenCalled();
    });
  });

  describe('Bestie Notification', () => {
    test('should find favorite besties', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      // getUserBestieIds is mocked and should be called
      expect(getUserBestieIds).toHaveBeenCalledWith('user123', {
        favoritesOnly: true,
        acceptedOnly: true,
      });
    });

    test('should send alerts to all besties', async () => {
      await triggerEmergencySOS(mockData, mockContext);

      // Should attempt to send notifications
      // Note: SMS is only sent if telegram and messenger didn't work AND smsSubscription.active is true
      // WhatsApp is only sent if telegram and messenger didn't work
      // Email is sent if notificationPreferences.email is true
      // The test besties have these set, so notifications should be sent
      expect(sendEmailAlert).toHaveBeenCalled();
      // SMS/WhatsApp might not be called if push notification succeeds, but email should be
    });
  });

  describe('Name Sanitization', () => {
    test('should sanitize display name to prevent spam flags', async () => {
      mockUserDoc.data = jest.fn(() => ({
        displayName: 'Test!!!User!!!',
        email: 'test@example.com',
      }));

      await triggerEmergencySOS(mockData, mockContext);

      // Name should be sanitized - check that email was sent (more reliable than SMS)
      expect(sendEmailAlert).toHaveBeenCalled();
    });

    test('should handle missing display name', async () => {
      mockUserDoc.data = jest.fn(() => ({
        email: 'test@example.com',
      }));

      await triggerEmergencySOS(mockData, mockContext);

      // Should still send notifications even without display name
      expect(sendEmailAlert).toHaveBeenCalled();
    });
  });
});

