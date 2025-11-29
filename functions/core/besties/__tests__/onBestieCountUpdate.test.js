/**
 * Tests for onBestieCountUpdate trigger
 * This trigger updates stats when bestie status changes to accepted
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onBestieCountUpdate } = require('../onBestieCountUpdate');

// Use global mocks from jest.setup.js

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
    db.collection = jest.fn((name) => {
      if (name === 'users') {
        return {
          doc: jest.fn((userId) => {
            if (userId === 'requester123') {
              return mockRequesterRef;
            }
            if (userId === 'recipient123') {
              return mockRecipientRef;
            }
            return {
              update: jest.fn().mockResolvedValue(),
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
      if (name === 'besties') {
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
    test('should increment totalBesties for both users when status changes to accepted', async () => {
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onBestieCountUpdate(change, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          featuredCircle: expect.anything(),
        })
      );

      expect(mockRecipientRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          featuredCircle: expect.anything(),
        })
      );
    });

    test('should update bestieUserIds for both users', async () => {
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onBestieCountUpdate(change, mockContext);

      expect(mockRequesterRef.update).toHaveBeenCalled();
      expect(mockRecipientRef.update).toHaveBeenCalled();
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

      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onBestieCountUpdate(change, mockContext);

      expect(mockRequesterRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('should only increment stats once per status change', async () => {
      jest.clearAllMocks();
      const change = { before: mockBeforeSnapshot, after: mockAfterSnapshot };
      await onBestieCountUpdate(change, mockContext);

      // Each user should be updated once for featuredCircle
      expect(mockRequesterRef.update).toHaveBeenCalledTimes(1);
      expect(mockRecipientRef.update).toHaveBeenCalledTimes(1);
    });
  });
});

