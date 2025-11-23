const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Acknowledge alert (bestie has viewed the alert)
exports.acknowledgeAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId } = data;

  if (!checkInId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing checkInId');
  }

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists) {
    throw new functions.https.HttpsError('not-found', 'Check-in not found');
  }

  const checkInData = checkIn.data();

  // Verify that the user is one of the besties for this check-in
  if (!checkInData.bestieIds || !checkInData.bestieIds.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not authorized to acknowledge this alert');
  }

  // Add user to acknowledgedBy array if not already there
  const acknowledgedBy = checkInData.acknowledgedBy || [];
  if (!acknowledgedBy.includes(context.auth.uid)) {
    await checkInRef.update({
      acknowledgedBy: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
    });

    // Track alert response for connection strength
    const responseTime = Date.now() - checkInData.alertedAt.toMillis();
    await db.collection('alert_responses').add({
      userId: checkInData.userId,
      responderId: context.auth.uid,
      checkInId: checkInId,
      responseTime: responseTime, // Time in milliseconds
      timestamp: admin.firestore.Timestamp.now(),
    });

    console.log(`User ${context.auth.uid} acknowledged alert for check-in ${checkInId} (response time: ${Math.round(responseTime / 1000)}s)`);
  }

  return { success: true };
});
