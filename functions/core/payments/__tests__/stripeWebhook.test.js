/**
 * Tests for stripeWebhook function
 */
const admin = require('firebase-admin');
const stripe = require('stripe');
const { stripeWebhook } = require('../stripeWebhook');
const { updateUserBadges } = require('../../../utils/badges');

// Create a shared mock instance that both the module and tests can use
// Create a shared mock instance that both the module and tests can use
// Create instance directly in factory to avoid hoisting/TDZ issues
jest.mock('stripe', () => {
  // Create the instance directly in the factory (no external reference)
  const mockInstance = {
    webhooks: {
      constructEvent: jest.fn(),
    },
    customers: {
      retrieve: jest.fn(),
    },
  };
  // Return a function that returns the shared instance
  // This function will be called as stripe(config) when modules load
  const mockStripe = jest.fn(() => mockInstance);
  // Attach the instance to the mock function for easy access in tests
  mockStripe._mockInstance = mockInstance;
  return mockStripe;
});
jest.mock('../../../utils/badges');
// Use global mocks from jest.setup.js

describe('stripeWebhook', () => {
  let mockReq;
  let mockRes;
  let mockStripe;
  let mockEventDoc;
  let mockUserRef;
  let mockWebhookEventsCollection;

  beforeEach(() => {
    mockReq = {
      headers: {
        'stripe-signature': 'test-signature',
      },
      rawBody: 'test-body',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    mockEventDoc = {
      exists: false,
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: jest.fn().mockResolvedValue(),
    };

    mockUserRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          donationStats: { totalDonated: 0 },
        }),
      }),
      update: jest.fn().mockResolvedValue(),
    };

    // Create event refs that will be reused - need to ensure update is always available
    const eventRefs = new Map();
    mockWebhookEventsCollection = {
      doc: jest.fn((eventId) => {
        // Return the same ref for the same event ID, or create a new one
        if (!eventRefs.has(eventId)) {
          eventRefs.set(eventId, {
            get: jest.fn().mockResolvedValue(mockEventDoc),
            set: jest.fn().mockResolvedValue(),
            update: jest.fn().mockResolvedValue(), // Always include update
          });
        }
        return eventRefs.get(eventId);
      }),
    };

    const db = admin.firestore();
    db.collection = jest.fn((collectionName) => {
      if (collectionName === 'webhook_events') {
        return mockWebhookEventsCollection;
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn(() => mockUserRef),
        };
      }
    });

    // Get the mock instance from the mocked stripe function
    // The module calls stripe(config) at load time, so calling stripe() again returns the same instance
    const stripe = require('stripe');
    mockStripe = stripe('test-key'); // Call it to get the mock instance
    
    // Reset and set up mocks for each test
    mockStripe.webhooks.constructEvent.mockReset();
    mockStripe.customers.retrieve.mockReset();
    
    // Set default mock return value for constructEvent - must return event object
    // This ensures event.id is always available
    const defaultEvent = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { firebaseUID: 'user123', type: 'subscription' },
          subscription: 'sub_test123',
        },
      },
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(defaultEvent);

    updateUserBadges.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Signature Verification', () => {
    test('should verify webhook signature', async () => {
      const testEvent = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123', type: 'subscription' },
            subscription: 'sub_test123',
          },
        },
      };
      // Ensure the mock returns the event before the function tries to access event.id
      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(testEvent);

      await stripeWebhook(mockReq, mockRes);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'test-body',
        'test-signature',
        'whsec_test_secret' // webhook_secret from jest.setup.js
      );
      expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    });

    test('should return 400 if signature verification fails', async () => {
      // Reset the mock to throw an error - this should return early before accessing event.id
      mockStripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await stripeWebhook(mockReq, mockRes);

      // Should return early with 400, so event.id should never be accessed
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('Idempotency', () => {
    test('should check if event already processed', async () => {
      const existingEventDoc = {
        exists: true,
        get: jest.fn().mockResolvedValue({ exists: true }),
      };
      
      mockWebhookEventsCollection.doc = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(existingEventDoc),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(), // Add update method for catch block
      }));

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: { object: {} },
      });

      await stripeWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ received: true, message: 'Event already processed' })
      );
    });

    test('should store event to prevent reprocessing', async () => {
      const eventDocRef = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(), // Add update method
      };
      
      mockWebhookEventsCollection.doc = jest.fn(() => eventDocRef);

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123', type: 'subscription' },
            subscription: 'sub_test123',
          },
        },
      });

      await stripeWebhook(mockReq, mockRes);

      expect(eventDocRef.set).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should handle checkout.session.completed for subscription', async () => {
      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123', type: 'subscription' },
            subscription: 'sub_test123',
          },
        },
      });

      await stripeWebhook(mockReq, mockRes);

      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'smsSubscription.active': true,
          'smsSubscription.stripeSubscriptionId': 'sub_test123',
        })
      );
      expect(updateUserBadges).toHaveBeenCalledWith('user123');
    });

    test('should handle checkout.session.completed for donation', async () => {
      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123', type: 'donation' },
            subscription: 'sub_test123',
            amount_total: 500, // $5 in cents
          },
        },
      });

      await stripeWebhook(mockReq, mockRes);

      expect(mockUserRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'donationStats.isActive': true,
          'donationStats.monthlyAmount': 5,
        })
      );
    });

    test('should handle customer.subscription.deleted', async () => {
      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test123',
          },
        },
      });

      await stripeWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'user123', type: 'subscription' },
          },
        },
      });

      mockUserRef.update.mockRejectedValue(new Error('Database error'));

      await stripeWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

