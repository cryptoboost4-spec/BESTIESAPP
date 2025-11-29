/**
 * Tests for updateDailyStreaks scheduled function
 */
const admin = require('firebase-admin');
const { updateDailyStreaks } = require('../updateDailyStreaks');

// Use global mocks from jest.setup.js

describe('updateDailyStreaks', () => {
  let mockUsersSnapshot;
  let mockUserRef;

  beforeEach(() => {
    mockUserRef = {
      update: jest.fn().mockResolvedValue(),
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Set to start of yesterday
    yesterday.setMinutes(0, 0, 0);

    mockUsersSnapshot = {
      docs: [
        {
          id: 'user1',
          ref: mockUserRef,
          data: () => ({
            stats: {
              currentStreak: 0,
              longestStreak: 0,
              daysActive: 0,
            },
            lastActive: {
              toDate: () => yesterday,
              toMillis: () => yesterday.getTime(),
            },
          }),
        },
      ],
      empty: false,
      size: 1,
    };

    const db = admin.firestore();
    db.collection = jest.fn((name) => {
      if (name === 'users') {
        const mockCollection = {
          doc: jest.fn((id) => {
            if (id === 'user1') {
              return mockUserRef;
            }
            return {
              update: jest.fn().mockResolvedValue(),
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
          limit: jest.fn((size) => {
            return {
              startAfter: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  empty: true,
                  docs: [],
                  size: 0,
                }),
              })),
              get: jest.fn().mockResolvedValue(mockUsersSnapshot),
            };
          }),
        };
        return mockCollection;
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
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);
      twoDaysAgo.setMinutes(0, 0, 0);
      
      mockUsersSnapshot.docs[0].data = jest.fn(() => ({
        stats: {
          currentStreak: 5,
          longestStreak: 5,
          daysActive: 5,
        },
        lastActive: {
          toDate: () => twoDaysAgo,
          toMillis: () => twoDaysAgo.getTime(),
        },
      }));

      await updateDailyStreaks({});

      // Should update because streak changed from 5 to 0 (daysSinceActive = 2 > 1)
      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.currentStreak': 0,
        })
      );
    });
  });
});

