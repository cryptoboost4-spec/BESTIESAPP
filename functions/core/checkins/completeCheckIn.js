const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');
const { requireAuth, validateId } = require('../../utils/validation');

const db = admin.firestore();

// Complete check-in
exports.completeCheckIn = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { checkInId } = data;

  // Validate checkInId
  validateId(checkInId, 'check-in ID');

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  const checkInData = checkIn.data();
  
  // Prevent duplicate completion (idempotency)
  if (checkInData.status === 'completed') {
    return { success: true, message: 'Check-in already completed' };
  }

  await checkInRef.update({
    status: 'completed',
    completedAt: admin.firestore.Timestamp.now(),
  });

  // Stats are updated by onCheckInCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  // Notify besties about check-in completion
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
      functions.logger.error('Error notifying besties about check-in completion:', error);
      // Don't throw - notification failure shouldn't prevent completion
    }
  }

  return { success: true };
});
