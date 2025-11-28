const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');

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

  // Notify besties about check-in completion
  const checkInData = checkIn.data();
  if (checkInData.bestieIds && checkInData.bestieIds.length > 0) {
    try {
      await notifyBestiesAboutCheckIn(
        checkInData.userId,
        checkInData.bestieIds,
        'checkInCompleted',
        {
          ...checkInData,
          status: 'completed',
          completedAt: admin.firestore.Timestamp.now(),
        }
      );
    } catch (error) {
      console.error('Error notifying besties about check-in completion:', error);
      // Don't throw - notification failure shouldn't prevent completion
    }
  }

  return { success: true };
});
