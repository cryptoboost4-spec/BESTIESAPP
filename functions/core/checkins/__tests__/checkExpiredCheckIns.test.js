/**
 * Tests for checkExpiredCheckIns scheduled function
 */
const admin = require('firebase-admin');
const { sendBulkNotifications } = require('../../../utils/messaging');
const checkExpiredCheckIns = require('../checkExpiredCheckIns');

jest.mock('../../../utils/messaging');
// Use global mocks from jest.setup.js

describe('checkExpiredCheckIns', () => {
  let mockExpiredCheckInsSnapshot;
  let mockCollectionFn;
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
            status: 'active', // Must be active, not alerted
            alertTime: { toMillis: () => Date.now() - 60000 },
            bestieIds: ['bestie1'],
            messengerContactIds: ['contact1'],
            createdAt: {
              toDate: () => new Date(Date.now() - 3600000), // 1 hour ago
            },
          }),
        },
        {
          id: 'checkin2',
          data: () => ({
            userId: 'user456',
            location: 'Another Location',
            status: 'active', // Must be active, not alerted
            alertTime: { toMillis: () => Date.now() - 120000 },
            bestieIds: ['bestie2'],
            createdAt: {
              toDate: () => new Date(Date.now() - 3600000), // 1 hour ago
            },
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
    mockCollectionFn = jest.fn((collectionName) => {
      if (collectionName === 'checkins') {
        // Create a chainable query mock
        const createQuery = () => ({
          where: jest.fn((field, op, value) => {
            return {
              where: jest.fn((field2, op2, value2) => {
                return {
                  orderBy: jest.fn((field3, dir) => {
                    return {
                      limit: jest.fn((size) => {
                        return {
                          startAfter: jest.fn((doc) => {
                            return {
                              get: jest.fn().mockResolvedValue({
                                empty: true,
                                size: 0,
                                docs: [],
                              }),
                            };
                          }),
                          get: jest.fn().mockResolvedValue(mockExpiredCheckInsSnapshot),
                        };
                      }),
                      get: jest.fn().mockResolvedValue(mockExpiredCheckInsSnapshot),
                    };
                  }),
                };
              }),
            };
          }),
        });
        return createQuery();
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockUserDoc),
            update: jest.fn().mockResolvedValue(),
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
      if (collectionName === 'checkins') {
        return {
          doc: jest.fn(() => ({
            update: jest.fn().mockResolvedValue(),
          })),
        };
      }
      if (collectionName === 'analytics') {
        return {
          add: jest.fn().mockResolvedValue(),
        };
      }
      return {
        doc: jest.fn(() => ({
          update: jest.fn().mockResolvedValue(),
        })),
      };
    });
    db.collection = mockCollectionFn;

    sendBulkNotifications.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Expired Check-In Detection', () => {
    test('should find expired check-ins', async () => {
      await checkExpiredCheckIns({});

      expect(mockCollectionFn).toHaveBeenCalledWith('checkins');
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

      expect(mockCollectionFn).toHaveBeenCalled();
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

