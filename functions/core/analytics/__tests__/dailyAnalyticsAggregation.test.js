/**
 * Tests for dailyAnalyticsAggregation function
 */
const admin = require('firebase-admin');
const { dailyAnalyticsAggregation } = require('../dailyAnalyticsAggregation');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
        })),
        get: jest.fn(),
      })),
      add: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
      fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000 })),
    },
  })),
}));

describe('dailyAnalyticsAggregation', () => {
  let mockCheckInsSnapshot;
  let mockDailyStatsCollection;

  beforeEach(() => {
    mockCheckInsSnapshot = {
      size: 3,
      forEach: jest.fn((callback) => {
        // Simulate 3 check-ins: 2 completed, 1 alerted
        callback({
          data: () => ({ status: 'completed', createdAt: {} }),
        });
        callback({
          data: () => ({ status: 'completed', createdAt: {} }),
        });
        callback({
          data: () => ({ status: 'alerted', createdAt: {} }),
        });
      }),
    };

    mockDailyStatsCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'checkins') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockCheckInsSnapshot),
            })),
          })),
        };
      }
      if (collectionName === 'daily_stats') {
        return mockDailyStatsCollection;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Aggregation', () => {
    test('should aggregate check-in statistics', async () => {
      await dailyAnalyticsAggregation({});

      expect(mockDailyStatsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCheckIns: 3,
          completedCheckIns: 2,
          alertedCheckIns: 1,
        })
      );
    });

    test('should include date in stats', async () => {
      await dailyAnalyticsAggregation({});

      expect(mockDailyStatsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.anything(),
        })
      );
    });

    test('should handle empty check-ins', async () => {
      mockCheckInsSnapshot.size = 0;
      mockCheckInsSnapshot.forEach = jest.fn();

      await dailyAnalyticsAggregation({});

      expect(mockDailyStatsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCheckIns: 0,
          completedCheckIns: 0,
          alertedCheckIns: 0,
        })
      );
    });
  });
});

