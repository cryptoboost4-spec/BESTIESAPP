/**
 * Integration Tests for Payment Flow
 * 
 * Tests the complete payment subscription flow
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'bestiesapp-test',
  });
}

const db = admin.firestore();

describe('Payment Flow Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    testUserId = `test-user-${Date.now()}`;

    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
      },
    });
  });

  afterAll(async () => {
    await db.collection('users').doc(testUserId).delete();
  });

  describe('Subscription Creation', () => {
    test('should create subscription record', async () => {
      const subscriptionData = {
        userId: testUserId,
        type: 'sms',
        amount: 1,
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
        createdAt: admin.firestore.Timestamp.now(),
      };

      const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);
      const subscriptionDoc = await subscriptionRef.get();

      expect(subscriptionDoc.exists).toBe(true);
      const data = subscriptionDoc.data();

      expect(data.userId).toBe(testUserId);
      expect(data.type).toBe('sms');
      expect(data.status).toBe('active');

      // Cleanup
      await subscriptionRef.delete();
    });
  });

  describe('User Subscription Update', () => {
    test('should update user document with subscription info', async () => {
      await db.collection('users').doc(testUserId).update({
        smsSubscription: {
          active: true,
          stripeSubscriptionId: 'sub_test123',
        },
      });

      const userDoc = await db.collection('users').doc(testUserId).get();
      const data = userDoc.data();

      expect(data.smsSubscription.active).toBe(true);
      expect(data.smsSubscription.stripeSubscriptionId).toBe('sub_test123');
    });
  });
});

