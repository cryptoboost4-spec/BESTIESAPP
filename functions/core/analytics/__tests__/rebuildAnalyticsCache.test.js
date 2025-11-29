/**
 * Tests for rebuildAnalyticsCache function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { rebuildAnalyticsCache } = require('../rebuildAnalyticsCache');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      get: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

describe('rebuildAnalyticsCache', () => {
  let mockContext;
  let mockUsersSnapshot;
  let mockCheckInsSnapshot;
  let mockBestiesSnapshot;
  let mockCacheRef;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'admin123' },
    };

    mockUsersSnapshot = {
      size: 100,
    };

    mockCheckInsSnapshot = {
      size: 500,
    };

    mockBestiesSnapshot = {
      size: 200,
    };

    mockCacheRef = {
      set: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          get: jest.fn().mockResolvedValue(mockUsersSnapshot),
        };
      }
      if (collectionName === 'checkins') {
        return {
          get: jest.fn().mockResolvedValue(mockCheckInsSnapshot),
        };
      }
      if (collectionName === 'besties') {
        return {
          get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
        };
      }
      if (collectionName === 'analytics_cache') {
        return {
          doc: jest.fn(() => mockCacheRef),
        };
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Rebuild', () => {
    test('should rebuild analytics cache with current stats', async () => {
      await rebuildAnalyticsCache({}, mockContext);

      expect(mockCacheRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          totalUsers: 100,
          totalCheckIns: 500,
          totalBesties: 200,
        })
      );
    });

    test('should count all collections', async () => {
      await rebuildAnalyticsCache({}, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('users');
      expect(db.collection).toHaveBeenCalledWith('checkins');
      expect(db.collection).toHaveBeenCalledWith('besties');
    });
  });
});

