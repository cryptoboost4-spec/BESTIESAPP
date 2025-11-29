const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMSAlert } = require('../../utils/notifications');
const { requireAuth, validatePhoneNumber } = require('../../utils/validation');
const { RATE_LIMITS, checkUserRateLimit } = require('../../utils/rateLimiting');

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

exports.sendBestieInvite = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { recipientPhone, message } = data;

  // Validate recipientPhone
  validatePhoneNumber(recipientPhone);

  // Validate message if provided
  if (message !== undefined) {
    if (typeof message !== 'string' || message.length > 500) {
      throw new functions.https.HttpsError('invalid-argument', 'Message must be a string under 500 characters');
    }
  }

  // Rate limiting: 20 invites per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rateLimit = await checkUserRateLimit(
    userId,
    'sendBestieInvite',
    RATE_LIMITS.BESTIE_INVITES_PER_DAY,
    'besties',
    'requesterId',
    'createdAt'
  );

  if (!rateLimit.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Daily invite limit reached. Limit: ${rateLimit.limit} per day. Try again tomorrow.`,
      {
        limit: rateLimit.limit,
        count: rateLimit.count,
        resetAt: rateLimit.resetAt.toISOString(),
      }
    );
  }

  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data();

  const inviteMessage = message ||
    `${userData.displayName} wants you to be their Safety Bestie on Besties! Join now: ${APP_URL}?invite=${userId}`;

  await sendSMSAlert(recipientPhone, inviteMessage);
  return { success: true };
});
