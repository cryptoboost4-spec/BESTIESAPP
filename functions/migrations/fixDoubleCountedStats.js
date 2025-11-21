/**
 * Data Migration: Fix Double-Counted User Stats
 *
 * This script recalculates user stats from source collections to fix
 * the double-counting bug where stats were incremented in both callable
 * functions AND Firestore triggers.
 *
 * Affected stats:
 * - stats.completedCheckIns (was 2x actual value)
 * - stats.alertedCheckIns (was 2x actual value)
 * - stats.totalBesties (was 2x actual value)
 *
 * Run this ONCE after deploying the bugfix.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Recalculate all user stats from source collections
 */
async function fixDoubleCountedStats() {
  console.log('🔄 Starting data migration to fix double-counted stats...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users to process\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // 1. Count completed check-ins from checkins collection
        const completedCheckInsSnapshot = await db.collection('checkins')
          .where('userId', '==', userId)
          .where('status', '==', 'completed')
          .get();
        const realCompletedCheckIns = completedCheckInsSnapshot.size;

        // 2. Count alerted check-ins from checkins collection
        const alertedCheckInsSnapshot = await db.collection('checkins')
          .where('userId', '==', userId)
          .where('status', '==', 'alerted')
          .get();
        const realAlertedCheckIns = alertedCheckInsSnapshot.size;

        // 3. Count total besties from besties collection (both directions)
        const [requestedBestiesSnapshot, receivedBestiesSnapshot] = await Promise.all([
          db.collection('besties')
            .where('requesterId', '==', userId)
            .where('status', '==', 'accepted')
            .get(),
          db.collection('besties')
            .where('recipientId', '==', userId)
            .where('status', '==', 'accepted')
            .get()
        ]);
        const realTotalBesties = requestedBestiesSnapshot.size + receivedBestiesSnapshot.size;

        // Get current (incorrect) values
        const currentCompletedCheckIns = userData.stats?.completedCheckIns || 0;
        const currentAlertedCheckIns = userData.stats?.alertedCheckIns || 0;
        const currentTotalBesties = userData.stats?.totalBesties || 0;

        // Check if values need correction
        const needsUpdate =
          currentCompletedCheckIns !== realCompletedCheckIns ||
          currentAlertedCheckIns !== realAlertedCheckIns ||
          currentTotalBesties !== realTotalBesties;

        if (needsUpdate) {
          // Update user document with correct values
          await userDoc.ref.update({
            'stats.completedCheckIns': realCompletedCheckIns,
            'stats.alertedCheckIns': realAlertedCheckIns,
            'stats.totalBesties': realTotalBesties,
            'stats.migratedAt': admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ Fixed stats for user ${userId}:`);
          console.log(`   completedCheckIns: ${currentCompletedCheckIns} → ${realCompletedCheckIns}`);
          console.log(`   alertedCheckIns: ${currentAlertedCheckIns} → ${realAlertedCheckIns}`);
          console.log(`   totalBesties: ${currentTotalBesties} → ${realTotalBesties}\n`);

          successCount++;
        } else {
          console.log(`⏭️  User ${userId} already has correct stats\n`);
        }

      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errors.push({ userId, error: error.message });
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${usersSnapshot.size}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️  Already correct: ${usersSnapshot.size - successCount - errorCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ userId, error }) => {
        console.log(`   - User ${userId}: ${error}`);
      });
    }

    console.log('\n✨ Migration complete!\n');

    return {
      success: true,
      totalUsers: usersSnapshot.size,
      updated: successCount,
      alreadyCorrect: usersSnapshot.size - successCount - errorCount,
      errors: errorCount,
      errorDetails: errors,
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Export for Cloud Functions
exports.fixDoubleCountedStats = fixDoubleCountedStats;

// Allow running directly with Node.js
if (require.main === module) {
  fixDoubleCountedStats()
    .then((result) => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}
