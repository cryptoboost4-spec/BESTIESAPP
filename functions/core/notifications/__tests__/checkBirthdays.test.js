/**
 * Tests for checkBirthdays function
 */
// Set GCLOUD_PROJECT before requiring any Firebase modules
process.env.GCLOUD_PROJECT = 'test-project';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');
const { checkBirthdays } = require('../checkBirthdays');

jest.mock('@sendgrid/mail');
// Use global mocks from jest.setup.js

describe('checkBirthdays', () => {
  let mockUsersSnapshot;
  let mockBestiesSnapshot;
  let mockUserDocs;
  let bestiesSnapshot1;
  let bestiesSnapshot2;

  beforeEach(() => {
    const today = new Date();
    // Use today's month and day for the birthdate to ensure it matches
    // Format: YYYY-MM-DD (use a fixed year like 2000 to avoid timezone issues)
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const birthdateStr = `2000-${month}-${day}`;

    mockUserDocs = [
      {
        id: 'user1',
        data: () => ({
          displayName: 'Birthday User',
          profile: {
            birthdate: birthdateStr, // Today's month and day
          },
          email: 'birthday@example.com',
        }),
      },
      {
        id: 'user2',
        data: () => ({
          displayName: 'Not Birthday User',
          profile: {
            birthdate: '1990-01-01', // Not today
          },
        }),
      },
    ];

    mockUsersSnapshot = {
      docs: mockUserDocs,
      empty: false,
    };

    // Create bestie documents that will be returned by the queries
    // Query 1: requesterId === 'user1' -> returns docs with recipientId (the bestie)
    const bestieDoc1 = {
      data: () => ({ recipientId: 'bestie1', requesterId: 'user1', status: 'accepted' }),
    };
    // Query 2: recipientId === 'user1' -> returns docs with requesterId (the bestie)
    const bestieDoc2 = {
      data: () => ({ requesterId: 'bestie1', recipientId: 'user1', status: 'accepted' }),
    };
    
    // Separate snapshots for each query - recreate in beforeEach to ensure fresh state
    // forEach must iterate over docs array like Firestore does
    bestiesSnapshot1 = {
      forEach: function(callback) {
        [bestieDoc1].forEach(callback);
      },
      size: 1,
      docs: [bestieDoc1],
      empty: false,
    };
    
    bestiesSnapshot2 = {
      forEach: function(callback) {
        [bestieDoc2].forEach(callback);
      },
      size: 1,
      docs: [bestieDoc2],
      empty: false,
    };
    
    mockBestiesSnapshot = bestiesSnapshot1; // Default, but we'll use separate ones

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        const usersCollection = {
          get: jest.fn().mockResolvedValue(mockUsersSnapshot),
          doc: jest.fn((userId) => {
            if (userId === 'bestie1') {
              return {
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({
                    displayName: 'Bestie',
                    email: 'bestie@example.com',
                    fcmToken: 'fcm-token',
                    notificationsEnabled: true,
                    notificationPreferences: {
                      email: true,
                    },
                  }),
                }),
              };
            }
            return {
              get: jest.fn().mockResolvedValue({
                exists: false,
                data: () => ({}),
              }),
            };
          }),
          limit: jest.fn(() => ({
            startAfter: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                empty: true,
                size: 0,
                docs: [],
              }),
            })),
            get: jest.fn().mockResolvedValue(mockUsersSnapshot),
          })),
        };
        return usersCollection;
      }
      if (collectionName === 'besties') {
        return {
          where: jest.fn((field, op, value) => {
            // Query 1: requesterId === 'user1' -> returns docs with recipientId (the bestie)
            if (field === 'requesterId' && value === 'user1') {
              return {
                where: jest.fn((field2, op2, value2) => {
                  // Second where clause: status === 'accepted'
                  if (field2 === 'status' && op2 === '==' && value2 === 'accepted') {
                    return {
                      get: jest.fn().mockResolvedValue(bestiesSnapshot1),
                    };
                  }
                  return {
                    get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn(), docs: [], empty: true }),
                  };
                }),
                get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn(), docs: [], empty: true }),
              };
            }
            // Query 2: recipientId === 'user1' -> returns docs with requesterId (the bestie)
            if (field === 'recipientId' && value === 'user1') {
              return {
                where: jest.fn((field2, op2, value2) => {
                  // Second where clause: status === 'accepted'
                  if (field2 === 'status' && op2 === '==' && value2 === 'accepted') {
                    return {
                      get: jest.fn().mockResolvedValue(bestiesSnapshot2),
                    };
                  }
                  return {
                    get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn(), docs: [], empty: true }),
                  };
                }),
                get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn(), docs: [], empty: true }),
              };
            }
            return {
              where: jest.fn().mockReturnThis(),
              get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn(), docs: [], empty: true }),
            };
          }),
        };
      }
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
        })),
      };
    });

    sgMail.send = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Birthday Detection', () => {
    test('should find users with birthdays today', async () => {
      const result = await checkBirthdays({});

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('birthdayCount');
    });

    test('should skip users without birthdate', async () => {
      mockUserDocs[0].data = jest.fn(() => ({
        displayName: 'No Birthday User',
        // No profile.birthdate
      }));

      const result = await checkBirthdays({});

      expect(result.birthdayCount).toBe(0);
    });
  });

  describe('Notifications', () => {
    test('should send notifications to besties', async () => {
      const result = await checkBirthdays({});

      expect(result).toHaveProperty('notificationsSent');
      expect(result.notificationsSent).toBeGreaterThan(0);
    });

    test('should send push notifications if enabled', async () => {
      await checkBirthdays({});

      // Get the shared messaging instance
      const messagingInstance = admin.messaging();
      expect(messagingInstance.send).toHaveBeenCalled();
    });

    test('should send email notifications', async () => {
      await checkBirthdays({});

      expect(sgMail.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      const db = admin.firestore();
      db.collection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await checkBirthdays({});

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });
});

