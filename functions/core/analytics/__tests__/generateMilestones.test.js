/**
 * Tests for generateMilestones scheduled function
 */
const admin = require('firebase-admin');
const generateMilestones = require('../generateMilestones');

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      add: jest.fn(),
      get: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

describe('generateMilestones', () => {
  let mockInteractionsSnapshot;
  let mockMilestonesCollection;

  beforeEach(() => {
    mockInteractionsSnapshot = {
      docs: [
        {
          data: () => ({
            userId: 'user123',
            bestieId: 'bestie123',
            type: 'alert_response',
            createdAt: { toDate: () => new Date() },
          }),
        },
      ],
    };

    mockMilestonesCollection = {
      add: jest.fn().mockResolvedValue(),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'interactions') {
        return {
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockInteractionsSnapshot),
            })),
          })),
        };
      }
      if (collectionName === 'circle_milestones') {
        return mockMilestonesCollection;
      }
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false }),
        })),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Milestone Generation', () => {
    test('should generate milestones for bestie relationships', async () => {
      await generateMilestones({});

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith('interactions');
    });

    test('should create milestone documents', async () => {
      await generateMilestones({});

      expect(mockMilestonesCollection.add).toHaveBeenCalled();
    });
  });
});

