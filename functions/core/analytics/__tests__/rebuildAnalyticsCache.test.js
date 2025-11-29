/**
 * Tests for rebuildAnalyticsCache function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { rebuildAnalyticsCache } = require('../rebuildAnalyticsCache');

// Use global mocks from jest.setup.js

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

    const mockAdminUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        isAdmin: true,
      })),
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
    
    // Mock for pagination queries
    const mockUsersQuerySnapshot = {
      empty: true,
      size: 0,
      docs: [],
    };
    
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        const collection = {
          doc: jest.fn((userId) => {
            if (userId === 'admin123') {
              return {
                get: jest.fn().mockResolvedValue(mockAdminUserDoc),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 100 }) }),
          })),
          limit: jest.fn(() => ({
            startAfter: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockUsersQuerySnapshot),
            })),
            get: jest.fn().mockResolvedValue(mockUsersQuerySnapshot),
          })),
        };
        return collection;
      }
      if (collectionName === 'checkins') {
        return {
          where: jest.fn(() => ({
            count: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ data: () => ({ count: 500 }) }),
            })),
          })),
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 500 }) }),
          })),
        };
      }
      if (collectionName === 'besties') {
        return {
          where: jest.fn(() => ({
            count: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ data: () => ({ count: 200 }) }),
            })),
          })),
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 200 }) }),
          })),
        };
      }
      if (collectionName === 'templates') {
        return {
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
          })),
        };
      }
      if (collectionName === 'badges') {
        return {
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
          })),
        };
      }
      if (collectionName === 'analytics_cache') {
        return {
          doc: jest.fn(() => mockCacheRef),
        };
      }
      return {
        count: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
        })),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Rebuild', () => {
    test('should rebuild analytics cache with current stats', async () => {
      jest.clearAllMocks();
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
      jest.clearAllMocks();
      await rebuildAnalyticsCache({}, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('users');
      expect(db.collection).toHaveBeenCalledWith('checkins');
      expect(db.collection).toHaveBeenCalledWith('besties');
    });
  });
});

