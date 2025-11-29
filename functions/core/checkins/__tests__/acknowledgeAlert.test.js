/**
 * Tests for acknowledgeAlert function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { acknowledgeAlert } = require('../acknowledgeAlert');

// Use global mocks from jest.setup.js

describe('acknowledgeAlert', () => {
  let mockContext;
  let mockData;
  let mockCheckInDoc;
  let mockCheckInRef;
  let mockAlertResponsesCollection;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'bestie123' },
    };

    mockData = { checkInId: 'checkin123' };

    const alertedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    mockCheckInDoc = {
      exists: true,
      data: jest.fn(() => ({
        userId: 'user123',
        bestieIds: ['bestie123', 'bestie456'],
        acknowledgedBy: [],
        alertedAt: {
          toMillis: () => alertedAt.getTime(),
        },
      })),
    };

    mockCheckInRef = {
      get: jest.fn().mockResolvedValue(mockCheckInDoc),
      update: jest.fn().mockResolvedValue(),
    };

    mockAlertResponsesCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'checkins') {
        return {
          doc: jest.fn(() => mockCheckInRef),
        };
      }
      if (collectionName === 'alert_responses') {
        return mockAlertResponsesCollection;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        acknowledgeAlert(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if checkInId is missing', async () => {
      const invalidData = {};

      await expect(
        acknowledgeAlert(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if checkInId is invalid', async () => {
      const invalidData = { checkInId: '' };

      await expect(
        acknowledgeAlert(invalidData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    test('should throw if check-in does not exist', async () => {
      // Create a new mock with exists = false
      const nonExistentCheckIn = {
        exists: false,
        data: jest.fn(() => ({})),
      };
      mockCheckInRef.get = jest.fn().mockResolvedValue(nonExistentCheckIn);

      await expect(
        acknowledgeAlert(mockData, mockContext)
      ).rejects.toThrow('Check-in not found');
    });

    test('should throw if user is not a bestie for this check-in', async () => {
      mockCheckInDoc.exists = true;
      mockCheckInDoc.data = jest.fn(() => ({
        userId: 'user123',
        bestieIds: ['other-bestie'], // bestie123 is not in this array
        acknowledgedBy: [],
      }));

      await expect(
        acknowledgeAlert(mockData, mockContext)
      ).rejects.toThrow('You are not authorized to acknowledge this alert');
    });
  });

  describe('Acknowledgment', () => {
    test('should add user to acknowledgedBy array', async () => {
      // Ensure check-in exists and user is authorized (bestie123 is in bestieIds)
      const authorizedCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          bestieIds: ['bestie123', 'bestie456'], // bestie123 is authorized
          acknowledgedBy: [],
          alertedAt: {
            toMillis: () => Date.now() - 5 * 60 * 1000,
          },
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(authorizedCheckIn);

      await acknowledgeAlert(mockData, mockContext);

      expect(mockCheckInRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          acknowledgedBy: expect.anything(),
        })
      );
    });

    test('should not duplicate if already acknowledged', async () => {
      const alreadyAcknowledgedCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          bestieIds: ['bestie123'],
          acknowledgedBy: ['bestie123'],
          alertedAt: {
            toMillis: () => Date.now() - 5 * 60 * 1000,
          },
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(alreadyAcknowledgedCheckIn);

      await acknowledgeAlert(mockData, mockContext);

      // Should not update if already acknowledged
      expect(mockCheckInRef.update).not.toHaveBeenCalled();
    });

    test('should track alert response', async () => {
      const authorizedCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          bestieIds: ['bestie123', 'bestie456'],
          acknowledgedBy: [],
          alertedAt: {
            toMillis: () => Date.now() - 5 * 60 * 1000,
          },
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(authorizedCheckIn);

      await acknowledgeAlert(mockData, mockContext);

      expect(mockAlertResponsesCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          responderId: 'bestie123',
          checkInId: 'checkin123',
          responseTime: expect.any(Number),
        })
      );
    });

    test('should calculate response time correctly', async () => {
      const alertedAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const authorizedCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          bestieIds: ['bestie123'],
          acknowledgedBy: [],
          alertedAt: {
            toMillis: () => alertedAt.getTime(),
          },
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(authorizedCheckIn);

      await acknowledgeAlert(mockData, mockContext);

      const addCall = mockAlertResponsesCollection.add.mock.calls[0][0];
      const expectedResponseTime = Date.now() - alertedAt.getTime();
      
      // Allow 1 second tolerance
      expect(Math.abs(addCall.responseTime - expectedResponseTime)).toBeLessThan(1000);
    });
  });

  describe('Response', () => {
    test('should return success', async () => {
      const authorizedCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          bestieIds: ['bestie123', 'bestie456'],
          acknowledgedBy: [],
          alertedAt: {
            toMillis: () => Date.now() - 5 * 60 * 1000,
          },
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(authorizedCheckIn);

      const result = await acknowledgeAlert(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });
});

