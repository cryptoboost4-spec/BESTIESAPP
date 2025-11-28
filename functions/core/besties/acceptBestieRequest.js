const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.acceptBestieRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { bestieId } = data;

  const bestieRef = db.collection('besties').doc(bestieId);
  const bestie = await bestieRef.get();

  if (!bestie.exists || bestie.data().recipientId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid request');
  }

  await bestieRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.Timestamp.now(),
  });

  // Stats are updated by onBestieCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  return { success: true };
});
