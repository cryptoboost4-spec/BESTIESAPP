const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { updateUserBadges } = require('../../utils/badges');

const db = admin.firestore();

exports.onBestieCountUpdate = functions.firestore
  .document('besties/{bestieId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    if (newData.status === 'accepted' && oldData.status !== 'accepted') {
      // Update stats.totalBesties for both users (single source of truth - trigger handles all stat updates)
      await db.collection('users').doc(newData.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(newData.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      
      // Add to featuredCircle arrays for both users (bestieUserIds already updated in acceptBestieRequest)
      await db.collection('users').doc(newData.requesterId).update({
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.recipientId)
      });
      await db.collection('users').doc(newData.recipientId).update({
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.requesterId)
      });

      // Update analytics cache: pending → accepted
      await cacheRef.set({
        acceptedBesties: admin.firestore.FieldValue.increment(1),
        pendingBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Update badges for both users
      await updateUserBadges(newData.requesterId);
      await updateUserBadges(newData.recipientId);
    }

    // Handle declined/cancelled besties
    if ((newData.status === 'declined' || newData.status === 'cancelled') &&
        oldData.status === 'pending') {
      await cacheRef.set({
        pendingBesties: admin.firestore.FieldValue.increment(-1),
        totalBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });
