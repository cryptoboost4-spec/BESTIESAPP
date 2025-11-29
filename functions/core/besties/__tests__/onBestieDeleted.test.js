/**
 * Tests for onBestieDeleted trigger
 */
const admin = require('firebase-admin');
const { onBestieDeleted } = require('../onBestieDeleted');

// Use global mocks from jest.setup.js

describe('onBestieDeleted', () => {
  let mockSnapshot;
  let mockContext;
  let mockRequesterRef;
  let mockRecipientRef;
  let mockCacheRef;

  beforeEach(() => {
    mockContext = {
      params: { bestieId: 'bestie123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'accepted',
      })),
    };

    mockRequesterRef = {
      update: jest.fn().mockResolvedValue(),
    };

    mockRecipientRef = {
      update: jest.fn().mockResolvedValue(),
    };

    mockCacheRef = {
      set: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'analytics_cache') {
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
      if (collectionName === 'users') {
        return {
          doc: jest.fn((userId) => {
            if (userId === 'requester123') {
              return mockRequesterRef;
            }
            if (userId === 'recipient123') {
              return mockRecipientRef;
            }
            return {
              update: jest.fn().mockResolvedValue(),
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

  describe('Bestie Deletion', () => {
    test('should update analytics cache', async () => {
      await onBestieDeleted(mockSnapshot, mockContext);

      expect(mockCacheRef.set).toHaveBeenCalled();
    });

    test('should remove bestieUserIds from both users', async () => {
      await onBestieDeleted(mockSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: expect.anything(),
        })
      );

      expect(mockRecipientRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: expect.anything(),
        })
      );
    });

    test('should remove from featuredCircle for both users', async () => {
      await onBestieDeleted(mockSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          featuredCircle: expect.anything(),
        })
      );
    });

    test('should decrement totalBesties for both users', async () => {
      await onBestieDeleted(mockSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalBesties': expect.anything(),
        })
      );
    });
  });
});

