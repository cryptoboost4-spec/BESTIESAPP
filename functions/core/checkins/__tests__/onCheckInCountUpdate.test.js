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
      })),
    };

    mockUserRef = {
      update: jest.fn().mockResolvedValue(),
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
        const query = {
          where: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
        };
        return query;
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
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onCheckInCountUpdate(change, mockContext);

      // Should only be called once
      expect(mockUserRef.update).toHaveBeenCalledTimes(1);
    });
  });
});

