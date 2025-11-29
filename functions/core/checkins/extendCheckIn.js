const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');
const { requireAuth, validateId, validateEnum } = require('../../utils/validation');
const { RATE_LIMITS, checkUserRateLimit } = require('../../utils/rateLimiting');

const db = admin.firestore();

// Extend check-in
exports.extendCheckIn = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { checkInId, additionalMinutes } = data;

  // Validate checkInId
  validateId(checkInId, 'check-in ID');

  // Validate additionalMinutes - allow custom values within reasonable range
  if (typeof additionalMinutes !== 'number' || additionalMinutes < -60 || additionalMinutes > 120) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Extension must be between -60 and +120 minutes'
    );
  }

  // Rate limiting: 10 extensions per hour
  const rateLimit = await checkUserRateLimit(
    userId,
    'extendCheckIn',
    RATE_LIMITS.CHECKIN_EXTENSIONS_PER_HOUR,
    'checkins',
    'userId',
    'lastUpdate'
  );

  if (!rateLimit.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. Maximum ${rateLimit.limit} check-in extensions per hour. Try again later.`,
      {
        limit: rateLimit.limit,
        count: rateLimit.count,
        resetAt: rateLimit.resetAt.toISOString(),
      }
    );
  }

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  const checkInData = checkIn.data();
  const currentAlertTime = checkInData.alertTime.toDate();
  const newDuration = checkInData.duration + additionalMinutes;
  
  // Validate total duration stays within bounds (10-180 minutes)
  if (newDuration < 10 || newDuration > 180) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Total check-in duration must be between 10 and 180 minutes. Current: ${checkInData.duration} minutes, extension would result in ${newDuration} minutes.`
    );
  }
  
  const newAlertTime = new Date(currentAlertTime.getTime() + additionalMinutes * 60000);

  await checkInRef.update({
    alertTime: admin.firestore.Timestamp.fromDate(newAlertTime),
    duration: newDuration,
    lastUpdate: admin.firestore.Timestamp.now(),
  });

  // Notify besties about extension (via free channels only)
  // Also handles messenger contacts if provided
  if ((checkInData.bestieIds && checkInData.bestieIds.length > 0) || (checkInData.messengerContactIds && checkInData.messengerContactIds.length > 0)) {
    try {
      await notifyBestiesAboutCheckIn(
        checkInData.userId,
        checkInData.bestieIds || [],
        'checkInExtended',
        {
          ...checkInData,
          extension: additionalMinutes,
          alertTime: admin.firestore.Timestamp.fromDate(newAlertTime)
        },
        checkInData.messengerContactIds || []
      );
    } catch (error) {
      functions.logger.error('Error notifying besties about check-in extension:', error);
      // Don't fail the whole function if notifications fail
    }
  }

  return { success: true, newAlertTime: newAlertTime.toISOString() };
});
