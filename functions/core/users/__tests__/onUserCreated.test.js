/**
 * Tests for onUserCreated trigger
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onUserCreated } = require('../onUserCreated');

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

describe('onUserCreated', () => {
  let mockSnapshot;
  let mockContext;
  let mockNotificationsCollection;

  beforeEach(() => {
    mockContext = {
      params: { userId: 'user123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        displayName: 'Test User',
        email: 'test@example.com',
      })),
    };

    mockNotificationsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => mockNotificationsCollection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Welcome Notification', () => {
    test('should create welcome notification', async () => {
      await onUserCreated(mockSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          type: 'welcome',
          title: expect.stringContaining('Welcome'),
        })
      );
    });

    test('should include user display name in notification', async () => {
      await onUserCreated(mockSnapshot, mockContext);

      const addCall = mockNotificationsCollection.add.mock.calls[0][0];
      expect(addCall.message).toContain('Test User');
    });
  });

  describe('Error Handling', () => {
    test('should not throw if notification creation fails', async () => {
      mockNotificationsCollection.add.mockRejectedValue(new Error('Notification failed'));

      // Should not throw - user creation should succeed
      await expect(onUserCreated(mockSnapshot, mockContext)).resolves.not.toThrow();
    });
  });
});

