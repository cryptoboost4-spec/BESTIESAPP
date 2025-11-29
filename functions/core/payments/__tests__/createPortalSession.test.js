/**
 * Tests for createPortalSession function
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const stripe = require('stripe');
const { createPortalSession } = require('../createPortalSession');
const { checkUserRateLimit } = require('../../../utils/rateLimiting');

// Create a shared mock instance that both the module and tests can use
// Create instance directly in factory to avoid hoisting/TDZ issues
jest.mock('stripe', () => {
  // Create the instance directly in the factory (no external reference)
  const mockInstance = {
    billingPortal: {
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

describe('createPortalSession', () => {
  let mockContext;
  let mockUserDoc;
  let mockStripe;

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

    mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({
        stripeCustomerId: 'cus_test123',
      })),
    };

    const db = admin.firestore();
    // Override collection to support both queries and document operations
    db.collection = jest.fn((name) => {
      if (name === 'users') {
        return {
          doc: jest.fn((id) => {
            if (id === 'user123') {
              // Create a fresh doc ref each time to capture current mockUserDoc state
              return {
                get: jest.fn(async () => {
                  // Return current state of mockUserDoc - if exists is false, data should return undefined
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
            }
            return {
              get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
              update: jest.fn().mockResolvedValue(),
            };
          }),
          // Support rate limiting queries
          where: jest.fn().mockReturnThis(),
        };
      }
      // For portal_sessions collection
      if (name === 'portal_sessions') {
        return {
          add: jest.fn().mockResolvedValue(),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }),
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            update: jest.fn().mockResolvedValue(),
          })),
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
      };
    });

    // Get the mock instance from the mocked stripe function
    // The module calls stripe(config) at load time, so calling stripe() again returns the same instance
    const stripe = require('stripe');
    mockStripe = stripe('test-key'); // Call it to get the mock instance
    
    // Reset and set up mocks for each test
    mockStripe.billingPortal.sessions.create.mockReset();
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/test',
    });

    checkUserRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      limit: 5,
      remaining: 4,
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
        createPortalSession({}, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('Customer Validation', () => {
    test('should throw if no Stripe customer ID', async () => {
      mockUserDoc.data = jest.fn(() => ({
        stripeCustomerId: null,
      }));

      await expect(
        createPortalSession({}, mockContext)
      ).rejects.toThrow('No active subscription');
    });

    test('should throw if user document missing', async () => {
      // Set exists to false - this will cause data() to return undefined
      // and accessing userData.stripeCustomerId will throw TypeError
      mockUserDoc.exists = false;
      // Clear the data function so it returns undefined when exists is false
      mockUserDoc.data = jest.fn(() => undefined);

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
      // Mock retryApiCall to reject with an error
      const { retryApiCall } = require('../../../utils/retry');
      retryApiCall.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        createPortalSession({}, mockContext)
      ).rejects.toThrow('Failed to create portal session');
    });
  });
});

