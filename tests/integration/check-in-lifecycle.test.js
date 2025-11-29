/**
 * Integration Tests for Check-In Lifecycle
 * 
 * Tests the complete check-in flow from creation to completion/alert
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'bestiesapp-test',
  });
}

const db = admin.firestore();

describe('Check-In Lifecycle Integration Tests', () => {
  let testUserId;
  let testBestieId;

  beforeAll(async () => {
    // Create test users
    testUserId = `test-user-${Date.now()}`;
    testBestieId = `test-bestie-${Date.now()}`;

    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      bestieUserIds: [testBestieId],
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
        alertedCheckIns: 0,
      },
    });

    await db.collection('users').doc(testBestieId).set({
      uid: testBestieId,
      email: 'bestie@example.com',
      displayName: 'Test Bestie',
      bestieUserIds: [testUserId],
    });
  });

  afterAll(async () => {
    // Cleanup
    await db.collection('users').doc(testUserId).delete();
    await db.collection('users').doc(testBestieId).delete();
    
    const checkIns = await db.collection('checkins')
      .where('userId', '==', testUserId)
      .get();
    
    const batch = db.batch();
    checkIns.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  describe('Check-In Creation', () => {
    test('should create check-in with all required fields', async () => {
      const checkInData = {
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
      };

      const checkInRef = await db.collection('checkins').add(checkInData);
      const checkInDoc = await checkInRef.get();

      expect(checkInDoc.exists).toBe(true);
      const data = checkInDoc.data();
      
      expect(data.userId).toBe(testUserId);
      expect(data.location).toBe('Test Location');
      expect(data.duration).toBe(30);
      expect(data.status).toBe('active');
      expect(data.bestieIds).toContain(testBestieId);
      expect(data.bestieUserIds).toContain(testBestieId);

      // Cleanup
      await checkInRef.delete();
    });

    test('should include denormalized bestieUserIds', async () => {
      const checkInRef = await db.collection('checkins').add({
        userId: testUserId,
        location: 'Test Location',
        duration: 30,
        alertTime: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 60 * 1000)
        ),
        bestieIds: [testBestieId],
        bestieUserIds: [testBestieId], // Denormalized
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
      });

      const checkInDoc = await checkInRef.get();
      const data = checkInDoc.data();

      // Should have denormalized field for fast queries
      expect(data.bestieUserIds).toBeDefined();
      expect(Array.isArray(data.bestieUserIds)).toBe(true);
      expect(data.bestieUserIds).toContain(testBestieId);

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Check-In Completion', () => {
    test('should update status to completed', async () => {
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

      await checkInRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      const checkInDoc = await checkInRef.get();
      const data = checkInDoc.data();

      expect(data.status).toBe('completed');
      expect(data.completedAt).toBeDefined();

      // Cleanup
      await checkInRef.delete();
    });

    test('should be idempotent (can complete already completed check-in)', async () => {
      const checkInRef = await db.collection('checkins').add({
        userId: testUserId,
        location: 'Test Location',
        duration: 30,
        alertTime: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 60 * 1000)
        ),
        bestieIds: [testBestieId],
        bestieUserIds: [testBestieId],
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
      });

      // Try to complete again
      await checkInRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      const checkInDoc = await checkInRef.get();
      const data = checkInDoc.data();

      expect(data.status).toBe('completed');

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Check-In Extension', () => {
    test('should extend alertTime correctly', async () => {
      const originalAlertTime = new Date(Date.now() + 30 * 60 * 1000);
      const checkInRef = await db.collection('checkins').add({
        userId: testUserId,
        location: 'Test Location',
        duration: 30,
        alertTime: admin.firestore.Timestamp.fromDate(originalAlertTime),
        bestieIds: [testBestieId],
        bestieUserIds: [testBestieId],
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
      });

      // Extend by 15 minutes
      const checkInDoc = await checkInRef.get();
      const currentData = checkInDoc.data();
      const currentAlertTime = currentData.alertTime.toDate();
      const newAlertTime = new Date(currentAlertTime.getTime() + 15 * 60 * 1000);

      await checkInRef.update({
        alertTime: admin.firestore.Timestamp.fromDate(newAlertTime),
        duration: currentData.duration + 15,
        lastUpdate: admin.firestore.Timestamp.now(),
      });

      const updatedDoc = await checkInRef.get();
      const updatedData = updatedDoc.data();

      expect(updatedData.duration).toBe(45);
      expect(updatedData.alertTime.toDate().getTime()).toBe(newAlertTime.getTime());

      // Cleanup
      await checkInRef.delete();
    });
  });

  describe('Check-In Status Transitions', () => {
    test('should allow valid status transitions', async () => {
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

      // active -> completed (valid)
      await checkInRef.update({ status: 'completed' });
      let doc = await checkInRef.get();
      expect(doc.data().status).toBe('completed');

      // Cleanup
      await checkInRef.delete();
    });
  });
});

