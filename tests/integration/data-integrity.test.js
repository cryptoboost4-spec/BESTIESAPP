/**
 * Integration Tests for Data Integrity
 * 
 * These tests verify that stats are NOT double-counted
 * and that triggers work correctly as single source of truth
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'bestiesapp-test',
  });
}

const db = admin.firestore();

describe('Data Integrity Tests - Prevent Double Counting', () => {
  let testUserId;
  let testBestieId;
  let testCheckInId;
  let testBestieId_doc;

  beforeAll(async () => {
    // Create test users
    testUserId = `test-user-${Date.now()}`;
    testBestieId = `test-bestie-${Date.now()}`;

    // Create test user documents with initial stats
    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      bestieUserIds: [],
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
        alertedCheckIns: 0,
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
        alertedCheckIns: 0,
        totalBesties: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.collection('users').doc(testUserId).delete();
    await db.collection('users').doc(testBestieId).delete();
    
    // Cleanup check-ins
    const checkIns = await db.collection('checkins')
      .where('userId', '==', testUserId)
      .get();
    
    const batch = db.batch();
    checkIns.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Cleanup besties
    const besties = await db.collection('besties')
      .where('requesterId', '==', testUserId)
      .get();
    
    const batch2 = db.batch();
    besties.forEach(doc => batch2.delete(doc.ref));
    await batch2.commit();
  });

  describe('Check-In Stats Integrity', () => {
    test('should increment totalCheckIns only once when check-in is created', async () => {
      // Get initial count
      const userBefore = await db.collection('users').doc(testUserId).get();
      const initialCount = userBefore.data().stats.totalCheckIns;

      // Create check-in (this should trigger onCheckInCreated)
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
      });

      // Wait a moment for trigger to fire (in real scenario)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check final count
      const userAfter = await db.collection('users').doc(testUserId).get();
      const finalCount = userAfter.data().stats.totalCheckIns;

      // Should increment by exactly 1
      expect(finalCount).toBe(initialCount + 1);

      // Cleanup
      await checkInRef.delete();
    });

    test('should increment completedCheckIns only once when check-in is completed', async () => {
      // Create a check-in first
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
      });

      // Wait for creation trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get initial completed count
      const userBefore = await db.collection('users').doc(testUserId).get();
      const initialCompleted = userBefore.data().stats.completedCheckIns;

      // Complete check-in (this should trigger onCheckInCountUpdate)
      await checkInRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      // Wait for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check final count
      const userAfter = await db.collection('users').doc(testUserId).get();
      const finalCompleted = userAfter.data().stats.completedCheckIns;

      // Should increment by exactly 1 (not 2)
      expect(finalCompleted).toBe(initialCompleted + 1);

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Bestie Stats Integrity', () => {
    test('should increment totalBesties only once when bestie is accepted', async () => {
      // Get initial counts for both users
      const userBefore = await db.collection('users').doc(testUserId).get();
      const bestieBefore = await db.collection('users').doc(testBestieId).get();
      
      const initialUserBesties = userBefore.data().stats.totalBesties;
      const initialBestieBesties = bestieBefore.data().stats.totalBesties;

      // Create bestie relationship
      const bestieRef = await db.collection('besties').add({
        requesterId: testUserId,
        recipientId: testBestieId,
        requesterName: 'Test User',
        recipientName: 'Test Bestie',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
      });

      // Accept bestie (this should trigger onBestieCountUpdate)
      await bestieRef.update({
        status: 'accepted',
        acceptedAt: admin.firestore.Timestamp.now(),
      });

      // Wait for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check final counts
      const userAfter = await db.collection('users').doc(testUserId).get();
      const bestieAfter = await db.collection('users').doc(testBestieId).get();
      
      const finalUserBesties = userAfter.data().stats.totalBesties;
      const finalBestieBesties = bestieAfter.data().stats.totalBesties;

      // Both should increment by exactly 1 (not 2)
      expect(finalUserBesties).toBe(initialUserBesties + 1);
      expect(finalBestieBesties).toBe(initialBestieBesties + 1);

      // Cleanup
      await bestieRef.delete();
    });
  });

  describe('Stats Consistency', () => {
    test('should maintain consistent stats across operations', async () => {
      // Create and complete a check-in
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
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete it
      await checkInRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify stats are consistent
      const user = await db.collection('users').doc(testUserId).get();
      const stats = user.data().stats;

      // totalCheckIns should be >= completedCheckIns
      expect(stats.totalCheckIns).toBeGreaterThanOrEqual(stats.completedCheckIns);

      // Cleanup
      await checkInRef.delete();
    });
  });
});

