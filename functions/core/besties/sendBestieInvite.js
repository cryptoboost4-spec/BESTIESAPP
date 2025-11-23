const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMSAlert } = require('../../utils/notifications');

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

exports.sendBestieInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { recipientPhone, message } = data;

  // Rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invitesCount = await db.collection('besties')
    .where('requesterId', '==', context.auth.uid)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today))
    .count()
    .get();

  if (invitesCount.data().count >= 20) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily invite limit reached');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();

  const inviteMessage = message ||
    `${userData.displayName} wants you to be their Safety Bestie on Besties! Join now: ${APP_URL}?invite=${context.auth.uid}`;

  await sendSMSAlert(recipientPhone, inviteMessage);
  return { success: true };
});
