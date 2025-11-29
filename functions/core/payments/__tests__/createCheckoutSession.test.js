/**
 * Tests for createCheckoutSession function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const stripe = require('stripe');
const { createCheckoutSession } = require('../createCheckoutSession');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');

// Create a shared mock instance that both the module and tests can use
// Create instance directly in factory to avoid hoisting/TDZ issues
// Mock Stripe
jest.mock('stripe', () => {
  // Create the instance directly in the factory (no external reference)
  const mockInstance = {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  };
  // Return a function that returns the shared instance
  // This function will be called as stripe(config) when modules load
  const mockStripe = jest.fn(() => mockInstance);
  // Attach the instance to the mock function for easy access in tests
  mockStripe._mockInstance = mockInstance;
  return mockStripe;
});

jest.mock('../../../utils/rateLimiting');
jest.mock('../../../utils/retry'); // Mock retryApiCall

// Use global mocks from jest.setup.js

describe('createCheckoutSession', () => {
  let mockContext;
  let mockData;
  let mockUserDoc;
  let mockStripe;
  let mockUserRef;

  beforeEach(() => {
    mockContext = {
      auth: { uid: 'user123' },
    };

    // Mock checkUserRateLimit
    const { checkUserRateLimit } = require('../../../utils/rateLimiting');
    checkUserRateLimit.mockResolvedValue({ allowed: true });

    // Mock retryApiCall to just execute the function immediately
    const { retryApiCall } = require('../../../utils/retry');
    retryApiCall.mockImplementation(async (fn) => fn());

    // Create mockUserDoc that can be updated
    const createMockUserDoc = () => ({
      exists: true,
      data: jest.fn(() => ({
        email: 'test@example.com',
        stripeCustomerId: null,
      })),
    });
    
    mockUserDoc = createMockUserDoc();

    const db = admin.firestore();
    
    // Create the user ref that will be reused
    mockUserRef = {
      get: jest.fn(async () => {
        // Return current state - if exists is false, data() should return undefined
        return {
          exists: mockUserDoc.exists,
          data: () => {
            if (!mockUserDoc.exists) {
              return undefined;
            }
            return mockUserDoc.data();
          },
        };
      }),
      update: jest.fn().mockResolvedValue(),
    };
    
    // Override collection to support both queries and document operations
    db.collection = jest.fn((name) => {
      if (name === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'user123') {
              return mockUserRef; // Return the shared mock ref
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
              update: jest.fn().mockResolvedValue(),
            };
          }),
          // Support rate limiting queries on users collection
          where: jest.fn().mockReturnThis(),
        };
      }
      // For checkout_sessions collection
      if (name === 'checkout_sessions') {
        return {
          add: jest.fn().mockResolvedValue({ id: 'checkout_session_id' }),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
        };
      }
      // For rate limiting queries (any collection name)
      const query = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
      };
      return {
        ...query,
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
          update: jest.fn().mockResolvedValue(),
        })),
        add: jest.fn().mockResolvedValue({ id: 'doc_id' }),
      };
    });

    // Get the mock instance from the mocked stripe function
    // The module calls stripe(config) at load time, so calling stripe() again returns the same instance
    const stripe = require('stripe');
    mockStripe = stripe('test-key'); // Call it to get the mock instance
    
    // Reset and set up mocks for each test
    mockStripe.customers.create.mockReset();
    mockStripe.checkout.sessions.create.mockReset();
    
    // Set up default resolved values
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'session_test123',
      url: 'https://checkout.stripe.com/test',
    });

    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 10,
      remaining: 9,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Re-setup retryApiCall mock after clearAllMocks
    const { retryApiCall } = require('../../../utils/retry');
    retryApiCall.mockImplementation(async (fn) => fn());
  });

  describe('Authentication', () => {
    test('should throw if user is not authenticated', async () => {
      const unauthenticatedContext = { auth: null };

      await expect(
        createCheckoutSession({ amount: 1, type: 'donation' }, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    test('should throw if amount is missing', async () => {
      const invalidData = { type: 'donation' };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('Missing amount or type');
    });

    test('should throw if type is missing', async () => {
      const invalidData = { amount: 1 };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('Missing amount or type');
    });

    test('should throw if donation amount is invalid', async () => {
      const invalidData = { amount: 3, type: 'donation' };

      await expect(
        createCheckoutSession(invalidData, mockContext)
      ).rejects.toThrow('Donation amount must be');
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
      ).rejects.toThrow('SMS subscription must be');
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

      await createCheckoutSession({ amount: 1, type: 'donation' }, mockContext);

      // Check the shared mockUserRef that the function uses
      expect(mockUserRef.update).toHaveBeenCalledWith(
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
      ).rejects.toThrow('Failed to create checkout session');
    });

    test('should handle missing user document', async () => {
      // Set exists to false - this will cause data() to return undefined
      // and accessing userData.stripeCustomerId will throw TypeError
      mockUserDoc.exists = false;
      mockUserDoc.data = jest.fn(() => undefined);

      await expect(
        createCheckoutSession({ amount: 1, type: 'donation' }, mockContext)
      ).rejects.toThrow();
    });
  });
});

