/**
 * Rate Limiting Utility Tests
 */
// Use global mocks from jest.setup.js
const admin = require('firebase-admin');

// Import after mocks are set up
const {
  RATE_LIMITS,
  checkUserRateLimit,
  checkRateLimit,
} = require('../rateLimiting');

describe('Rate Limiting Utilities', () => {
  describe('RATE_LIMITS', () => {
    test('should have SOS_PER_HOUR limit', () => {
      expect(RATE_LIMITS.SOS_PER_HOUR).toEqual({ count: 3, window: 3600000 });
    });

    test('should have BESTIE_INVITES_PER_DAY limit', () => {
      expect(RATE_LIMITS.BESTIE_INVITES_PER_DAY).toEqual({ count: 20, window: 86400000 });
    });

    test('should have CHECKIN_EXTENSIONS_PER_HOUR limit', () => {
      expect(RATE_LIMITS.CHECKIN_EXTENSIONS_PER_HOUR).toEqual({ count: 10, window: 3600000 });
    });
  });

  describe('checkUserRateLimit', () => {
    let mockQuery;
    let mockSnapshot;

    beforeEach(() => {
      mockSnapshot = {
        size: 0,
        forEach: jest.fn(),
      };
      mockQuery = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };
    });

    test('should return allowed=true if count is below limit', async () => {
      const mockSnapshotWithSize = {
        size: 1,
        forEach: jest.fn(),
      };
      const db = admin.firestore();
      // Override collection to return our mock query - ensure it supports chaining
      db.collection = jest.fn((name) => {
        if (name === 'testCollection') {
          return {
            where: jest.fn((field, op, value) => {
              // First where clause returns a query that supports chaining
              return {
                where: jest.fn((field2, op2, value2) => {
                  // Second where clause returns the final query
                  return {
                    get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
                  };
                }),
                get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
              };
            }),
            get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
          };
        }
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
        };
      });

      const result = await checkUserRateLimit(
        'user123',
        'testFunction',
        { count: 3, window: 3600000 },
        'testCollection'
      );

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(1);
      expect(result.remaining).toBe(2);
    });

    test('should return allowed=false if count exceeds limit', async () => {
      const mockSnapshotWithSize = {
        size: 3,
        forEach: jest.fn(),
      };
      const db = admin.firestore();
      // Override collection to return our mock query - ensure it supports chaining
      db.collection = jest.fn((name) => {
        if (name === 'testCollection') {
          return {
            where: jest.fn((field, op, value) => {
              // First where clause returns a query that supports chaining
              return {
                where: jest.fn((field2, op2, value2) => {
                  // Second where clause returns the final query
                  return {
                    get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
                  };
                }),
                get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
              };
            }),
            get: jest.fn().mockResolvedValue(mockSnapshotWithSize),
          };
        }
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
        };
      });

      const result = await checkUserRateLimit(
        'user123',
        'testFunction',
        { count: 3, window: 3600000 },
        'testCollection'
      );

      expect(result.allowed).toBe(false);
      expect(result.count).toBe(3);
    });
  });
});

