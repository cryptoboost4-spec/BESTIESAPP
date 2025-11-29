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

  // Validate additionalMinutes - only allow the button values
  const validExtensions = [15, 30, 60];
  validateEnum(additionalMinutes, validExtensions, 'Extension duration');

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
      functions.logger.error('Error notifying besties about check-in extension:', error);
      // Don't fail the whole function if notifications fail
    }
  }

  return { success: true, newAlertTime: newAlertTime.toISOString() };
});
