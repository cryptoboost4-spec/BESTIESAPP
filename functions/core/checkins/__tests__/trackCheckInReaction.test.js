/**
 * Tests for trackCheckInReaction trigger
 */
const admin = require('firebase-admin');
const { trackCheckInReaction } = require('../trackCheckInReaction');

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

describe('trackCheckInReaction', () => {
  let mockSnapshot;
  let mockContext;
  let mockCheckInDoc;
  let mockOwnerDoc;
  let mockInteractionsCollection;
  let mockNotificationsCollection;

  beforeEach(() => {
    mockContext = {
      params: { checkInId: 'checkin123', reactionId: 'reaction123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'reactor123',
        userName: 'Reactor',
        emoji: '💜',
      })),
    };

    mockCheckInDoc = {
      exists: true,
      data: jest.fn(() => ({
        userId: 'checkInOwner123',
      })),
    };

    mockOwnerDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Check-In Owner',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-123',
      })),
    };

    mockInteractionsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    mockNotificationsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'checkins') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockCheckInDoc),
          })),
        };
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockOwnerDoc),
          })),
        };
      }
      if (collectionName === 'interactions') {
        return mockInteractionsCollection;
      }
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Interaction Tracking', () => {
    test('should track check-in reaction interaction', async () => {
      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'checkInOwner123',
          bestieId: 'reactor123',
          type: 'checkin_reaction',
          checkInId: 'checkin123',
        })
      );
    });

    test('should not track if check-in does not exist', async () => {
      mockCheckInDoc.exists = false;

      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });

    test('should not track if reacting to own check-in', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'checkInOwner123',
        userName: 'Owner',
      }));

      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    test('should create in-app notification', async () => {
      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'checkInOwner123',
          type: 'checkin_reaction',
          title: expect.stringContaining('Reaction'),
          message: expect.stringContaining('Reactor'),
        })
      );
    });

    test('should send push notification if enabled', async () => {
      const messaging = admin.messaging();
      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(messaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fcm-token-123',
          notification: expect.objectContaining({
            title: expect.stringContaining('Reaction'),
          }),
        })
      );
    });

    test('should not send push notification if disabled', async () => {
      mockOwnerDoc.data = jest.fn(() => ({
        displayName: 'Check-In Owner',
        notificationsEnabled: false,
      }));

      const messaging = admin.messaging();
      await trackCheckInReaction(mockSnapshot, mockContext);

      expect(messaging.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should not throw if notification fails', async () => {
      mockNotificationsCollection.add.mockRejectedValue(new Error('Notification failed'));

      await expect(trackCheckInReaction(mockSnapshot, mockContext)).resolves.not.toThrow();
    });
  });
});

