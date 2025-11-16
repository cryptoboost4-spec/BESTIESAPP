const admin = require('firebase-admin');
const { sendBulkNotifications, formatCheckInAlert } = require('../../utils/messaging');

/**
 * Scheduled function: Runs every minute
 * Checks for expired check-ins and alerts besties
 */
async function checkExpiredCheckIns(config) {
  try {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    // Find all active check-ins that have expired
    const expiredSnapshot = await db.collection('checkins')
      .where('status', '==', 'active')
      .where('alertTime', '<=', now)
      .get();

    if (expiredSnapshot.empty) {
      console.log('No expired check-ins found');
      return { success: true, count: 0 };
    }

    console.log(`Found ${expiredSnapshot.size} expired check-ins`);

    // Process each expired check-in
    const promises = expiredSnapshot.docs.map(async (doc) => {
      const checkinId = doc.id;
      const checkinData = doc.data();
      const userId = checkinData.userId;

      try {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
          console.error('User not found for check-in:', checkinId);
          return;
        }

        // Format alert message
        const message = formatCheckInAlert(
          userData.displayName,
          checkinData.location,
          checkinData.notes
        );

        // Send alerts to all besties
        await sendBulkNotifications(
          checkinData.bestieIds,
          message,
          config,
          {
            type: 'checkin_alert',
            checkinId,
            userId,
            location: checkinData.location,
            notes: checkinData.notes,
            lastUpdate: checkinData.lastUpdate
          }
        );

        // Update check-in status
        await db.collection('checkins').doc(checkinId).update({
          status: 'alerted',
          alertedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log analytics
        await db.collection('analytics').add({
          event: 'checkin_alert_triggered',
          userId,
          checkinId,
          bestieCount: checkinData.bestieIds.length,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('Alert sent for check-in:', checkinId);

      } catch (error) {
        console.error('Error processing expired check-in:', checkinId, error);
      }
    });

    await Promise.all(promises);

    return {
      success: true,
      count: expiredSnapshot.size
    };

  } catch (error) {
    console.error('Error checking expired check-ins:', error);
    throw error;
  }
}

module.exports = checkExpiredCheckIns;
