/**
 * Tests for declineBestieRequest function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { declineBestieRequest } = require('../declineBestieRequest');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

describe('declineBestieRequest', () => {
  let mockContext;
  let mockData;
  let mockBestieDoc;
  let mockBestieRef;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'recipient123' },
    };

    mockData = { bestieId: 'bestie123' };

    mockBestieDoc = {
      exists: true,
      data: jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'pending',
      })),
    };

    mockBestieRef = {
      get: jest.fn().mockResolvedValue(mockBestieDoc),
      update: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => mockBestieRef),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        declineBestieRequest(mockData, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });

  describe('Validation', () => {
    test('should throw if bestieId is missing', async () => {
      const invalidData = {};

      await expect(
        declineBestieRequest(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    test('should throw if bestieId is invalid', async () => {
      const invalidData = { bestieId: 'a'.repeat(101) };

      await expect(
        declineBestieRequest(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });
  });

  describe('Authorization', () => {
    test('should throw if bestie request does not exist', async () => {
      mockBestieDoc.exists = false;

      await expect(
        declineBestieRequest(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });

    test('should throw if user is not the recipient', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'other-user',
        status: 'pending',
      }));

      await expect(
        declineBestieRequest(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });
  });

  describe('Idempotency', () => {
    test('should return success if already declined', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'recipient123',
        status: 'declined',
      }));

      const result = await declineBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true, message: 'Bestie request already declined' });
      expect(mockBestieRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Successful Decline', () => {
    test('should update status to declined', async () => {
      await declineBestieRequest(mockData, mockContext);

      expect(mockBestieRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'declined',
          declinedAt: expect.anything(),
        })
      );
    });

    test('should return success', async () => {
      const result = await declineBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });
});

