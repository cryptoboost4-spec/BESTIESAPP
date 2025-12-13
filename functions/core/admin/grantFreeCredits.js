const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { grantFreeCredits } = require('../../utils/smsCredits');

const db = admin.firestore();

/**
 * Admin-only function to grant free SMS credits
 * Usage: Call from Firebase console with { userId: 'abc123', amount: 5 }
 */
exports.grantFreeSmsCredits = functions.https.onCall(async (data, context) => {
  // Check if caller is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const isAdmin = callerDoc.data()?.isAdmin === true;

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { userId, amount } = data;

  if (!userId || !amount || amount <= 0 || amount > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Must provide userId and amount (1-100)'
    );
  }

  // Grant credits
  await grantFreeCredits(userId, amount);

  // Log admin action
  await db.collection('admin_actions').add({
    adminId: context.auth.uid,
    action: 'grant_free_sms_credits',
    targetUserId: userId,
    amount: amount,
    timestamp: admin.firestore.Timestamp.now()
  });

  functions.logger.info('Free SMS credits granted', {
    adminId: context.auth.uid,
    userId,
    amount
  });

  return { success: true, message: `Granted ${amount} free SMS credits to ${userId}` };
});



