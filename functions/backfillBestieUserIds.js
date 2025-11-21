const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

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
  console.log('🚀 Starting bestieUserIds backfill...\n');

  try {
    // Get all accepted besties
    const bestiesSnapshot = await db.collection('besties')
      .where('status', '==', 'accepted')
      .get();

    console.log(`📊 Found ${bestiesSnapshot.size} accepted bestie relationships\n`);

    if (bestiesSnapshot.empty) {
      console.log('✅ No besties to process. Done!');
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
        console.log(`⚠️  Skipping ${doc.id}: Missing requester or recipient ID`);
        skipped++;
        continue;
      }

      try {
        console.log(`Processing ${processed}/${bestiesSnapshot.size}: ${doc.id}`);
        console.log(`  Requester: ${bestie.requesterId}`);
        console.log(`  Recipient: ${bestie.recipientId}`);

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

        console.log(`  ✅ Updated both users\n`);
        updated++;

      } catch (error) {
        console.error(`  ❌ Error processing ${doc.id}:`, error.message);
        errors.push({
          bestieId: doc.id,
          requesterId: bestie.requesterId,
          recipientId: bestie.recipientId,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total besties processed: ${processed}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Skipped (missing data): ${skipped}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  - Bestie ${err.bestieId}: ${err.error}`);
      });
    }

    console.log('\n✅ Backfill complete!');

    return {
      success: errors.length === 0,
      processed,
      updated,
      skipped,
      errors
    };

  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    throw error;
  }
}

// Export as Cloud Function (can be triggered via HTTP)
exports.backfillBestieUserIds = async (req, res) => {
  try {
    const result = await backfillBestieUserIds();
    res.status(200).json({
      message: 'Backfill completed',
      ...result
    });
  } catch (error) {
    console.error('Error in backfill function:', error);
    res.status(500).json({
      error: 'Backfill failed',
      message: error.message
    });
  }
};

// Allow running directly as a script
if (require.main === module) {
  backfillBestieUserIds()
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillBestieUserIds };
