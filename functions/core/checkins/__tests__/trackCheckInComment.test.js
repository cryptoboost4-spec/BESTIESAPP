/**
 * Tests for trackCheckInComment trigger
 */
const admin = require('firebase-admin');
const { trackCheckInComment } = require('../trackCheckInComment');

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

describe('trackCheckInComment', () => {
  let mockSnapshot;
  let mockContext;
  let mockCheckInDoc;
  let mockOwnerDoc;
  let mockInteractionsCollection;
  let mockNotificationsCollection;

  beforeEach(() => {
    mockContext = {
      params: { checkInId: 'checkin123', commentId: 'comment123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'commenter123',
        userName: 'Commenter',
        text: 'Stay safe!',
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
    test('should track check-in comment interaction', async () => {
      await trackCheckInComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'checkInOwner123',
          bestieId: 'commenter123',
          type: 'checkin_comment',
          checkInId: 'checkin123',
        })
      );
    });

    test('should not track if check-in does not exist', async () => {
      mockCheckInDoc.exists = false;

      await trackCheckInComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });

    test('should not track if commenting on own check-in', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'checkInOwner123',
        userName: 'Owner',
        text: 'My comment',
      }));

      await trackCheckInComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    test('should create in-app notification', async () => {
      await trackCheckInComment(mockSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'checkInOwner123',
          type: 'checkin_comment',
          message: expect.stringContaining('Commenter'),
        })
      );
    });

    test('should send push notification if enabled', async () => {
      const messaging = admin.messaging();
      await trackCheckInComment(mockSnapshot, mockContext);

      expect(messaging.send).toHaveBeenCalled();
    });
  });
});

