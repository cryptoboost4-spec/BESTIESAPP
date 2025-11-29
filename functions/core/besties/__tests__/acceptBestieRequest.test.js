/**
 * Tests for acceptBestieRequest function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { acceptBestieRequest } = require('../acceptBestieRequest');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      add: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
  messaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

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
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
      return {
        doc: jest.fn((docId) => {
          if (docId === 'bestie123') {
            return mockBestieRef;
          }
          if (docId === 'requester123') {
            return { get: jest.fn().mockResolvedValue(mockRequesterDoc) };
          }
          if (docId === 'accepter123') {
            return { get: jest.fn().mockResolvedValue(mockAccepterDoc) };
          }
          return { get: jest.fn().mockResolvedValue({ exists: false }) };
        }),
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
      ).rejects.toThrow('permission-denied');
    });

    test('should throw if user is not the recipient', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'other-user',
        status: 'pending',
      }));

      await expect(
        acceptBestieRequest(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });
  });

  describe('Idempotency', () => {
    test('should return success if request already accepted', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'accepter123',
        status: 'accepted',
      }));

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true, message: 'Bestie request already accepted' });
      expect(mockBestieRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Successful Acceptance', () => {
    test('should update bestie status to accepted', async () => {
      await acceptBestieRequest(mockData, mockContext);

      expect(mockBestieRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
          acceptedAt: expect.anything(),
        })
      );
    });

    test('should create notification for requester', async () => {
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
      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Data Integrity', () => {
    test('should NOT update user stats directly', async () => {
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
      mockNotificationsCollection.add.mockRejectedValue(new Error('Notification failed'));

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockBestieRef.update).toHaveBeenCalled();
    });

    test('should handle missing requester document gracefully', async () => {
      mockRequesterDoc.exists = false;

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockBestieRef.update).toHaveBeenCalled();
    });

    test('should handle push notification failure gracefully', async () => {
      const messaging = admin.messaging();
      messaging.send.mockRejectedValue(new Error('FCM failed'));

      const result = await acceptBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });
});

