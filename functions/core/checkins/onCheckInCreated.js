const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');

const db = admin.firestore();

// Track when check-ins are created
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();
    const checkInId = context.params.checkInId;

    try {
      // Denormalize bestieUserIds for security rules optimization
      // Get user's bestieUserIds array to include in check-in document
      let bestieUserIds = [];
      if (checkIn.bestieIds && checkIn.bestieIds.length > 0) {
        // Get user document to fetch bestieUserIds
        const userDoc = await db.collection('users').doc(checkIn.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          bestieUserIds = userData.bestieUserIds || [];
        }
      }

      // Update check-in with denormalized bestieUserIds (if not already present)
      // This allows security rules to check permissions without expensive get() calls
      if (bestieUserIds.length > 0) {
        await snap.ref.update({
          bestieUserIds: bestieUserIds,
        });
      }

      // Increment total check-in count in user stats
      await db.collection('users').doc(checkIn.userId).update({
        'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
      });

      // Update analytics cache (real-time global stats)
      const cacheRef = db.collection('analytics_cache').doc('realtime');
      await cacheRef.set({
        totalCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Notify besties about new check-in (via free channels only)
      if (checkIn.bestieIds && checkIn.bestieIds.length > 0) {
        try {
          await notifyBestiesAboutCheckIn(
            checkIn.userId,
            checkIn.bestieIds,
            'checkInCreated',
            checkIn
          );
        } catch (error) {
          functions.logger.error('Error notifying besties about check-in creation:', error);
          // Don't fail the whole function if notifications fail
        }
      }

      // Notify selected messenger contacts about new check-in
      if (checkIn.messengerContactIds && checkIn.messengerContactIds.length > 0) {
        try {
          const { sendMessengerContactNotifications } = require('../../utils/checkInNotifications');
          const userDoc = await db.collection('users').doc(checkIn.userId).get();
          const userData = userDoc.data();
          const userName = userData?.displayName || 'Your bestie';
          const message = `👀 ${userName} just started a check-in - they're at ${checkIn.location || 'a location'} for the next ${checkIn.duration} mins`;
          
          // Send to only the selected messenger contacts
          await sendMessengerContactNotifications(
            checkIn.userId,
            message,
            checkIn.messengerContactIds
          );
        } catch (error) {
          functions.logger.error('Error notifying messenger contacts about check-in creation:', error);
          // Don't fail the whole function if notifications fail
        }
      }
    } catch (error) {
      functions.logger.error(`Error in onCheckInCreated for ${checkInId}:`, error);
      // Don't throw - allow check-in to be created even if denormalization fails
    }
  });
