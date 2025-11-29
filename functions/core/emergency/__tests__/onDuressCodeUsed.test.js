/**
 * Tests for onDuressCodeUsed trigger
 */
const admin = require('firebase-admin');
const { onDuressCodeUsed } = require('../onDuressCodeUsed');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      add: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
        get: jest.fn(),
      })),
      get: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
  messaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

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
        isReversePIN: true,
        timestamp: Date.now(),
      })),
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
      })),
    };

    mockBestiesSnapshot = {
      forEach: jest.fn((callback) => {
        callback({ data: () => ({ recipientId: 'bestie1' }) });
      }),
    };

    mockSOSCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockUserDoc),
          })),
        };
      }
      if (collectionName === 'besties') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
              })),
            })),
            get: jest.fn().mockResolvedValue(mockBestiesSnapshot),
          })),
        };
      }
      if (collectionName === 'emergency_sos') {
        return mockSOSCollection;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Duress Code Detection', () => {
    test('should create emergency SOS when duress code used', async () => {
      await onDuressCodeUsed(mockSnapshot, mockContext);

      expect(mockSOSCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          isReversePIN: true,
        })
      );
    });

    test('should notify besties about duress code', async () => {
      await onDuressCodeUsed(mockSnapshot, mockContext);

      // Should find besties and notify them
      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('besties');
    });
  });
});

