const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn } = require('../../utils/checkInNotifications');
const { updateUserBadges } = require('../../utils/badges');

const db = admin.firestore();

// Track when check-ins are created
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();
    const checkInId = context.params.checkInId;

    try {
      // Get user document once (needed for both bestieUserIds and firstCheckInDate)
      const userRef = db.collection('users').doc(checkIn.userId);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Denormalize bestieUserIds for security rules optimization
      // Get user's bestieUserIds array to include in check-in document
      let bestieUserIds = [];
      if (checkIn.bestieIds && checkIn.bestieIds.length > 0 && userData) {
        bestieUserIds = userData.bestieUserIds || [];
      }

      // Update check-in with denormalized bestieUserIds (if not already present)
      // This allows security rules to check permissions without expensive get() calls
      if (bestieUserIds.length > 0) {
        await snap.ref.update({
          bestieUserIds: bestieUserIds,
        });
      }

      // Skip stats updates for test check-ins
      if (checkIn.isTest === true) {
        return;
      }
      
      // Prepare update object
      const statsUpdate = {
        'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
      };
      
      // Set firstCheckInDate if this is the user's first check-in
      if (!userData?.stats?.firstCheckInDate) {
        statsUpdate['stats.firstCheckInDate'] = checkIn.createdAt || admin.firestore.Timestamp.now();
      }

      // Increment total check-in count in user stats (and set firstCheckInDate if needed)
      await userRef.update(statsUpdate);

      // Track time-based badges
      const checkInTime = checkIn.createdAt ? checkIn.createdAt.toDate() : new Date();
      const hour = checkInTime.getHours();

      // Early Bird: 4 AM - 6 AM
      if (hour >= 4 && hour < 6 && !userData?.stats?.earlyBird) {
        await userRef.update({ 'stats.earlyBird': true });
        // Update badges after setting earlyBird
        await updateUserBadges(checkIn.userId);
      }

      // Night Owl: 10 PM - 4 AM (22:00 - 04:00)
      if ((hour >= 22 || hour < 4) && !userData?.stats?.nightOwl) {
        await userRef.update({ 'stats.nightOwl': true });
        // Update badges after setting nightOwl
        await updateUserBadges(checkIn.userId);
      }

      // Update analytics cache (real-time global stats)
      const cacheRef = db.collection('analytics_cache').doc('realtime');
      await cacheRef.set({
        totalCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Notify besties about new check-in (via free channels only)
      // Also handles messenger contacts if provided
      if ((checkIn.bestieIds && checkIn.bestieIds.length > 0) || (checkIn.messengerContactIds && checkIn.messengerContactIds.length > 0)) {
        try {
          await notifyBestiesAboutCheckIn(
            checkIn.userId,
            checkIn.bestieIds || [],
            'checkInCreated',
            checkIn,
            checkIn.messengerContactIds || []
          );
        } catch (error) {
          functions.logger.error('Error notifying besties about check-in creation:', error);
          // Don't fail the whole function if notifications fail
        }
      }
    } catch (error) {
      functions.logger.error(`Error in onCheckInCreated for ${checkInId}:`, error);
      // Don't throw - allow check-in to be created even if denormalization fails
    }
  });
