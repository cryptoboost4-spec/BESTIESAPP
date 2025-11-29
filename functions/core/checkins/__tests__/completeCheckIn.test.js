/**
 * Tests for completeCheckIn function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { completeCheckIn } = require('../completeCheckIn');
const { notifyBestiesAboutCheckIn } = require('../../../utils/checkInNotifications');

// Mock dependencies
jest.mock('../../../utils/checkInNotifications');

describe('completeCheckIn', () => {
  let mockContext;
  let mockCheckInRef;
  let mockCheckInDoc;
  let mockData;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    mockCheckInDoc = {
      exists: true,
      data: jest.fn(() => ({
        userId: 'user123',
        status: 'active',
        bestieIds: ['bestie1', 'bestie2'],
        location: 'Test Location',
        duration: 30,
      })),
    };

    mockCheckInRef = {
      get: jest.fn().mockResolvedValue(mockCheckInDoc),
      update: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    // Override collection to return our mock
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
        };
      }
      // Default for other collections
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });

    mockData = { checkInId: 'checkin123' };
    notifyBestiesAboutCheckIn.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        completeCheckIn(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if checkInId is missing', async () => {
      const invalidData = {};

      await expect(
        completeCheckIn(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if checkInId is invalid', async () => {
      const invalidData = { checkInId: '' };

      await expect(
        completeCheckIn(invalidData, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    test('should throw if check-in does not exist', async () => {
      mockCheckInDoc.exists = false;

      await expect(
        completeCheckIn(mockData, mockContext)
      ).rejects.toThrow('Invalid check-in');
    });

    test('should throw if user does not own check-in', async () => {
      mockCheckInDoc.data = jest.fn(() => ({
        userId: 'other-user',
        status: 'active',
      }));

      await expect(
        completeCheckIn(mockData, mockContext)
      ).rejects.toThrow('Invalid check-in');
    });
  });

  describe('Idempotency', () => {
    test('should return success if check-in already completed', async () => {
      // Create a fresh mock for this test
      const completedCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'completed',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      // Reset and set up fresh mock
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(completedCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      const result = await completeCheckIn(mockData, mockContext);

      expect(result).toEqual({ success: true, message: 'Check-in already completed' });
      expect(mockCheckInRef.update).not.toHaveBeenCalled();
    });
  });

  describe('Successful Completion', () => {
    test('should update check-in status to completed', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      // Reset and set up fresh mock
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      await completeCheckIn(mockData, mockContext);

      expect(mockCheckInRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.anything(),
        })
      );
    });

    test('should notify besties about completion', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      await completeCheckIn(mockData, mockContext);

      expect(notifyBestiesAboutCheckIn).toHaveBeenCalledWith(
        'user123',
        ['bestie1', 'bestie2'],
        'checkInCompleted',
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    test('should return success on completion', async () => {
      // Create a fresh mock for this test
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      const result = await completeCheckIn(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Notification Error Handling', () => {
    test('should complete check-in even if notification fails', async () => {
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockRejectedValue(new Error('Notification failed'));

      const result = await completeCheckIn(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockCheckInRef.update).toHaveBeenCalled();
    });

    test('should not throw if bestieIds is empty', async () => {
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: [],
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      const result = await completeCheckIn(mockData, mockContext);

      expect(result).toEqual({ success: true });
      expect(notifyBestiesAboutCheckIn).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('should NOT update user stats directly', async () => {
      const activeCheckInDoc = {
        exists: true,
        data: jest.fn(() => ({
          userId: 'user123',
          status: 'active',
          bestieIds: ['bestie1', 'bestie2'],
          location: 'Test Location',
          duration: 30,
        })),
      };
      jest.clearAllMocks();
      mockCheckInRef.get = jest.fn().mockResolvedValue(activeCheckInDoc);
      notifyBestiesAboutCheckIn.mockResolvedValue();

      // This test ensures we're not double-counting
      // Stats should only be updated by onCheckInCountUpdate trigger
      await completeCheckIn(mockData, mockContext);

      // Verify we're only updating the check-in document
      expect(mockCheckInRef.update).toHaveBeenCalledTimes(1);
      const updateCall = mockCheckInRef.update.mock.calls[0][0];
      
      // Should not contain stats updates
      expect(updateCall).not.toHaveProperty('stats');
      expect(updateCall).not.toHaveProperty('completedCheckIns');
    });
  });
});

