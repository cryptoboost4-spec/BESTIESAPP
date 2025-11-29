/**
 * Tests for generateMilestones scheduled function
 */
const admin = require('firebase-admin');
const { generateMilestones } = require('../generateMilestones');

// Use global mocks from jest.setup.js

describe('generateMilestones', () => {
  let mockInteractionsSnapshot;
  let mockMilestonesCollection;
  let mockCollectionFn;

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
    mockCollectionFn = jest.fn((collectionName) => {
      if (collectionName === 'besties') {
        const query = {
          where: jest.fn((field, op, value) => {
            // Return a query that supports .get()
            return {
              get: jest.fn().mockResolvedValue({
                size: 1,
                docs: [{
                  data: () => ({
                    requesterId: 'user123',
                    recipientId: 'bestie123',
                    status: 'accepted',
                    acceptedAt: { toMillis: () => Date.now() - 7 * 24 * 60 * 60 * 1000 },
                  }),
                }],
              }),
            };
          }),
        };
        return query;
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn((userId) => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ displayName: 'Test User' }),
            }),
          })),
        };
      }
      if (collectionName === 'checkins') {
        // Mock for shared check-ins queries
        return {
          where: jest.fn((field, op, value) => {
            return {
              where: jest.fn((field2, op2, value2) => {
                return {
                  where: jest.fn((field3, op3, value3) => {
                    return {
                      count: jest.fn(() => ({
                        get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
                      })),
                    };
                  }),
                };
              }),
            };
          }),
        };
      }
      if (collectionName === 'circle_milestones') {
        return mockMilestonesCollection;
      }
      // Default
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
        })),
      };
    });
    db.collection = mockCollectionFn;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Milestone Generation', () => {
    test('should generate milestones for bestie relationships', async () => {
      await generateMilestones({});

      expect(mockCollectionFn).toHaveBeenCalledWith('besties');
    });

    test('should create milestone documents', async () => {
      await generateMilestones({});

      expect(mockMilestonesCollection.add).toHaveBeenCalled();
    });
  });
});

