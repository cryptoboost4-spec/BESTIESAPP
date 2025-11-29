const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Helper function to award bestie badges
async function awardBestieBadge(userId) {
  const count1 = await db.collection('besties')
    .where('requesterId', '==', userId)
    .where('status', '==', 'accepted')
    .count()
    .get();

  const count2 = await db.collection('besties')
    .where('recipientId', '==', userId)
    .where('status', '==', 'accepted')
    .count()
    .get();

  const total = (count1.data()?.count || 0) + (count2.data()?.count || 0);
  const badgesRef = db.collection('badges').doc(userId);
  const badgesDoc = await badgesRef.get();
  const badges = badgesDoc.exists ? badgesDoc.data().badges || [] : [];

  if (total >= 3 && !badges.includes('friend_squad')) badges.push('friend_squad');
  if (total >= 5 && !badges.includes('safety_circle')) badges.push('safety_circle');
  if (total >= 10 && !badges.includes('safety_network')) badges.push('safety_network');

  if (badgesDoc.exists) {
    await badgesRef.update({ badges });
  } else {
    await badgesRef.set({ userId, badges, createdAt: admin.firestore.Timestamp.now() });
  }
}

exports.onBestieCountUpdate = functions.firestore
  .document('besties/{bestieId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    if (newData.status === 'accepted' && oldData.status !== 'accepted') {
      // Increment totalBesties for both users
      await db.collection('users').doc(newData.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(newData.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });

      // Add to bestieUserIds AND featuredCircle arrays for both users
      await db.collection('users').doc(newData.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(newData.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.recipientId)
      });
      await db.collection('users').doc(newData.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(newData.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.requesterId)
      });

      // Update analytics cache: pending → accepted
      await cacheRef.set({
        acceptedBesties: admin.firestore.FieldValue.increment(1),
        pendingBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      await awardBestieBadge(newData.requesterId);
      await awardBestieBadge(newData.recipientId);
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
