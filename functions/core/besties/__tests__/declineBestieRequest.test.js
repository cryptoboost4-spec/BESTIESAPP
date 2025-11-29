/**
 * Tests for declineBestieRequest function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { declineBestieRequest } = require('../declineBestieRequest');

// Use global mocks from jest.setup.js

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
    db.collection = jest.fn((name) => {
      if (name === 'besties') {
        return {
          doc: jest.fn((id) => {
            if (id === 'bestie123') {
              return mockBestieRef;
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
              update: jest.fn().mockResolvedValue(),
            };
          }),
        };
      }
      // Default
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        declineBestieRequest(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if bestieId is missing', async () => {
      const invalidData = {};

      await expect(
        declineBestieRequest(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if bestieId is invalid', async () => {
      const invalidData = { bestieId: 'a'.repeat(101) };

      await expect(
        declineBestieRequest(invalidData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    test('should throw if bestie request does not exist', async () => {
      mockBestieDoc.exists = false;

      await expect(
        declineBestieRequest(mockData, mockContext)
      ).rejects.toThrow('Invalid request');
    });

    test('should throw if user is not the recipient', async () => {
      mockBestieDoc.data = jest.fn(() => ({
        requesterId: 'requester123',
        recipientId: 'other-user',
        status: 'pending',
      }));

      await expect(
        declineBestieRequest(mockData, mockContext)
      ).rejects.toThrow('Invalid request');
    });
  });

  describe('Idempotency', () => {
    test('should return success if already declined', async () => {
      // Create a fresh mock for this test
      const declinedBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'recipient123',
          status: 'declined',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(declinedBestieDoc);

      const result = await declineBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true, message: 'Bestie request already declined' });
      expect(mockBestieRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Successful Decline', () => {
    test('should update status to declined', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'recipient123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      await declineBestieRequest(mockData, mockContext);

      expect(mockBestieRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'declined',
          declinedAt: expect.anything(),
        })
      );
    });

    test('should return success', async () => {
      // Create a fresh mock for this test
      const pendingBestieDoc = {
        exists: true,
        data: jest.fn(() => ({
          requesterId: 'requester123',
          recipientId: 'recipient123',
          status: 'pending',
        })),
      };
      mockBestieRef.get = jest.fn().mockResolvedValue(pendingBestieDoc);

      const result = await declineBestieRequest(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });
});

