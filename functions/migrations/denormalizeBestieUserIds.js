/**
 * Migration: Denormalize bestieUserIds into check-in documents
 * 
 * This script adds the bestieUserIds array to all existing check-ins
 * to optimize Firestore security rules performance.
 * 
 * Run this ONCE after deploying the optimized security rules.
 * 
 * Usage:
 *   firebase functions:shell
 *   > const migrate = require('./migrations/denormalizeBestieUserIds');
 *   > migrate.denormalizeBestieUserIds();
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

const db = admin.firestore();

/**
 * Denormalize bestieUserIds for all check-ins
 * Processes in batches to avoid memory issues
 */
async function denormalizeBestieUserIds() {
  const batchSize = 100;
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  functions.logger.info('Starting denormalization of bestieUserIds in check-ins...');

  try {
    // Get all check-ins
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let query = db.collection('checkins')
        .orderBy('createdAt')
        .limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      // Process batch
      const batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const checkIn = doc.data();
        const checkInId = doc.id;

        // Skip if already has bestieUserIds
        if (checkIn.bestieUserIds && Array.isArray(checkIn.bestieUserIds)) {
          skipped++;
          processed++;
          continue;
        }

        try {
          // Get user's bestieUserIds
          const userDoc = await db.collection('users').doc(checkIn.userId).get();
          
          if (!userDoc.exists) {
            functions.logger.warn(`User ${checkIn.userId} not found for check-in ${checkInId}`);
            errors++;
            processed++;
            continue;
          }

          const userData = userDoc.data();
          const bestieUserIds = userData.bestieUserIds || [];

          // Update check-in with denormalized bestieUserIds
          batch.update(doc.ref, {
            bestieUserIds: bestieUserIds,
          });

          batchCount++;
          updated++;

          if (batchCount >= 500) {
            // Firestore batch limit is 500
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          functions.logger.error(`Error processing check-in ${checkInId}:`, error);
          errors++;
        }

        processed++;
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      // Update lastDoc for next iteration
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.docs.length === batchSize;

      functions.logger.info(`Processed ${processed} check-ins (${updated} updated, ${skipped} skipped, ${errors} errors)`);
    }

    functions.logger.info(`Migration complete! Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    
    return {
      success: true,
      processed,
      updated,
      skipped,
      errors,
    };
  } catch (error) {
    functions.logger.error('Migration failed:', error);
    throw error;
  }
}

/**
 * HTTP function to run migration (admin only)
 */
exports.denormalizeBestieUserIds = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const result = await denormalizeBestieUserIds();
    return result;
  } catch (error) {
    functions.logger.error('Migration error:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed', error);
  }
});

// Export for direct use in functions shell
module.exports.denormalizeBestieUserIds = denormalizeBestieUserIds;

