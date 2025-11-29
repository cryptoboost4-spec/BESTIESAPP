const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Fix double-counted user stats (Admin only)
 * Recalculates stats.completedCheckIns, stats.alertedCheckIns, and stats.totalBesties
 * from source collections to fix the double-counting bug.
 */
exports.fixDoubleCountedStats = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  functions.logger.info('🔄 Starting data migration to fix double-counted stats...');

  try {
    const { fixDoubleCountedStats } = require('../../migrations/fixDoubleCountedStats');
    const result = await fixDoubleCountedStats();

    return {
      success: true,
      message: 'Stats migration completed successfully',
      ...result,
    };
  } catch (error) {
    functions.logger.error('❌ Migration failed:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed: ' + error.message);
  }
});
