/**
 * Tests for createPortalSession function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const stripe = require('stripe');
const { createPortalSession } = require('../createPortalSession');

jest.mock('stripe', () => {
  return jest.fn(() => ({
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
}));

describe('createPortalSession', () => {
  let mockContext;
  let mockUserDoc;
  let mockStripe;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        stripeCustomerId: 'cus_test123',
      })),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      })),
    }));

    mockStripe = stripe();
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/test',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        createPortalSession({}, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });

  describe('Customer Validation', () => {
    test('should throw if no Stripe customer ID', async () => {
      mockUserDoc.data = jest.fn(() => ({
        stripeCustomerId: null,
      }));

      await expect(
        createPortalSession({}, mockContext)
      ).rejects.toThrow('failed-precondition');
    });

    test('should throw if user document missing', async () => {
      mockUserDoc.exists = false;

      await expect(
        createPortalSession({}, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Portal Session Creation', () => {
    test('should create Stripe portal session', async () => {
      await createPortalSession({}, mockContext);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          return_url: expect.stringContaining('/settings'),
        })
      );
    });

    test('should return portal URL', async () => {
      const result = await createPortalSession({}, mockContext);

      expect(result).toEqual({
        success: true,
        url: 'https://billing.stripe.com/test',
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle Stripe API errors', async () => {
      mockStripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      await expect(
        createPortalSession({}, mockContext)
      ).rejects.toThrow('internal');
    });
  });
});

