const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { requireAuth, validateId } = require('../../utils/validation');

const db = admin.firestore();

// Acknowledge alert (bestie has viewed the alert)
exports.acknowledgeAlert = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { checkInId } = data;

  // Validate checkInId
  validateId(checkInId, 'check-in ID');

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists) {
    throw new functions.https.HttpsError('not-found', 'Check-in not found');
  }

  const checkInData = checkIn.data();

  // Verify that the user is one of the besties for this check-in
  if (!checkInData.bestieIds || !checkInData.bestieIds.includes(userId)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not authorized to acknowledge this alert');
  }

  // Add user to acknowledgedBy array if not already there
  const acknowledgedBy = checkInData.acknowledgedBy || [];
  if (!acknowledgedBy.includes(userId)) {
    await checkInRef.update({
      acknowledgedBy: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // Track alert response for connection strength
    const responseTime = Date.now() - checkInData.alertedAt.toMillis();
    await db.collection('alert_responses').add({
      userId: checkInData.userId,
      responderId: userId,
      checkInId: checkInId,
      responseTime: responseTime, // Time in milliseconds
      timestamp: admin.firestore.Timestamp.now(),
    });
  }

  return { success: true };
});
