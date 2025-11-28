const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');

const db = admin.firestore();

// Extend check-in
exports.extendCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId, additionalMinutes } = data;

  // Validate additionalMinutes - only allow the button values
  const validExtensions = [15, 30, 60];
  if (!validExtensions.includes(additionalMinutes)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Extension must be 15, 30, or 60 minutes'
    );
  }

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  const checkInData = checkIn.data();
  const currentAlertTime = checkInData.alertTime.toDate();
  const newAlertTime = new Date(currentAlertTime.getTime() + additionalMinutes * 60000);

  await checkInRef.update({
    alertTime: admin.firestore.Timestamp.fromDate(newAlertTime),
    duration: checkInData.duration + additionalMinutes,
    lastUpdate: admin.firestore.Timestamp.now(),
  });

  // Notify besties about extension (via free channels only)
  if (checkInData.bestieIds && checkInData.bestieIds.length > 0) {
    try {
      await notifyBestiesAboutCheckIn(
        checkInData.userId,
        checkInData.bestieIds,
        'checkInExtended',
        {
          ...checkInData,
          extension: additionalMinutes,
          alertTime: admin.firestore.Timestamp.fromDate(newAlertTime)
        }
      );
    } catch (error) {
      console.error('Error notifying besties about check-in extension:', error);
      // Don't fail the whole function if notifications fail
    }
  }

  return { success: true, newAlertTime: newAlertTime.toISOString() };
});
