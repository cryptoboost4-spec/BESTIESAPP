/**
 * Tests for sendBestieInvite function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { sendBestieInvite } = require('../sendBestieInvite');
const { sendSMSAlert } = require('../../../utils/notifications');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');

// Mock dependencies
jest.mock('../../../utils/notifications');
jest.mock('../../../utils/rateLimiting');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
    })),
  })),
}));

describe('sendBestieInvite', () => {
  let mockContext;
  let mockUserDoc;
  let mockData;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
      })),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      })),
    }));

    mockData = {
      recipientPhone: '+61412345678',
      message: 'Custom invite message',
    };

    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 20,
      remaining: 19,
    });
    sendSMSAlert.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        sendBestieInvite(mockData, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if recipientPhone is missing', async () => {
      const invalidData = { message: 'Test' };

      await expect(
        sendBestieInvite(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if recipientPhone is invalid', async () => {
      const invalidData = { recipientPhone: 'invalid' };

      await expect(
        sendBestieInvite(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should throw if message is too long', async () => {
      const invalidData = {
        recipientPhone: '+61412345678',
        message: 'a'.repeat(501),
      };

      await expect(
        sendBestieInvite(invalidData, mockContext)
      ).rejects.toThrow();
    });

    test('should accept valid phone numbers', async () => {
      const validData = { recipientPhone: '+61412345678' };
      
      await expect(
        sendBestieInvite(validData, mockContext)
      ).resolves.toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limit before sending', async () => {
      await sendBestieInvite(mockData, mockContext);

      expect(checkUserRateLimit).toHaveBeenCalledWith(
        'user123',
        'sendBestieInvite',
        expect.objectContaining({ count: 20, window: 86400000 }),
        'besties',
        'requesterId',
        'createdAt'
      );
    });

    test('should throw if rate limit exceeded', async () => {
      checkUserRateLimit.mockResolvedValue({
        allowed: false,
        count: 20,
        limit: 20,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });

      await expect(
        sendBestieInvite(mockData, mockContext)
      ).rejects.toThrow('resource-exhausted');
    });
  });

  describe('Message Handling', () => {
    test('should use custom message if provided', async () => {
      await sendBestieInvite(mockData, mockContext);

      expect(sendSMSAlert).toHaveBeenCalledWith(
        '+61412345678',
        'Custom invite message'
      );
    });

    test('should use default message if not provided', async () => {
      const dataWithoutMessage = { recipientPhone: '+61412345678' };
      
      await sendBestieInvite(dataWithoutMessage, mockContext);

      expect(sendSMSAlert).toHaveBeenCalledWith(
        '+61412345678',
        expect.stringContaining('Test User')
      );
    });

    test('should include invite link in default message', async () => {
      const dataWithoutMessage = { recipientPhone: '+61412345678' };
      
      await sendBestieInvite(dataWithoutMessage, mockContext);

      expect(sendSMSAlert).toHaveBeenCalledWith(
        '+61412345678',
        expect.stringContaining('user123')
      );
    });
  });

  describe('Successful Invite', () => {
    test('should send SMS alert', async () => {
      await sendBestieInvite(mockData, mockContext);

      expect(sendSMSAlert).toHaveBeenCalled();
    });

    test('should return success', async () => {
      const result = await sendBestieInvite(mockData, mockContext);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    test('should throw if SMS sending fails', async () => {
      sendSMSAlert.mockRejectedValue(new Error('SMS failed'));

      await expect(
        sendBestieInvite(mockData, mockContext)
      ).rejects.toThrow();
    });

    test('should handle missing user document', async () => {
      mockUserDoc.exists = false;

      await expect(
        sendBestieInvite(mockData, mockContext)
      ).rejects.toThrow();
    });
  });
});

