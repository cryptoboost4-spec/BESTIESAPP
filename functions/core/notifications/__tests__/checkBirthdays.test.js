/**
 * Tests for checkBirthdays function
 */
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const { checkBirthdays } = require('../checkBirthdays');

jest.mock('@sendgrid/mail');
// Use global mocks from jest.setup.js

describe('checkBirthdays', () => {
  let mockUsersSnapshot;
  let mockBestiesSnapshot;
  let mockUserDocs;

  beforeEach(() => {
    const today = new Date();
    const birthdate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    mockUserDocs = [
      {
        id: 'user1',
        data: () => ({
          displayName: 'Birthday User',
          profile: {
            birthdate: birthdate.toISOString().split('T')[0], // Today's date
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
    };

    mockBestiesSnapshot = {
      forEach: jest.fn((callback) => {
        callback({
          data: () => ({ recipientId: 'bestie1' }),
        });
      }),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'users') {
        return {
          get: jest.fn().mockResolvedValue(mockUsersSnapshot),
          doc: jest.fn((userId) => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                displayName: 'Bestie',
                email: 'bestie@example.com',
                fcmToken: 'fcm-token',
                notificationsEnabled: true,
              }),
            }),
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
      const messaging = admin.messaging();
      await checkBirthdays({});

      expect(messaging.send).toHaveBeenCalled();
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

