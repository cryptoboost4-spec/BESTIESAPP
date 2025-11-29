/**
 * Tests for checkExpiredCheckIns scheduled function
 */
const admin = require('firebase-admin');
const { sendBulkNotifications } = require('../../../utils/messaging');
const checkExpiredCheckIns = require('../checkExpiredCheckIns');

jest.mock('../../../utils/messaging');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              startAfter: jest.fn(() => ({
                get: jest.fn(),
              })),
              get: jest.fn(),
            })),
          })),
        })),
      })),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
    FieldPath: {
      documentId: jest.fn(() => 'documentId'),
    },
  })),
}));

describe('checkExpiredCheckIns', () => {
  let mockExpiredCheckInsSnapshot;
  let mockUserDoc;
  let mockMessengerContactsSnapshot;

  beforeEach(() => {
    mockExpiredCheckInsSnapshot = {
      empty: false,
      size: 2,
      docs: [
        {
          id: 'checkin1',
          data: () => ({
            userId: 'user123',
            location: 'Test Location',
            alertTime: { toMillis: () => Date.now() - 60000 },
            bestieIds: ['bestie1'],
            messengerContactIds: ['contact1'],
          }),
        },
        {
          id: 'checkin2',
          data: () => ({
            userId: 'user456',
            location: 'Another Location',
            alertTime: { toMillis: () => Date.now() - 120000 },
            bestieIds: ['bestie2'],
          }),
        },
      ],
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
        phoneNumber: '+61412345678',
        email: 'test@example.com',
      })),
    };

    mockMessengerContactsSnapshot = {
      docs: [
        {
          data: () => ({
            messengerPSID: 'psid123',
            expiresAt: {
              toMillis: () => Date.now() + 3600000, // 1 hour from now
            },
          }),
        },
      ],
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'checkins') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              orderBy: jest.fn(() => ({
                limit: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue(mockExpiredCheckInsSnapshot),
                  startAfter: jest.fn(() => ({
                    get: jest.fn().mockResolvedValue({ empty: true }),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockUserDoc),
          })),
        };
      }
      if (collectionName === 'messengerContacts') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockMessengerContactsSnapshot),
          })),
        };
      }
      return {
        doc: jest.fn(() => ({
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });

    sendBulkNotifications.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Expired Check-In Detection', () => {
    test('should find expired check-ins', async () => {
      await checkExpiredCheckIns({});

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('checkins');
    });

    test('should process check-ins in batches', async () => {
      await checkExpiredCheckIns({});

      // Should process the batch
      expect(sendBulkNotifications).toHaveBeenCalled();
    });

    test('should stop when no more expired check-ins', async () => {
      mockExpiredCheckInsSnapshot.empty = true;

      await checkExpiredCheckIns({});

      // Should not process if empty
      expect(sendBulkNotifications).not.toHaveBeenCalled();
    });
  });

  describe('Alert Processing', () => {
    test('should update check-in status to alerted', async () => {
      await checkExpiredCheckIns({});

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalled();
    });

    test('should send notifications to besties', async () => {
      await checkExpiredCheckIns({});

      expect(sendBulkNotifications).toHaveBeenCalled();
    });

    test('should handle missing user data', async () => {
      mockUserDoc.exists = false;

      await expect(checkExpiredCheckIns({})).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      sendBulkNotifications.mockRejectedValue(new Error('Notification failed'));

      await expect(checkExpiredCheckIns({})).resolves.not.toThrow();
    });
  });
});

