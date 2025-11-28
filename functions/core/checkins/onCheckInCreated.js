const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { notifyBestiesAboutCheckIn, sendMessengerContactNotifications, formatCheckInNotification } = require('../../utils/checkInNotifications');

const db = admin.firestore();

// Track when check-ins are created
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();

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
        console.error('Error notifying besties about check-in creation:', error);
        // Don't fail the whole function if notifications fail
      }
    }

    // Notify messenger contacts about new check-in
    if (checkIn.messengerContactIds && checkIn.messengerContactIds.length > 0) {
      try {
        // Get user data for message formatting
        const userDoc = await db.collection('users').doc(checkIn.userId).get();
        const userName = userDoc.exists ? (userDoc.data().displayName || 'Your friend') : 'Your friend';

        // Format the notification message
        const message = formatCheckInNotification('checkInCreated', userName, checkIn);

        // Send to all messenger contacts
        await sendMessengerContactNotifications(checkIn.userId, message);
        console.log(`✅ Messenger notifications sent for check-in creation to ${checkIn.messengerContactIds.length} contacts`);
      } catch (error) {
        console.error('Error notifying messenger contacts about check-in creation:', error);
        // Don't fail the whole function if notifications fail
      }
    }
  });
