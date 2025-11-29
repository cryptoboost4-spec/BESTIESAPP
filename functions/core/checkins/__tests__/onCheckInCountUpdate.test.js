/**
 * Tests for onCheckInCountUpdate trigger
 * This trigger updates stats when check-in status changes
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onCheckInCountUpdate } = require('../onCheckInCountUpdate');

// Use global mocks from jest.setup.js

describe('onCheckInCountUpdate', () => {
  let mockBeforeSnapshot;
  let mockAfterSnapshot;
  let mockContext;
  let mockUserRef;

  beforeEach(() => {
    mockContext = {
      params: { checkInId: 'checkin123' },
    };

    mockBeforeSnapshot = {
      data: jest.fn(() => ({
        userId: 'user123',
        status: 'active',
      })),
    };

    mockAfterSnapshot = {
      data: jest.fn(() => ({
        userId: 'user123',
        status: 'completed',
        completedAt: {
          toDate: () => new Date(),
          toMillis: () => Date.now(),
        },
      })),
    };

    mockUserRef = {
      update: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          stats: {
            currentStreak: 0,
            longestStreak: 0,
          },
        }),
      }),
    };

    const db = admin.firestore();
    db.collection = jest.fn((name) => {
      if (name === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'user123') {
              return mockUserRef;
            }
            return {
              update: jest.fn().mockResolvedValue(),
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
        };
      }
      if (name === 'analytics_cache') {
        return {
          doc: jest.fn(() => ({
            set: jest.fn().mockResolvedValue(),
          })),
        };
      }
      if (name === 'checkins') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCheckInsSnapshot = {
          size: 1, // This is the first completion today
          docs: [],
        };
        const yesterdayCheckInsSnapshot = {
          size: 0, // No completion yesterday, so streak should be 1
          docs: [],
        };
        return {
          where: jest.fn((field, op, value) => {
            if (field === 'userId' && op === '==' && value === 'user123') {
              return {
                where: jest.fn((field2, op2, value2) => {
                  if (field2 === 'status' && op2 === '==' && value2 === 'completed') {
                    return {
                      count: jest.fn(() => ({
                        get: jest.fn().mockResolvedValue({ data: () => ({ count: 1 }) }),
                      })),
                      where: jest.fn((field3, op3, value3) => {
                        if (field3 === 'completedAt') {
                          return {
                            where: jest.fn(() => ({
                              get: jest.fn().mockResolvedValue(todayCheckInsSnapshot),
                            })),
                            get: jest.fn().mockResolvedValue(todayCheckInsSnapshot),
                          };
                        }
                        return {
                          get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
                        };
                      }),
                      get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
                    };
                  }
                  return {
                    count: jest.fn(() => ({
                      get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
                    })),
                    get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
                  };
                }),
                count: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
                })),
                get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
              };
            }
            return {
              where: jest.fn().mockReturnThis(),
              count: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
              })),
              get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
            };
          }),
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
          })),
        };
      }
      if (name === 'badges') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            update: jest.fn().mockResolvedValue(),
            set: jest.fn().mockResolvedValue(),
          })),
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

  describe('Status Change Detection', () => {
    test('should increment completedCheckIns when status changes to completed', async () => {
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onCheckInCountUpdate(change, mockContext);

      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.completedCheckIns': expect.anything(),
        })
      );
    });

    test('should increment alertedCheckIns when status changes to alerted', async () => {
      mockAfterSnapshot.data = jest.fn(() => ({
        userId: 'user123',
        status: 'alerted',
      }));
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };

      await onCheckInCountUpdate(change, mockContext);

      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.alertedCheckIns': expect.anything(),
        })
      );
    });

    test('should not update stats if status unchanged', async () => {
      mockBeforeSnapshot.data = jest.fn(() => ({
        userId: 'user123',
        status: 'active',
      }));

      mockAfterSnapshot.data = jest.fn(() => ({
        userId: 'user123',
        status: 'active',
      }));

      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onCheckInCountUpdate(change, mockContext);

      // Should not update if status didn't change
      expect(mockUserRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('should only increment stats once per status change', async () => {
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onCheckInCountUpdate(change, mockContext);

      // Should be called twice: once for completedCheckIns, once for lastCircleCheck
      expect(mockUserRef.update).toHaveBeenCalledTimes(2);
    });
  });
});

