/**
 * Tests for onBestieCreated trigger
 */
const admin = require('firebase-admin');
const { onBestieCreated } = require('../onBestieCreated');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      add: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          count: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
    FieldValue: {
      increment: jest.fn((val) => val),
      arrayUnion: jest.fn((val) => val),
    },
  })),
  messaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

describe('onBestieCreated', () => {
  let mockSnapshot;
  let mockContext;
  let mockCacheRef;
  let mockRequesterRef;
  let mockRecipientRef;
  let mockBadgesRef;
  let mockNotificationsCollection;
  let mockBestiesQuery;

  beforeEach(() => {
    mockContext = {
      params: { bestieId: 'bestie123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        requesterName: 'Requester',
        status: 'accepted',
      })),
    };

    mockCacheRef = {
      set: jest.fn().mockResolvedValue(),
    };

    mockRequesterRef = {
      update: jest.fn().mockResolvedValue(),
    };

    mockRecipientRef = {
      update: jest.fn().mockResolvedValue(),
    };

    mockBadgesRef = {
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
    };

    mockNotificationsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    mockBestiesQuery = {
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
          })),
        })),
      })),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'analytics_cache') {
        return {
          doc: jest.fn(() => mockCacheRef),
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
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  notificationsEnabled: true,
                  fcmToken: 'fcm-token',
                }),
              }),
            };
          }),
        };
      }
      if (collectionName === 'badges') {
        return {
          doc: jest.fn(() => mockBadgesRef),
        };
      }
      if (collectionName === 'notifications') {
        return mockNotificationsCollection;
      }
      if (collectionName === 'besties') {
        return mockBestiesQuery;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics Cache Update', () => {
    test('should update analytics cache for all bestie creations', async () => {
      await onBestieCreated(mockSnapshot, mockContext);

      expect(mockCacheRef.set).toHaveBeenCalled();
    });
  });

  describe('Accepted Bestie Handling', () => {
    test('should update stats for both users when status is accepted', async () => {
      await onBestieCreated(mockSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalBesties': expect.anything(),
        })
      );

      expect(mockRecipientRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalBesties': expect.anything(),
        })
      );
    });

    test('should update bestieUserIds for both users', async () => {
      await onBestieCreated(mockSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: expect.anything(),
          featuredCircle: expect.anything(),
        })
      );
    });

    test('should award badges to both users', async () => {
      await onBestieCreated(mockSnapshot, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('badges');
    });
  });

  describe('Pending Bestie Handling', () => {
    test('should send notification to recipient for pending requests', async () => {
      mockSnapshot.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        requesterName: 'Requester',
        status: 'pending',
      }));

      await onBestieCreated(mockSnapshot, mockContext);

      expect(mockNotificationsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'recipient123',
          type: 'bestie_request',
          title: '💜 New Bestie Request!',
        })
      );
    });
  });
});

