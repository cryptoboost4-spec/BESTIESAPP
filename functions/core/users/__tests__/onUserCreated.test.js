/**
 * Tests for onUserCreated trigger
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onUserCreated } = require('../onUserCreated');

// Use global mocks from jest.setup.js

describe('onUserCreated', () => {
  let mockUser;
  let mockCacheRef;
  let mockUserRef;
  let mockBadgesRef;

  beforeEach(() => {
    // Firebase Auth user object (not Firestore snapshot)
    mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      phoneNumber: null,
    };

    mockCacheRef = {
      set: jest.fn().mockResolvedValue(),
    };

    mockUserRef = {
      set: jest.fn().mockResolvedValue(),
    };

    mockBadgesRef = {
      set: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((name) => {
      if (name === 'analytics_cache') {
        return {
          doc: jest.fn((id) => {
            if (id === 'realtime') {
              return mockCacheRef;
            }
            return {
              set: jest.fn().mockResolvedValue(),
            };
          }),
        };
      }
      if (name === 'users') {
        return {
          doc: jest.fn((userId) => {
            if (userId === 'user123') {
              return mockUserRef;
            }
            return {
              set: jest.fn().mockResolvedValue(),
            };
          }),
        };
      }
      if (name === 'badges') {
        return {
          doc: jest.fn((userId) => {
            if (userId === 'user123') {
              return mockBadgesRef;
            }
            return {
              set: jest.fn().mockResolvedValue(),
            };
          }),
        };
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

  describe('User Initialization', () => {
    test('should create user document', async () => {
      await onUserCreated(mockUser);

      expect(mockUserRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
        })
      );
    });

    test('should create badges document', async () => {
      await onUserCreated(mockUser);

      expect(mockBadgesRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          badges: [],
        })
      );
    });

    test('should update analytics cache', async () => {
      await onUserCreated(mockUser);

      expect(mockCacheRef.set).toHaveBeenCalled();
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

