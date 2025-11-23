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

  const total = count1.data().count + count2.data().count;
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

// Handle when bestie is created (handles both pending and accepted)
exports.onBestieCreated = functions.firestore
  .document('besties/{bestieId}')
  .onCreate(async (snap, context) => {
    const bestie = snap.data();
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    // Update analytics cache for ALL bestie creations
    await cacheRef.set({
      totalBesties: admin.firestore.FieldValue.increment(1),
      pendingBesties: bestie.status === 'pending' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      acceptedBesties: bestie.status === 'accepted' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      lastUpdated: admin.firestore.Timestamp.now(),
    }, { merge: true });

    // Process bestie relationships ONLY if created directly as accepted (e.g., invite link flow)
    if (bestie.status === 'accepted' && bestie.requesterId && bestie.recipientId) {
      // Increment totalBesties for both users
      await db.collection('users').doc(bestie.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });

      // Add to bestieUserIds AND featuredCircle arrays for both users
      // This is CRITICAL - without this, besties can't view each other's profiles
      await db.collection('users').doc(bestie.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(bestie.recipientId)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(bestie.requesterId)
      });

      // Update analytics cache: new accepted bestie
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(1),
        acceptedBesties: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Award badges
      await awardBestieBadge(bestie.requesterId);
      await awardBestieBadge(bestie.recipientId);
    } else if (bestie.status === 'pending') {
      // Update analytics cache: new pending bestie
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(1),
        pendingBesties: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });
