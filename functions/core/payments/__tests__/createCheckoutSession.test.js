/**
 * Tests for createCheckoutSession function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const stripe = require('stripe');
const { createCheckoutSession } = require('../createCheckoutSession');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    customers: {
      create: jest.fn(),
    },
    checkout: {
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
        update: jest.fn(),
      })),
    })),
  })),
}));

describe('createCheckoutSession', () => {
  let mockContext;
  let mockData;
  let mockUserDoc;
  let mockStripe;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        email: 'test@example.com',
        stripeCustomerId: null,
      })),
    };

    const db = admin.firestore();
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockUserDoc),
        update: jest.fn().mockResolvedValue(),
      })),
    }));

    mockStripe = stripe();
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'session_test123',
      url: 'https://checkout.stripe.com/test',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        createCheckoutSession({ amount: 1, type: 'donation' }, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });

  describe('Validation', () => {
    test('should throw if amount is missing', async () => {
      const invalidData = { type: 'donation' };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    test('should throw if type is missing', async () => {
      const invalidData = { amount: 1 };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    test('should throw if donation amount is invalid', async () => {
      const invalidData = { amount: 3, type: 'donation' };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    test('should accept valid donation amounts (1, 5, 10)', async () => {
      for (const amount of [1, 5, 10]) {
        const validData = { amount, type: 'donation' };
        await expect(createCheckoutSession(validData, mockContext)).resolves.toBeDefined();
      }
    });

    test('should throw if subscription amount is not 1', async () => {
      const invalidData = { amount: 5, type: 'subscription' };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    test('should accept subscription amount of 1', async () => {
      const validData = { amount: 1, type: 'subscription' };
      await expect(createCheckoutSession(validData, mockContext)).resolves.toBeDefined();
    });
  });

  describe('Stripe Customer Creation', () => {
    test('should create Stripe customer if not exists', async () => {
      mockUserDoc.data = jest.fn(() => ({
        email: 'test@example.com',
        stripeCustomerId: null,
      }));

      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          metadata: expect.objectContaining({
            firebaseUID: 'user123',
          }),
        })
      );
    });

    test('should use existing Stripe customer if exists', async () => {
      mockUserDoc.data = jest.fn(() => ({
        email: 'test@example.com',
        stripeCustomerId: 'cus_existing123',
      }));

      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    test('should save Stripe customer ID to user document', async () => {
      mockUserDoc.data = jest.fn(() => ({
        email: 'test@example.com',
        stripeCustomerId: null,
      }));

      const db = admin.firestore();
      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      const userRef = db.collection().doc();
      expect(userRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: 'cus_test123',
        })
      );
    });
  });

  describe('Checkout Session Creation', () => {
    test('should create checkout session for donation', async () => {
      await createCheckoutSession({ amount: 5, type: 'donation' }, mockContext);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          mode: 'subscription',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 500, // $5 in cents
                product_data: expect.objectContaining({
                  name: 'Besties Support',
                }),
              }),
            }),
          ]),
        })
      );
    });

    test('should create checkout session for subscription', async () => {
      await createCheckoutSession({ amount: 1, type: 'subscription' }, mockContext);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: 'SMS Alerts Subscription',
                }),
              }),
            }),
          ]),
        })
      );
    });

    test('should include success and cancel URLs', async () => {
      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('/subscription-success'),
          cancel_url: expect.stringContaining('/subscription-cancel'),
        })
      );
    });

    test('should include metadata with user ID and type', async () => {
      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            firebaseUID: 'user123',
            type: 'donation',
          }),
        })
      );
    });
  });

  describe('Response', () => {
    test('should return checkout session URL', async () => {
      const result = await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      expect(result).toEqual({
        success: true,
        url: 'https://checkout.stripe.com/test',
        sessionId: 'session_test123',
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle Stripe API errors', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        createCheckoutSession({ amount: 1, type: 'donation' }, mockContext)
      ).rejects.toThrow('internal');
    });

    test('should handle missing user document', async () => {
      mockUserDoc.exists = false;

      await expect(
        createCheckoutSession({ amount: 1, type: 'donation' }, mockContext)
      ).rejects.toThrow();
    });
  });
});

