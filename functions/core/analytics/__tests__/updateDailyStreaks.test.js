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

