/**
 * Integration Tests for Bestie Lifecycle
 * 
 * Tests the complete bestie connection flow
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'bestiesapp-test',
  });
}

const db = admin.firestore();

describe('Bestie Lifecycle Integration Tests', () => {
  let testUserId;
  let testBestieId;

  beforeAll(async () => {
    testUserId = `test-user-${Date.now()}`;
    testBestieId = `test-bestie-${Date.now()}`;

    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      bestieUserIds: [],
      stats: {
        totalBesties: 0,
      },
    });

    await db.collection('users').doc(testBestieId).set({
      uid: testBestieId,
      email: 'bestie@example.com',
      displayName: 'Test Bestie',
      bestieUserIds: [],
      stats: {
        totalBesties: 0,
      },
    });
  });

  afterAll(async () => {
    await db.collection('users').doc(testUserId).delete();
    await db.collection('users').doc(testBestieId).delete();

    const besties = await db.collection('besties')
      .where('requesterId', '==', testUserId)
      .get();

    const batch = db.batch();
    besties.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  describe('Bestie Request Creation', () => {
    test('should create pending bestie request', async () => {
      const bestieRef = await db.collection('besties').add({
        requesterId: testUserId,
        recipientPhone: '+61412345678',
        requesterName: 'Test User',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
      });

      const bestieDoc = await bestieRef.get();
      expect(bestieDoc.exists).toBe(true);
      const data = bestieDoc.data();

      expect(data.status).toBe('pending');
      expect(data.requesterId).toBe(testUserId);

      // Cleanup
      await bestieRef.delete();
    });
  });

  describe('Bestie Acceptance', () => {
    test('should update status to accepted', async () => {
      const bestieRef = await db.collection('besties').add({
        requesterId: testUserId,
        recipientId: testBestieId,
        requesterName: 'Test User',
        recipientName: 'Test Bestie',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
      });

      await bestieRef.update({
        status: 'accepted',
        acceptedAt: admin.firestore.Timestamp.now(),
        recipientId: testBestieId,
      });

      const bestieDoc = await bestieRef.get();
      const data = bestieDoc.data();

      expect(data.status).toBe('accepted');
      expect(data.acceptedAt).toBeDefined();
      expect(data.recipientId).toBe(testBestieId);

      // Cleanup
      await bestieRef.delete();
    });
  });

  describe('Bestie Deletion', () => {
    test('should remove bestie relationship', async () => {
      const bestieRef = await db.collection('besties').add({
        requesterId: testUserId,
        recipientId: testBestieId,
        status: 'accepted',
        createdAt: admin.firestore.Timestamp.now(),
      });

      await bestieRef.delete();

      const bestieDoc = await bestieRef.get();
      expect(bestieDoc.exists).toBe(false);
    });
  });
});

