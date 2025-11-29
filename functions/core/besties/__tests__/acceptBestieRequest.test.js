/**
 * Tests for acceptBestieRequest function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { acceptBestieRequest } = require('../acceptBestieRequest');

// Use global mocks from jest.setup.js

describe('acceptBestieRequest', () => {
  let mockContext;
  let mockBestieRef;
  let mockBestieDoc;
  let mockData;
  let mockRequesterDoc;
  let mockAccepterDoc;
  let mockNotificationsCollection;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'accepter123' },
    };

    mockBestieDoc = {
      exists: true,
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'accepter123',
        status: 'pending',
      })),
    };

    mockBestieRef = {
      get: jest.fn().mockResolvedValue(mockBestieDoc),
      update: jest.fn().mockResolvedValue(),
    };

    mockRequesterDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Requester',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-123',
      })),
    };

    mockAccepterDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Accepter',
      })),
    };

    mockNotificationsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    // Override collection method to return our mocks
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
      if (collectionName === 'besties') {
        return {
          doc: jest.fn((docId) => {
            if (docId === 'bestie123') {
              return mockBestieRef;
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
              update: jest.fn().mockResolvedValue(),
            };
          }),
        };
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn((docId) => {
            if (docId === 'requester123') {
              return { get: jest.fn().mockResolvedValue(mockRequesterDoc), update: jest.fn().mockResolvedValue() };
            }
            if (docId === 'accepter123') {
              return { get: jest.fn().mockResolvedValue(mockAccepterDoc), update: jest.fn().mockResolvedValue() };
            }
            return { get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }), update: jest.fn().mockResolvedValue() };
          }),
        };
      }
      // Default collection - support rate limiting queries
      const query = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
      };
      return {
        ...query,
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });

    mockData = { bestieId: 'bestie123' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        acceptBestieRequest(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if bestieId is missing', async () => {
      const invalidData = {};

      await expect(
        acceptBestieRequest(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if bestieId is invalid', async () => {
      const invalidData = { bestieId: '' };

      await expect(
        acceptBestieRequest(invalidData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    test('should throw if bestie request does not exist', async () => {
      mockBestieDoc.exists = false;

      await expect(
        acceptBestieRequest(mockData, mockContext)
      ).rejects.toThrow('Invalid request');
    });

    test('should throw if user is not the recipient', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'other-user',
        status: 'pending',
      }));

      await expect(
        acceptBestieRequest(mockData, mockContext)
      ).rejects.toThrow('Invalid request');
    });
  });

  describe('Idempotency', () => {
    test('should return success if request already accepted', async () => {
      // Create a fresh mock for this test
      const acceptedBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'accepted',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(acceptedBestieDoc);

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true, message: 'Bestie request already accepted' });
      expect(mockBestieRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Successful Acceptance', () => {
    test('should update bestie status to accepted', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      await acceptBestieRequest(mockData, mockContext);

      expect(mockBestieRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
          acceptedAt: expect.anything(),
        })
      );
    });

    test('should create notification for requester', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      await acceptBestieRequest(mockData, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'requester123',
          type: 'bestie_accepted',
          title: '🎉 Bestie Request Accepted!',
          message: expect.stringContaining('Accepter'),
        })
      );
    });

    test('should send push notification if enabled', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      const messaging = admin.messaging();
      await acceptBestieRequest(mockData, mockContext);

      expect(messaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fcm-token-123',
          notification: expect.objectContaining({
            title: '🎉 Bestie Request Accepted!',
          }),
        })
      );
    });

    test('should return success on acceptance', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Data Integrity', () => {
    test('should NOT update user stats directly', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      // This test ensures we're not double-counting
      // Stats should only be updated by onBestieCountUpdate trigger
      await acceptBestieRequest(mockData, mockContext);

      // Verify we're only updating the bestie document
      expect(mockBestieRef.update).toHaveBeenCalledTimes(1);
      const updateCall = mockBestieRef.update.mock.calls[0][0];
      
      // Should not contain stats updates
      expect(updateCall).not.toHaveProperty('stats');
      expect(updateCall).not.toHaveProperty('totalBesties');
    });
  });

  describe('Error Handling', () => {
    test('should accept request even if notification fails', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      mockNotificationsCollection.add.mockRejectedValue(new Error('Notification failed'));

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockBestieRef.update).toHaveBeenCalled();
    });

    test('should handle missing requester document gracefully', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'accepter123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);
      
      // Make requester doc not exist
      const db = admin.firestore();
      db.collection = jest.fn((name) => {
        if (name === 'notifications') {
          return mockNotificationsCollection;
        }
        if (name === 'besties') {
          return {
            doc: jest.fn(() => mockBestieRef),
          };
        }
        if (name === 'users') {
          return {
            doc: jest.fn((docId) => {
              if (docId === 'requester123') {
                return { get: jest.fn().mockResolvedValue({ exists: false, data: () => undefined }) };
              }
              return { get: jest.fn().mockResolvedValue(mockAccepterDoc), update: jest.fn().mockResolvedValue() };
            }),
          };
        }
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
        };
      });

      mockRequesterDoc.exists = false;

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockBestieRef.update).toHaveBeenCalled();
    });

    test('should handle push notification failure gracefully', async () => {
      mockBestieDoc.exists = true;
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'accepter123',
        status: 'pending',
      }));

      const messaging = admin.messaging();
      messaging.send.mockRejectedValue(new Error('FCM failed'));

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });
});

