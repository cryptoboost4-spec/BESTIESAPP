/**
 * Tests for onDuressCodeUsed trigger
 */
const admin = require('firebase-admin');
const { onDuressCodeUsed } = require('../onDuressCodeUsed');

// Use global mocks from jest.setup.js

describe('onDuressCodeUsed', () => {
  let mockSnapshot;
  let mockContext;
  let mockUserDoc;
  let mockBestiesSnapshot;
  let mockSOSCollection;

  beforeEach(() => {
    mockContext = {
      params: { userId: 'user123' },
    };

    mockSnapshot = {
      data: jest.fn(() => ({
        userId: 'user123',
        _internal_duress: true, // Required flag for duress code detection
        location: 'Test Location',
        timestamp: admin.firestore.Timestamp.now(),
      })),
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
      })),
    };

    // Mock bestie documents for getUserBestieIds queries
    const mockBestieDoc1 = {
      data: () => ({ recipientId: 'bestie1', requesterId: 'user123', status: 'accepted', isFavorite: true }),
    };
    const mockBestieDoc2 = {
      data: () => ({ requesterId: 'bestie2', recipientId: 'user123', status: 'accepted', isFavorite: true }),
    };

    mockBestiesSnapshot = {
      forEach: jest.fn((callback) => {
        callback(mockBestieDoc1);
        callback(mockBestieDoc2);
      }),
      size: 2,
    };

    // Mock bestie user documents for db.getAll()
    const mockBestie1UserDoc = {
      id: 'bestie1',
      exists: true,
      data: () => ({
        displayName: 'Bestie 1',
        email: 'bestie1@example.com',
        phoneNumber: '+61411111111',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-1',
      }),
    };
    const mockBestie2UserDoc = {
      id: 'bestie2',
      exists: true,
      data: () => ({
        displayName: 'Bestie 2',
        email: 'bestie2@example.com',
        phoneNumber: '+61422222222',
        notificationsEnabled: true,
        fcmToken: 'fcm-token-2',
      }),
    };

    mockSOSCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'user123') {
              return {
                get: jest.fn().mockResolvedValue(mockUserDoc),
              };
            }
            if (id === 'bestie1') {
              return {
                get: jest.fn().mockResolvedValue(mockBestie1UserDoc),
              };
            }
            if (id === 'bestie2') {
              return {
                get: jest.fn().mockResolvedValue(mockBestie2UserDoc),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            };
          }),
        };
      }
      if (collectionName === 'besties') {
        return {
          where: jest.fn((field, op, value) => {
            return {
              where: jest.fn((field2, op2, value2) => {
                return {
                  where: jest.fn((field3, op3, value3) => {
                    return {
                      get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
                    };
                  }),
                  get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
                };
              }),
            };
          }),
        };
      }
      if (collectionName === 'notifications') {
        return {
          add: jest.fn().mockResolvedValue(),
        };
      }
      if (collectionName === 'emergency_sos') {
        return mockSOSCollection;
      }
      // Default
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
        })),
      };
    });

    // Mock db.getAll() for fetching bestie user documents
    db.getAll = jest.fn((...docRefs) => {
      return Promise.resolve([mockBestie1UserDoc, mockBestie2UserDoc]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Duress Code Detection', () => {
    test('should process duress code alert', async () => {
      await onDuressCodeUsed(mockSnapshot, mockContext);

      // Should find besties and notify them
      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('besties');
    });

    test('should notify besties about duress code', async () => {
      const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert } = require('../../../utils/notifications');
      jest.mock('../../../utils/notifications', () => ({
        sendSMSAlert: jest.fn().mockResolvedValue(),
        sendWhatsAppAlert: jest.fn().mockResolvedValue(),
        sendEmailAlert: jest.fn().mockResolvedValue(),
      }));

      await onDuressCodeUsed(mockSnapshot, mockContext);

      // Should find besties and notify them
      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('besties');
    });
  });
});

