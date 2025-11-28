const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// One-time backfill to populate bestieUserIds for existing besties
const { backfillBestieUserIds } = require('../../backfillBestieUserIds');

exports.backfillBestieUserIds = functions.https.onCall(async (data, context) => {
  // Require admin privileges for security
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check if user is admin
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin to run backfill');
  }

  console.log(`🔧 Backfill triggered by admin: ${context.auth.uid}`);

  try {
    const result = await backfillBestieUserIds();
    return {
      success: true,
      message: 'Backfill completed successfully',
      ...result
    };
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw new functions.https.HttpsError('internal', 'Backfill failed: ' + error.message);
  }
});
