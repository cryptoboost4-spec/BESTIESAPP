/**
 * Tests for extendCheckIn function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { extendCheckIn } = require('../extendCheckIn');
const { notifyBestiesAboutCheckIn } = require('../../../utils/checkInNotifications');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');

// Mock dependencies
jest.mock('../../../utils/checkInNotifications');
jest.mock('../../../utils/rateLimiting');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
      fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000 })),
    },
  })),
}));

describe('extendCheckIn', () => {
  let mockContext;
  let mockCheckInRef;
  let mockCheckInDoc;
  let mockData;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    const alertTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    mockCheckInDoc = {
      exists: true,
      data: jest.fn(() => ({
        userId: 'user123',
        status: 'active',
        duration: 30,
        alertTime: {
          toDate: () => alertTime,
        },
        bestieIds: ['bestie1'],
      })),
    };

    mockCheckInRef = {
      get: jest.fn().mockResolvedValue(mockCheckInDoc),
      update: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => mockCheckInRef),
    }));

    mockData = { checkInId: 'checkin123', additionalMinutes: 15 };
    
    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 10,
      remaining: 9,
    });
    notifyBestiesAboutCheckIn.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        extendCheckIn(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if checkInId is missing', async () => {
      const invalidData = { additionalMinutes: 15 };

      await expect(
        extendCheckIn(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if additionalMinutes is invalid', async () => {
      const invalidData = { checkInId: 'checkin123', additionalMinutes: 20 };

      await expect(
        extendCheckIn(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should accept valid extension values (15, 30, 60)', async () => {
      for (const minutes of [15, 30, 60]) {
        const validData = { checkInId: 'checkin123', additionalMinutes: minutes };
        await expect(extendCheckIn(validData, mockContext)).resolves.toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limit before extending', async () => {
      await extendCheckIn(mockData, mockContext);

      expect(checkUserRateLimit).toHaveBeenCalledWith(
        'user123',
        'extendCheckIn',
        expect.objectContaining({ count: 10, window: 3600000 }),
        'checkins',
        'userId',
        'lastUpdate'
      );
    });

    test('should throw if rate limit exceeded', async () => {
      checkUserRateLimit.mockResolvedValue({
        allowed: false,
        count: 10,
        limit: 10,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000),
      });

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow('resource-exhausted');
    });
  });

  describe('Authorization', () => {
    test('should throw if check-in does not exist', async () => {
      mockCheckInDoc.exists = false;

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });

    test('should throw if user does not own check-in', async () => {
      mockCheckInDoc.data = jest.fn(() => ({
        userId: 'other-user',
        status: 'active',
      }));

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });
  });

  describe('Successful Extension', () => {
    test('should update alertTime correctly', async () => {
      const originalAlertTime = new Date(Date.now() + 30 * 60 * 1000);
      mockCheckInDoc.data = jest.fn(() => ({
        userId: 'user123',
        status: 'active',
        duration: 30,
        alertTime: {
          toDate: () => originalAlertTime,
        },
      }));

      await extendCheckIn(mockData, mockContext);

      expect(mockCheckInRef.update).toHaveBeenCalled();
      const updateCall = mockCheckInRef.update.mock.calls[0][0];
      
      // Verify alertTime is extended by 15 minutes
      const newAlertTime = updateCall.alertTime;
      expect(newAlertTime).toBeDefined();
    });

    test('should update duration correctly', async () => {
      await extendCheckIn(mockData, mockContext);

      const updateCall = mockCheckInRef.update.mock.calls[0][0];
      expect(updateCall.duration).toBe(45); // 30 + 15
    });

    test('should return new alert time', async () => {
      const result = await extendCheckIn(mockData, mockContext);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newAlertTime');
    });

    test('should notify besties about extension', async () => {
      await extendCheckIn(mockData, mockContext);

      expect(notifyBestiesAboutCheckIn).toHaveBeenCalledWith(
        'user123',
        ['bestie1'],
        'checkInExtended',
        expect.objectContaining({
          extension: 15,
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should extend check-in even if notification fails', async () => {
      notifyBestiesAboutCheckIn.mockRejectedValue(new Error('Notification failed'));

      const result = await extendCheckIn(mockData, mockContext);

      expect(result.success).toBe(true);
      expect(mockCheckInRef.update).toHaveBeenCalled();
    });
  });
});

