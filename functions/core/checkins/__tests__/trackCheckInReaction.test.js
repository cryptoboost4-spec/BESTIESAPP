/**
 * Tests for trackCheckInReaction trigger
 */
const admin = require('firebase-admin');
const { trackCheckInReaction } = require('../trackCheckInReaction');

// Use global mocks from jest.setup.js

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
          doc: jest.fn((id) => {
            if (id === 'checkin123') {
              return {
                get: jest.fn().mockResolvedValue(mockCheckInDoc),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
        };
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'checkInOwner123') {
              return {
                get: jest.fn().mockResolvedValue(mockOwnerDoc),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
        };
      }
      if (collectionName === 'interactions') {
        return mockInteractionsCollection;
      }
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
      // Default
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
        })),
      };
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

  // Note: trackCheckInReaction only tracks interactions, it doesn't create notifications
});

