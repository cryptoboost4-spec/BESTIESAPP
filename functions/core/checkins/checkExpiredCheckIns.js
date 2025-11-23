const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendAlertToBesties, logAlertEvent } = require('../../utils/notifications');

const db = admin.firestore();

// Monitor check-ins every minute (CRON)
exports.checkExpiredCheckIns = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const checkInsSnapshot = await db.collection('checkins')
      .where('status', '==', 'active')
      .where('alertTime', '<=', now)
      .get();

    const alerts = [];

    for (const doc of checkInsSnapshot.docs) {
      const checkIn = doc.data();

      await doc.ref.update({
        status: 'alerted',
        alertedAt: now,
      });

      // Stats are updated by onCheckInCountUpdate trigger - no need to update here
      // (Removed duplicate increment to fix double-counting bug)

      alerts.push(sendAlertToBesties(doc.id, checkIn));
      await logAlertEvent(doc.id, checkIn);
    }

    await Promise.all(alerts);

    console.log(`Processed ${checkInsSnapshot.size} expired check-ins`);
    return null;
  });
