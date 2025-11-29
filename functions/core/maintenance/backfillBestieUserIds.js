const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Backfill script to populate bestieUserIds arrays for all existing besties
 *
 * This fixes the issue where besties created via invite link (onCreate)
 * didn't have their bestieUserIds arrays populated because the onCreate
 * Cloud Function didn't exist yet.
 *
 * Safe to run multiple times - uses arrayUnion which won't duplicate entries.
 */
async function backfillBestieUserIds() {
  functions.logger.info('🚀 Starting bestieUserIds backfill...\n');

  try {
    // Get all accepted besties
    const bestiesSnapshot = await db.collection('besties')
      .where('status', '==', 'accepted')
      .get();

    functions.logger.info(`📊 Found ${bestiesSnapshot.size} accepted bestie relationships\n`);

    if (bestiesSnapshot.empty) {
      functions.logger.info('✅ No besties to process. Done!');
      return { success: true, processed: 0, errors: [] };
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Process each bestie relationship
    for (const doc of bestiesSnapshot.docs) {
      const bestie = doc.data();
      processed++;

      // Validate data
      if (!bestie.requesterId || !bestie.recipientId) {
        functions.logger.warn(`⚠️  Skipping ${doc.id}: Missing requester or recipient ID`);
        skipped++;
        continue;
      }

      try {
        functions.logger.info(`Processing ${processed}/${bestiesSnapshot.size}: ${doc.id}`);
        functions.logger.info(`  Requester: ${bestie.requesterId}`);
        functions.logger.info(`  Recipient: ${bestie.recipientId}`);

        // Update both users' bestieUserIds arrays
        // arrayUnion prevents duplicates, so safe to run multiple times
        const batch = db.batch();

        const requesterRef = db.collection('users').doc(bestie.requesterId);
        const recipientRef = db.collection('users').doc(bestie.recipientId);

        batch.update(requesterRef, {
          bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.recipientId)
        });

        batch.update(recipientRef, {
          bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.requesterId)
        });

        await batch.commit();

        functions.logger.info(`  ✅ Updated both users\n`);
        updated++;

      } catch (error) {
        functions.logger.error(`  ❌ Error processing ${doc.id}:`, error.message);
        errors.push({
          bestieId: doc.id,
          requesterId: bestie.requesterId,
          recipientId: bestie.recipientId,
          error: error.message
        });
      }
    }

    // Summary
    functions.logger.info('\n' + '='.repeat(60));
    functions.logger.info('📋 BACKFILL SUMMARY');
    functions.logger.info('='.repeat(60));
    functions.logger.info(`Total besties processed: ${processed}`);
    functions.logger.info(`Successfully updated: ${updated}`);
    functions.logger.info(`Skipped (missing data): ${skipped}`);
    functions.logger.info(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      functions.logger.error('\n❌ Errors encountered:');
      errors.forEach(err => {
        functions.logger.error(`  - Bestie ${err.bestieId}: ${err.error}`);
      });
    }

    functions.logger.info('\n✅ Backfill complete!');

    return {
      success: errors.length === 0,
      processed,
      updated,
      skipped,
      errors
    };

  } catch (error) {
    functions.logger.error('💥 Fatal error during backfill:', error);
    throw error;
  }
}

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

  functions.logger.info(`🔧 Backfill triggered by admin: ${context.auth.uid}`);

  try {
    const result = await backfillBestieUserIds();
    return {
      success: true,
      message: 'Backfill completed successfully',
      ...result
    };
  } catch (error) {
    functions.logger.error('❌ Backfill failed:', error);
    throw new functions.https.HttpsError('internal', 'Backfill failed: ' + error.message);
  }
});
