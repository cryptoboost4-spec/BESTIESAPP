/**
 * Tests for onCheckInCountUpdate trigger
 * This trigger updates stats when check-in status changes
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onCheckInCountUpdate } = require('../onCheckInCountUpdate');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
    FieldValue: {
      increment: jest.fn((val) => val),
    },
  })),
}));

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
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => mockUserRef),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Status Change Detection', () => {
    test('should increment completedCheckIns when status changes to completed', async () => {
      await onCheckInCountUpdate(mockAfterSnapshot, mockContext);

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

      await onCheckInCountUpdate(mockAfterSnapshot, mockContext);

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

      await onCheckInCountUpdate(mockAfterSnapshot, mockContext);

      // Should not update if status didn't change
      expect(mockUserRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('should only increment stats once per status change', async () => {
      await onCheckInCountUpdate(mockAfterSnapshot, mockContext);

      // Should only be called once
      expect(mockUserRef.update).toHaveBeenCalledTimes(1);
    });
  });
});

