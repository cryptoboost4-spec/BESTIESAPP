const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendCascadingAlert } = require('../../utils/notifications');

const db = admin.firestore();

// Check for cascading alert escalation every minute
exports.checkCascadingAlertEscalation = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const oneMinuteAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 1000)
    );

    // Find alerted check-ins with current notified bestie that haven't been acknowledged in 1 minute
    const checkInsSnapshot = await db.collection('checkins')
      .where('status', '==', 'alerted')
      .where('currentNotifiedBestie', '!=', null)
      .where('currentNotificationSentAt', '<=', oneMinuteAgo)
      .get();

    const escalations = [];

    for (const doc of checkInsSnapshot.docs) {
      const checkIn = doc.data();
      const checkInId = doc.id;

      // Check if current bestie has acknowledged
      const acknowledgedBy = checkIn.acknowledgedBy || [];
      if (acknowledgedBy.includes(checkIn.currentNotifiedBestie)) {
        // Current bestie acknowledged, stop escalation
        await doc.ref.update({
          currentNotifiedBestie: null,
          currentNotificationSentAt: null,
        });
        continue;
      }

      // Find next bestie to notify
      const notifiedHistory = checkIn.notifiedBestieHistory || [];
      const allBesties = checkIn.bestieIds || [];
      const remainingBesties = allBesties.filter(id => !notifiedHistory.includes(id));

      if (remainingBesties.length === 0) {
        // All besties have been notified, stop escalation
        functions.logger.info(`All besties notified for check-in ${checkInId}, no more escalation`);
        await doc.ref.update({
          currentNotifiedBestie: null,
          currentNotificationSentAt: null,
        });
        continue;
      }

      // Escalate to next bestie
      const nextBestieId = remainingBesties[0];

      await doc.ref.update({
        currentNotifiedBestie: nextBestieId,
        currentNotificationSentAt: now,
        notifiedBestieHistory: admin.firestore.FieldValue.arrayUnion(nextBestieId),
      });

      // Send notification to next bestie
      const userDoc = await db.collection('users').doc(checkIn.userId).get();
      const userData = userDoc.data();

      escalations.push(sendCascadingAlert(checkInId, checkIn, nextBestieId, userData));

      functions.logger.info(`Escalated check-in ${checkInId} to bestie ${nextBestieId} (${notifiedHistory.length + 1}/${allBesties.length})`);
    }

    await Promise.all(escalations);

    functions.logger.info(`Processed ${checkInsSnapshot.size} check-ins for escalation, escalated ${escalations.length}`);
    return null;
  });
