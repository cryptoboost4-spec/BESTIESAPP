/**
 * Tests for trackReaction trigger
 */
const admin = require('firebase-admin');
const { trackReaction } = require('../trackReaction');

// Use global mocks from jest.setup.js

describe('trackReaction', () => {
  let mockSnapshot;
  let mockContext;
  let mockPostDoc;
  let mockInteractionsCollection;

  beforeEach(() => {
    mockContext = {
      params: { postId: 'post123', reactionId: 'reaction123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'reactor123',
        type: 'like',
      })),
    };

    mockPostDoc = {
      exists: true,
      data: jest.fn(() => ({
        userId: 'postOwner123',
      })),
    };

    mockInteractionsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'posts') {
        return {
          doc: jest.fn((id) => {
            if (id === 'post123') {
              return {
                get: jest.fn().mockResolvedValue(mockPostDoc),
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
    test('should track reaction interaction', async () => {
      await trackReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'postOwner123',
          bestieId: 'reactor123',
          type: 'post_reaction',
          postId: 'post123',
        })
      );
    });

    test('should not track if post does not exist', async () => {
      mockPostDoc.exists = false;

      await trackReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });

    test('should not track if reacting to own post', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'postOwner123',
        type: 'like',
      }));

      await trackReaction(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });
  });
});

