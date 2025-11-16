const admin = require('firebase-admin');
const { sendBulkNotifications, formatCheckInSafe } = require('../../utils/messaging');
const { updateUserBadges, checkForNewBadge } = require('../../utils/badges');

/**
 * HTTP Function: Mark check-in as complete (I'm Safe!)
 */
async function completeCheckIn(req, res, config) {
  try {
    // Verify authentication
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { checkinId, saveAsTemplate, templateName } = req.body;

    if (!checkinId) {
      return res.status(400).json({ error: 'Check-in ID required' });
    }

    const db = admin.firestore();

    // Get check-in
    const checkinDoc = await db.collection('checkins').doc(checkinId).get();
    
    if (!checkinDoc.exists) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    const checkinData = checkinDoc.data();

    // Verify ownership
    if (checkinData.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to complete this check-in' });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Update check-in status
    await db.collection('checkins').doc(checkinId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If check-in was alerted, notify besties it's a false alarm
    if (checkinData.status === 'alerted') {
      const message = formatCheckInSafe(userData.displayName);
      await sendBulkNotifications(
        checkinData.bestieIds,
        message,
        config,
        { type: 'false_alarm', checkinId }
      );
    }

    // Update user stats
    const previousCheckInCount = userData.stats?.completedCheckIns || 0;
    await db.collection('users').doc(userId).update({
      'stats.completedCheckIns': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check for new badge
    const newBadge = await checkForNewBadge(userId, previousCheckInCount, 'checkins');
    if (newBadge) {
      await updateUserBadges(userId);
    }

    // Save as template if requested
    if (saveAsTemplate && templateName) {
      await db.collection('templates').add({
        userId,
        name: templateName,
        location: checkinData.location,
        duration: checkinData.duration,
        bestieIds: checkinData.bestieIds,
        notes: checkinData.notes,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Log analytics
    await db.collection('analytics').add({
      event: 'checkin_completed',
      userId,
      checkinId,
      duration: checkinData.duration,
      wasAlerted: checkinData.status === 'alerted',
      savedAsTemplate: saveAsTemplate || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Check-in completed:', checkinId);

    return res.status(200).json({
      success: true,
      checkinId,
      newBadge: newBadge || null,
      totalCheckIns: previousCheckInCount + 1
    });

  } catch (error) {
    console.error('Error completing check-in:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = completeCheckIn;
