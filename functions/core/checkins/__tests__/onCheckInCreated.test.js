/**
 * Tests for onCheckInCreated trigger
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onCheckInCreated } = require('../onCheckInCreated');
const { notifyBestiesAboutCheckIn } = require('../../../utils/checkInNotifications');

jest.mock('../../../utils/checkInNotifications');
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

describe('onCheckInCreated', () => {
  let mockSnapshot;
  let mockContext;
  let mockUserDoc;
  let mockUserRef;
  let mockCacheRef;

  beforeEach(() => {
    mockContext = {
      params: { checkInId: 'checkin123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'user123',
        bestieIds: ['bestie1', 'bestie2'],
        location: 'Test Location',
        duration: 30,
        status: 'active',
      })),
      ref: {
        update: jest.fn().mockResolvedValue(),
      },
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        bestieUserIds: ['bestie1', 'bestie2', 'bestie3'],
      })),
    };

    mockUserRef = {
      get: jest.fn().mockResolvedValue(mockUserDoc),
      update: jest.fn().mockResolvedValue(),
    };

    mockCacheRef = {
      set: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => mockUserRef),
        };
      }
      if (collectionName === 'analytics_cache') {
        return {
          doc: jest.fn(() => mockCacheRef),
        };
      }
    });

    notifyBestiesAboutCheckIn.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Denormalization', () => {
    test('should denormalize bestieUserIds into check-in document', async () => {
      await onCheckInCreated(mockSnapshot, mockContext);

      expect(mockSnapshot.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bestieUserIds: ['bestie1', 'bestie2', 'bestie3'],
        })
      );
    });

    test('should handle missing bestieIds', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'user123',
        bestieIds: [],
        status: 'active',
      }));

      await onCheckInCreated(mockSnapshot, mockContext);

      // Should not update if no bestieIds
      expect(mockSnapshot.ref.update).not.toHaveBeenCalled();
    });

    test('should handle missing user document', async () => {
      mockUserDoc.exists = false;

      await onCheckInCreated(mockSnapshot, mockContext);

      // Should not fail, just skip denormalization
      expect(mockSnapshot.ref.update).not.toHaveBeenCalled();
    });
  });

  describe('Stats Update', () => {
    test('should increment totalCheckIns in user stats', async () => {
      await onCheckInCreated(mockSnapshot, mockContext);

      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'stats.totalCheckIns': expect.anything(),
        })
      );
    });

    test('should update analytics cache', async () => {
      await onCheckInCreated(mockSnapshot, mockContext);

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('analytics_cache');
      expect(mockCacheRef.set).toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    test('should notify besties about new check-in', async () => {
      await onCheckInCreated(mockSnapshot, mockContext);

      expect(notifyBestiesAboutCheckIn).toHaveBeenCalledWith(
        'user123',
        ['bestie1', 'bestie2'],
        'checkInCreated',
        expect.any(Object)
      );
    });

    test('should not fail if notifications fail', async () => {
      notifyBestiesAboutCheckIn.mockRejectedValue(new Error('Notification failed'));

      // Should not throw
      await expect(onCheckInCreated(mockSnapshot, mockContext)).resolves.not.toThrow();
    });

    test('should skip notifications if no bestieIds', async () => {
      mockSnapshot.data = jest.fn(() => ({
        userId: 'user123',
        bestieIds: [],
        status: 'active',
      }));

      await onCheckInCreated(mockSnapshot, mockContext);

      expect(notifyBestiesAboutCheckIn).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should not throw on errors', async () => {
      mockUserRef.get.mockRejectedValue(new Error('Database error'));

      // Should not throw - allows check-in to be created
      await expect(onCheckInCreated(mockSnapshot, mockContext)).resolves.not.toThrow();
    });
  });
});

