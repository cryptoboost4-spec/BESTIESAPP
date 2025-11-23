const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Remove from bestieUserIds and featuredCircle when bestie relationship is deleted
exports.onBestieDeleted = functions.firestore
  .document('besties/{bestieId}')
  .onDelete(async (snap, context) => {
    const bestie = snap.data();

    // Only remove if the relationship was accepted
    if (bestie.status === 'accepted' && bestie.requesterId && bestie.recipientId) {
      // Remove from both users' bestieUserIds and featuredCircle arrays
      // AND decrement their totalBesties counter
      await db.collection('users').doc(bestie.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayRemove(bestie.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayRemove(bestie.recipientId),
        'stats.totalBesties': admin.firestore.FieldValue.increment(-1)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayRemove(bestie.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayRemove(bestie.requesterId),
        'stats.totalBesties': admin.firestore.FieldValue.increment(-1)
      });

      // Update analytics cache
      const cacheRef = db.collection('analytics_cache').doc('realtime');
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(-1),
        acceptedBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });
