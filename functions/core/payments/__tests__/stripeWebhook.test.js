/**
 * Tests for stripeWebhook function
 */
const admin = require('firebase-admin');
const stripe = require('stripe');
const { stripeWebhook } = require('../stripeWebhook');
const { updateUserBadges } = require('../../../utils/badges');

jest.mock('stripe');
jest.mock('../../../utils/badges');
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    },
  })),
}));

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

    mockWebhookEventsCollection = {
      doc: jest.fn(() => mockEventDoc),
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

    mockStripe = stripe();
    mockStripe.webhooks = {
      constructEvent: jest.fn(),
    };

    updateUserBadges.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Signature Verification', () => {
    test('should verify webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
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

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'test-body',
        'test-signature',
        expect.anything()
      );
    });

    test('should return 400 if signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await stripeWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('Idempotency', () => {
    test('should check if event already processed', async () => {
      mockEventDoc.exists = true;
      mockEventDoc.get = jest.fn().mockResolvedValue({ exists: true });

      mockStripe.webhooks.constructEvent.mockReturnValue({
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
      mockStripe.webhooks.constructEvent.mockReturnValue({
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

      expect(mockEventDoc.set).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should handle checkout.session.completed for subscription', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
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
      mockStripe.webhooks.constructEvent.mockReturnValue({
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
      mockStripe.webhooks.constructEvent.mockReturnValue({
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
      mockStripe.webhooks.constructEvent.mockReturnValue({
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

