/**
 * Tests for onBadgeEarned trigger
 */
const admin = require('firebase-admin');
const { onBadgeEarned } = require('../onBadgeEarned');

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

describe('onBadgeEarned', () => {
  let mockBeforeSnapshot;
  let mockAfterSnapshot;
  let mockContext;
  let mockUserDoc;
  let mockNotificationsCollection;

  beforeEach(() => {
    mockContext = {
      params: { userId: 'user123' },
    };

    mockBeforeSnapshot = {
      exists: true,
      data: jest.fn(() => ({
        badges: ['first_checkin'],
      })),
    };

    mockAfterSnapshot = {
      exists: true,
      data: jest.fn(() => ({
        badges: ['first_checkin', 'safety_pro'],
      })),
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-123',
      })),
    };

    mockNotificationsCollection = {
      add: jest.fn().mockResolvedValue(),
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
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Badge Detection', () => {
    test('should detect newly earned badges', async () => {
      await onBadgeEarned(mockAfterSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          type: 'badge_earned',
          badgeId: 'safety_pro',
        })
      );
    });

    test('should not notify for existing badges', async () => {
      await onBadgeEarned(mockAfterSnapshot, mockContext);

      // Should not notify for 'first_checkin' as it already existed
      const addCalls = mockNotificationsCollection.add.mock.calls;
      const firstCheckInNotifications = addCalls.filter(
        call => call[0].badgeId === 'first_checkin'
      );
      expect(firstCheckInNotifications.length).toBe(0);
    });

    test('should return null if no new badges', async () => {
      mockAfterSnapshot.data = jest.fn(() => ({
        badges: ['first_checkin'],
      }));

      const result = await onBadgeEarned(mockAfterSnapshot, mockContext);

      expect(result).toBeNull();
      expect(mockNotificationsCollection.add).not.toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    test('should create in-app notification for new badge', async () => {
      await onBadgeEarned(mockAfterSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'badge_earned',
          title: expect.stringContaining('Badge Earned'),
          read: false,
        })
      );
    });

    test('should send push notification if enabled', async () => {
      const messaging = admin.messaging();
      await onBadgeEarned(mockAfterSnapshot, mockContext);

      expect(messaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fcm-token-123',
          notification: expect.objectContaining({
            title: expect.stringContaining('Badge Earned'),
          }),
        })
      );
    });

    test('should not send push notification if disabled', async () => {
      mockUserDoc.data = jest.fn(() => ({
        displayName: 'Test User',
        notificationsEnabled: false,
      }));

      const messaging = admin.messaging();
      await onBadgeEarned(mockAfterSnapshot, mockContext);

      expect(messaging.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should not throw if user document missing', async () => {
      mockUserDoc.exists = false;

      await expect(onBadgeEarned(mockAfterSnapshot, mockContext)).resolves.not.toThrow();
    });

    test('should not throw if notification creation fails', async () => {
      mockNotificationsCollection.add.mockRejectedValue(new Error('Notification failed'));

      await expect(onBadgeEarned(mockAfterSnapshot, mockContext)).resolves.not.toThrow();
    });
  });
});

