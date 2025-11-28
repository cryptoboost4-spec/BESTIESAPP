const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Complete check-in
exports.completeCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId } = data;

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  await checkInRef.update({
    status: 'completed',
    completedAt: admin.firestore.Timestamp.now(),
  });

  // Stats are updated by onCheckInCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  return { success: true };
});
