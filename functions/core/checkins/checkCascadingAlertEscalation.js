const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendCascadingAlert } = require('../../utils/notifications');

const db = admin.firestore();

/**
 * Check for cascading alert escalation with exponential backoff
 * Intervals: 1min → 3min → 5min → 10min → 15min
 */
async function checkCascadingAlertEscalationLogic() {
  const now = admin.firestore.Timestamp.now();

  // Exponential backoff intervals in seconds: [60, 180, 300, 600, 900] = 1min, 3min, 5min, 10min, 15min
  const ESCALATION_INTERVALS = [60, 180, 300, 600, 900];

  // Find alerted check-ins with next escalation time reached
  const checkInsSnapshot = await db.collection('checkins')
    .where('status', '==', 'alerted')
    .where('currentNotifiedBestie', '!=', null)
    .where('nextEscalationTime', '<=', now)
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
        nextEscalationTime: null,
      });
      continue;
    }

    // Get current escalation level (default to 0 if not set)
    const escalationLevel = checkIn.escalationLevel || 0;

    // Stop escalation if we've reached the maximum level (4 = 15min interval)
    if (escalationLevel >= ESCALATION_INTERVALS.length - 1) {
      functions.logger.info(`Max escalation level reached for check-in ${checkInId}, stopping escalation`);
      await doc.ref.update({
        currentNotifiedBestie: null,
        currentNotificationSentAt: null,
        nextEscalationTime: null,
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
        nextEscalationTime: null,
      });
      continue;
    }

    // Escalate to next bestie
    const nextBestieId = remainingBesties[0];
    const nextEscalationLevel = escalationLevel + 1;
    const intervalSeconds = ESCALATION_INTERVALS[nextEscalationLevel];
    const nextEscalationTime = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() + intervalSeconds * 1000)
    );

    await doc.ref.update({
      currentNotifiedBestie: nextBestieId,
      currentNotificationSentAt: now,
      escalationLevel: nextEscalationLevel,
      nextEscalationTime: nextEscalationTime,
      notifiedBestieHistory: admin.firestore.FieldValue.arrayUnion(nextBestieId),
    });

    // Send notification to next bestie
    const userDoc = await db.collection('users').doc(checkIn.userId).get();
    const userData = userDoc.data();

    escalations.push(sendCascadingAlert(checkInId, checkIn, nextBestieId, userData));

    functions.logger.info(`Escalated check-in ${checkInId} to bestie ${nextBestieId} (level ${nextEscalationLevel}, ${intervalSeconds}s interval, ${notifiedHistory.length + 1}/${allBesties.length})`);
  }

  await Promise.all(escalations);

  functions.logger.info(`Processed ${checkInsSnapshot.size} check-ins for escalation, escalated ${escalations.length}`);
  return {
    success: true,
    processed: checkInsSnapshot.size,
    escalated: escalations.length
  };
}

module.exports = checkCascadingAlertEscalationLogic;
