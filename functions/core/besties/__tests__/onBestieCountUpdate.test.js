/**
 * Tests for onBestieCountUpdate trigger
 * This trigger updates stats when bestie status changes to accepted
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onBestieCountUpdate } = require('../onBestieCountUpdate');

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
      arrayUnion: jest.fn((val) => val),
    },
  })),
}));

describe('onBestieCountUpdate', () => {
  let mockBeforeSnapshot;
  let mockAfterSnapshot;
  let mockContext;
  let mockRequesterRef;
  let mockRecipientRef;

  beforeEach(() => {
    mockContext = {
      params: { bestieId: 'bestie123' },
    };

    mockBeforeSnapshot = {
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'pending',
      })),
    };

    mockAfterSnapshot = {
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'accepted',
      })),
    };

    mockRequesterRef = {
      update: jest.fn().mockResolvedValue(),
    };

    mockRecipientRef = {
      update: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn((userId) => {
        if (userId === 'requester123') {
          return mockRequesterRef;
        }
        if (userId === 'recipient123') {
          return mockRecipientRef;
        }
        return { update: jest.fn().mockResolvedValue() };
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Status Change Detection', () => {
    test('should increment totalBesties for both users when status changes to accepted', async () => {
      await onBestieCountUpdate(mockAfterSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalBesties': expect.anything(),
        })
      );

      expect(mockRecipientRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalBesties': expect.anything(),
        })
      );
    });

    test('should update bestieUserIds for both users', async () => {
      await onBestieCountUpdate(mockAfterSnapshot, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: expect.anything(),
        })
      );

      expect(mockRecipientRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: expect.anything(),
        })
      );
    });

    test('should not update if status unchanged', async () => {
      mockBeforeSnapshot.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'pending',
      }));

      mockAfterSnapshot.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'pending',
      }));

      await onBestieCountUpdate(mockAfterSnapshot, mockContext);

      expect(mockRequesterRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('should only increment stats once per status change', async () => {
      await onBestieCountUpdate(mockAfterSnapshot, mockContext);

      // Each user should be updated once
      expect(mockRequesterRef.update).toHaveBeenCalledTimes(1);
      expect(mockRecipientRef.update).toHaveBeenCalledTimes(1);
    });
  });
});

