const admin = require('firebase-admin');
const { sendBulkNotifications } = require('../../utils/messaging');

/**
 * Trigger: When a new check-in is created
 * Notifies selected besties and schedules alert
 */
async function onCheckInCreated(snap, context, config) {
  try {
    const checkinId = context.params.checkinId;
    const checkinData = snap.data();
    const userId = checkinData.userId;

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      console.error('User not found:', userId);
      return;
    }

    // Notify besties that check-in started
    const message = `💜 ${userData.displayName} started a check-in. You'll be notified if they don't check in by ${new Date(checkinData.alertTime.toDate()).toLocaleTimeString()}.`;
    
    await sendBulkNotifications(
      checkinData.bestieIds,
      message,
      config,
      { type: 'checkin_started', checkinId }
    );

    // Update user stats
    await admin.firestore().collection('users').doc(userId).update({
      'stats.totalCheckIns': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log analytics
    await admin.firestore().collection('analytics').add({
      event: 'checkin_created',
      userId,
      checkinId,
      bestieCount: checkinData.bestieIds.length,
      duration: checkinData.duration,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Check-in created:', checkinId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error on check-in created:', error);
    throw error;
  }
}

module.exports = onCheckInCreated;
