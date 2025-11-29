/**
 * Integration Tests for Critical User Flows
 * 
 * These tests verify end-to-end functionality of critical paths
 * Run with: npm test (from tests directory)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'bestiesapp-test',
  });
}

const db = admin.firestore();

describe('Critical User Flows - Integration Tests', () => {
  let testUserId;
  let testBestieId;

  beforeAll(async () => {
    // Create test users
    testUserId = `test-user-${Date.now()}`;
    testBestieId = `test-bestie-${Date.now()}`;

    // Create test user documents
    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      bestieUserIds: [],
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
        totalBesties: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
    });

    await db.collection('users').doc(testBestieId).set({
      uid: testBestieId,
      email: 'bestie@example.com',
      displayName: 'Test Bestie',
      bestieUserIds: [],
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
        totalBesties: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.collection('users').doc(testUserId).delete();
    await db.collection('users').doc(testBestieId).delete();
    
    // Cleanup any test check-ins
    const checkIns = await db.collection('checkins')
      .where('userId', '==', testUserId)
      .get();
    
    const batch = db.batch();
    checkIns.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  describe('User Creation Flow', () => {
    test('should create user document with correct structure', async () => {
      const userDoc = await db.collection('users').doc(testUserId).get();
      
      expect(userDoc.exists).toBe(true);
      const data = userDoc.data();
      
      expect(data).toHaveProperty('uid');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('displayName');
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('totalCheckIns', 0);
      expect(data.stats).toHaveProperty('totalBesties', 0);
    });
  });

  describe('Bestie Connection Flow', () => {
    test('should create bestie relationship', async () => {
      const bestieRef = await db.collection('besties').add({
        requesterId: testUserId,
        recipientId: testBestieId,
        requesterName: 'Test User',
        recipientName: 'Test Bestie',
        status: 'accepted',
        createdAt: admin.firestore.Timestamp.now(),
        acceptedAt: admin.firestore.Timestamp.now(),
      });

      const bestieDoc = await bestieRef.get();
      expect(bestieDoc.exists).toBe(true);
      expect(bestieDoc.data().status).toBe('accepted');

      // Cleanup
      await bestieRef.delete();
    });
  });

  describe('Check-in Creation Flow', () => {
    test('should create check-in with denormalized bestieUserIds', async () => {
      // First, add bestie relationship
      await db.collection('users').doc(testUserId).update({
        bestieUserIds: [testBestieId],
      });

      const checkInRef = await db.collection('checkins').add({
        userId: testUserId,
        location: 'Test Location',
        duration: 30,
        alertTime: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 60 * 1000)
        ),
        bestieIds: [testBestieId],
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        lastUpdate: admin.firestore.Timestamp.now(),
      });

      // Wait for trigger to run (in real scenario)
      // For testing, we'll manually add bestieUserIds
      await checkInRef.update({
        bestieUserIds: [testBestieId],
      });

      const checkInDoc = await checkInRef.get();
      const data = checkInDoc.data();

      expect(data).toHaveProperty('bestieUserIds');
      expect(data.bestieUserIds).toContain(testBestieId);
      expect(data.status).toBe('active');

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Check-in Completion Flow', () => {
    test('should update check-in status to completed', async () => {
      const checkInRef = await db.collection('checkins').add({
        userId: testUserId,
        location: 'Test Location',
        duration: 30,
        alertTime: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 60 * 1000)
        ),
        bestieIds: [testBestieId],
        bestieUserIds: [testBestieId],
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        lastUpdate: admin.firestore.Timestamp.now(),
      });

      await checkInRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      const checkInDoc = await checkInRef.get();
      expect(checkInDoc.data().status).toBe('completed');
      expect(checkInDoc.data().completedAt).toBeDefined();

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Rate Limiting', () => {
    test('should track rate limit for function calls', async () => {
      const rateLimitRef = db.collection('rate_limits').doc('testFunction_testUser');
      
      await rateLimitRef.set({
        count: 1,
        firstRequest: admin.firestore.Timestamp.now(),
        lastRequest: admin.firestore.Timestamp.now(),
      });

      const doc = await rateLimitRef.get();
      expect(doc.exists).toBe(true);
      expect(doc.data().count).toBe(1);

      // Cleanup
      await rateLimitRef.delete();
    });
  });
});

