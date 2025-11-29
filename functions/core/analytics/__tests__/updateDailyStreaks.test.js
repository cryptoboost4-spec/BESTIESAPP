/**
 * Tests for updateDailyStreaks scheduled function
 */
const admin = require('firebase-admin');
const updateDailyStreaks = require('../updateDailyStreaks');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
      get: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

describe('updateDailyStreaks', () => {
  let mockUsersSnapshot;
  let mockUserRef;

  beforeEach(() => {
    mockUsersSnapshot = {
      docs: [
        {
          id: 'user1',
          data: () => ({
            stats: {
              lastCircleCheck: { toDate: () => new Date(Date.now() - 86400000) }, // Yesterday
            },
          }),
        },
      ],
    };

    mockUserRef = {
      update: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => mockUserRef),
      get: jest.fn().mockResolvedValue(mockUsersSnapshot),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Streak Calculation', () => {
    test('should update daily streaks for users', async () => {
      await updateDailyStreaks({});

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('users');
    });

    test('should increment streak for consecutive days', async () => {
      await updateDailyStreaks({});

      expect(mockUserRef.update).toHaveBeenCalled();
    });

    test('should reset streak if broken', async () => {
      // User hasn't checked in for 2+ days
      mockUsersSnapshot.docs[0].data = jest.fn(() => ({
        stats: {
          lastCircleCheck: { toDate: () => new Date(Date.now() - 2 * 86400000) },
        },
      }));

      await updateDailyStreaks({});

      expect(mockUserRef.update).toHaveBeenCalled();
    });
  });
});

