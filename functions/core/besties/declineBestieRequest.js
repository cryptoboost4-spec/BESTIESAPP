const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.declineBestieRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { bestieId } = data;

  // Validate bestieId
  if (!bestieId || typeof bestieId !== 'string' || bestieId.length > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid bestie ID');
  }

  const bestieRef = db.collection('besties').doc(bestieId);
  const bestie = await bestieRef.get();

  if (!bestie.exists || bestie.data().recipientId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid request');
  }

  const bestieData = bestie.data();
  
  // Prevent duplicate decline (idempotency)
  if (bestieData.status === 'declined') {
    return { success: true, message: 'Bestie request already declined' };
  }

  await bestieRef.update({
    status: 'declined',
    declinedAt: admin.firestore.Timestamp.now(),
  });

  return { success: true };
});
