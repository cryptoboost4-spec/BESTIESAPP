const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Clean up old data based on user preferences
exports.cleanupOldData = functions.pubsub
  .schedule('0 3 * * *') // Run daily at 3:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    functions.logger.info('Starting data cleanup...');

    const now = admin.firestore.Timestamp.now();
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    let deletedCheckIns = 0;
    let deletedSOS = 0;
    let deletedPhotos = 0;

    try {
      // Get all users who DON'T have holdData enabled
      const usersSnapshot = await db.collection('users')
        .where('settings.holdData', '!=', true)
        .get();

      const userIds = usersSnapshot.docs.map(doc => doc.id);

      // Add users without settings field at all
      const usersWithoutSettings = await db.collection('users')
        .where('settings', '==', null)
        .get();

      userIds.push(...usersWithoutSettings.docs.map(doc => doc.id));

      functions.logger.info(`Found ${userIds.length} users without data retention enabled`);

      // Delete old check-ins
      for (const userId of userIds) {
        const oldCheckIns = await db.collection('checkins')
          .where('userId', '==', userId)
          .where('createdAt', '<', sevenDaysAgo)
          .get();

        for (const doc of oldCheckIns.docs) {
          const checkInData = doc.data();

          // Delete associated photo if exists
          if (checkInData.photoURL) {
            try {
              // Extract storage path from URL
              const photoPath = checkInData.photoURL.split('/o/')[1]?.split('?')[0];
              if (photoPath) {
                const decodedPath = decodeURIComponent(photoPath);
                await admin.storage().bucket().file(decodedPath).delete();
                deletedPhotos++;
              }
            } catch (photoError) {
              functions.logger.error('Error deleting photo:', photoError);
            }
          }

          await doc.ref.delete();
          deletedCheckIns++;
        }

        // Delete old emergency SOS
        const oldSOS = await db.collection('emergency_sos')
          .where('userId', '==', userId)
          .where('createdAt', '<', sevenDaysAgo)
          .get();

        for (const doc of oldSOS.docs) {
          await doc.ref.delete();
          deletedSOS++;
        }
      }

      functions.logger.info(`Cleanup complete: ${deletedCheckIns} check-ins, ${deletedSOS} SOS, ${deletedPhotos} photos deleted`);

      return {
        success: true,
        deletedCheckIns,
        deletedSOS,
        deletedPhotos,
      };
    } catch (error) {
      functions.logger.error('Error during cleanup:', error);
      return { success: false, error: error.message };
    }
  });
