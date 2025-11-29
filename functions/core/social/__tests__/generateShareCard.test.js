/**
 * Tests for generateShareCard function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { generateShareCard } = require('../generateShareCard');
const { checkRateLimit, getClientIP } = require('../../../utils/rateLimiting');

jest.mock('../../../utils/rateLimiting');
// Use global mocks from jest.setup.js

describe('generateShareCard', () => {
  let mockReq;
  let mockRes;
  let mockUserDoc;

  beforeEach(() => {
    mockReq = {
      query: {},
      ip: '127.0.0.1',
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      })),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      })),
    }));

    getClientIP.mockReturnValue('127.0.0.1');
    checkRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 100,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    test('should check rate limit', async () => {
      await generateShareCard(mockReq, mockRes);

      expect(checkRateLimit).toHaveBeenCalled();
    });

    test('should return 429 if rate limit exceeded', async () => {
      checkRateLimit.mockResolvedValue({
        allowed: false,
        count: 100,
        limit: 100,
        resetAt: new Date(),
      });

      await generateShareCard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Share Card Generation', () => {
    test('should generate custom HTML with user data', async () => {
      mockReq.query.invite = 'user123';

      await generateShareCard(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const html = mockRes.send.mock.calls[0][0];
      expect(html).toContain('Test User');
      expect(html).toContain('user123');
    });

    test('should return default HTML if no invite parameter', async () => {
      await generateShareCard(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const html = mockRes.send.mock.calls[0][0];
      expect(html).toContain('Besties');
    });

    test('should return default HTML if user not found', async () => {
      mockReq.query.invite = 'user123';
      mockUserDoc.exists = false;

      await generateShareCard(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const html = mockRes.send.mock.calls[0][0];
      expect(html).toContain('Besties');
    });

    test('should return default HTML if invite ID is invalid', async () => {
      mockReq.query.invite = 'invalid@id!';

      await generateShareCard(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const html = mockRes.send.mock.calls[0][0];
      expect(html).toContain('Besties');
    });
  });

  describe('Error Handling', () => {
    test('should return default HTML on error', async () => {
      const db = admin.firestore();
      // Make the collection call throw an error
      db.collection = jest.fn(() => {
        throw new Error('Database error');
      });

      await generateShareCard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalled();
      const html = mockRes.send.mock.calls[0][0];
      expect(html).toContain('Besties');
    });
  });
});

