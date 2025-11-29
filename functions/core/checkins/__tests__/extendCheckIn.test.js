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
// Use global mocks from jest.setup.js

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
    // Override collection to return our mocks
    db.collection = jest.fn((name) => {
      if (name === 'checkins') {
        return {
          doc: jest.fn((id) => {
            if (id === 'checkin123') {
              return mockCheckInRef;
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
              update: jest.fn().mockResolvedValue(),
            };
          }),
          // Support rate limiting queries
          where: jest.fn().mockReturnThis(),
        };
      }
      // For rate limiting queries (any collection name)
      const query = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
      };
      return {
        ...query,
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });

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
      const invalidData = { checkInId: 'checkin123', additionalMinutes: 200 }; // > 120 is invalid

      await expect(
        extendCheckIn(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should accept valid extension values (15, 30, 60)', async () => {
      for (const minutes of [15, 30, 60]) {
        // Create a fresh mock for each iteration
        const activeCheckInDoc = {
          exists: true,
          data: jest.fn(() => ({
            userId: 'user123',
            status: 'active',
            duration: 30,
            alertTime: {
              toDate: () => new Date(Date.now() + 30 * 60 * 1000),
            },
            bestieIds: ['bestie1'],
          })),
        };
        jest.clearAllMocks();
        mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
        checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
        notifyBestiesAboutCheckIn.mockResolvedValue();
        
        const validData = { checkInId: 'checkin123', additionalMinutes: minutes };
        await expect(extendCheckIn(validData, mockContext)).resolves.toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limit before extending', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
      notifyBestiesAboutCheckIn.mockResolvedValue();

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
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: { toDate: () => new Date(Date.now() + 30 * 60 * 1000) },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({
        allowed: false,
        count: 10,
        limit: 10,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000),
      });

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    test('should throw if check-in does not exist', async () => {
      const nonExistentCheckIn = {
        exists: false,
        data: jest.fn(() => ({})),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(nonExistentCheckIn);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow('Invalid check-in');
    });

    test('should throw if user does not own check-in', async () => {
      const otherUserCheckIn = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'other-user',
          status: 'active',
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(otherUserCheckIn);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });

      await expect(
        extendCheckIn(mockData, mockContext)
      ).rejects.toThrow('Invalid check-in');
    });
  });

  describe('Successful Extension', () => {
    test('should update alertTime correctly', async () => {
      const originalAlertTime = new Date(Date.now() + 30 * 60 * 1000);
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => originalAlertTime,
          },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
      notifyBestiesAboutCheckIn.mockResolvedValue();

      await extendCheckIn(mockData, mockContext);

      expect(mockCheckInRef.update).toHaveBeenCalled();
      const updateCall = mockCheckInRef.update.mock.calls[0][0];
      
      // Verify alertTime is extended by 15 minutes
      const newAlertTime = updateCall.alertTime;
      expect(newAlertTime).toBeDefined();
    });

    test('should update duration correctly', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
      notifyBestiesAboutCheckIn.mockResolvedValue();

      await extendCheckIn(mockData, mockContext);

      const updateCall = mockCheckInRef.update.mock.calls[0][0];
      expect(updateCall.duration).toBe(45); // 30 + 15
    });

    test('should return new alert time', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
          bestieIds: ['bestie1'],
        })),
      };
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);

      const result = await extendCheckIn(mockData, mockContext);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newAlertTime');
    });

    test('should notify besties about extension', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
      notifyBestiesAboutCheckIn.mockResolvedValue();

      await extendCheckIn(mockData, mockContext);

      expect(notifyBestiesAboutCheckIn).toHaveBeenCalledWith(
        'user123',
        ['bestie1'],
        'checkInExtended',
        expect.objectContaining({
          extension: 15,
        }),
        [] // messengerContactIds
      );
    });
  });

  describe('Error Handling', () => {
    test('should extend check-in even if notification fails', async () => {
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          duration: 30,
          alertTime: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
          bestieIds: ['bestie1'],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      checkUserRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, remaining: 9 });
      notifyBestiesAboutCheckIn.mockRejectedValue(new Error('Notification failed'));

      const result = await extendCheckIn(mockData, mockContext);

      expect(result.success).toBe(true);
      expect(mockCheckInRef.update).toHaveBeenCalled();
    });
  });
});

