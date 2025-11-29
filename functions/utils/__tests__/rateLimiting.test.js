/**
 * Rate Limiting Utility Tests
 */
const {
  RATE_LIMITS,
  checkUserRateLimit,
  checkRateLimit,
} = require('../rateLimiting');
const admin = require('firebase-admin');

// Mock Firestore
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
        })),
        get: jest.fn(),
      })),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
    })),
  })),
  firestore: {
    Timestamp: {
      now: jest.fn(() => ({ toMillis: () => Date.now() })),
      fromDate: jest.fn((date) => ({ toMillis: () => date.getTime() })),
    },
    FieldValue: {
      increment: jest.fn((val) => val),
    },
  },
}));

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
      mockSnapshot.size = 1;
      const db = admin.firestore();
      db.collection = jest.fn(() => mockQuery);

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
      mockSnapshot.size = 3;
      const db = admin.firestore();
      db.collection = jest.fn(() => mockQuery);

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

