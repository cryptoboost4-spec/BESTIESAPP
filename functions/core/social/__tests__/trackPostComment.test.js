/**
 * Tests for trackPostComment trigger
 */
const admin = require('firebase-admin');
const { trackPostComment } = require('../trackPostComment');

// Use global mocks from jest.setup.js

describe('trackPostComment', () => {
  let mockSnapshot;
  let mockContext;
  let mockPostDoc;
  let mockInteractionsCollection;

  beforeEach(() => {
    mockContext = {
      params: { postId: 'post123', commentId: 'comment123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'commenter123',
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
    test('should track post comment interaction', async () => {
      await trackPostComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'postOwner123',
          bestieId: 'commenter123',
          type: 'post_comment',
          postId: 'post123',
        })
      );
    });

    test('should not track if post does not exist', async () => {
      mockPostDoc.exists = false;

      await trackPostComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });

    test('should not track if commenting on own post', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'postOwner123',
      }));

      await trackPostComment(mockSnapshot, mockContext);

      expect(mockInteractionsCollection.add).not.toHaveBeenCalled();
    });
  });
});

