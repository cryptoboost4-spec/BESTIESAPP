const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { requireAuth, validateId } = require('../../utils/validation');
const { sendPushNotification } = require('../../utils/notifications');
const APP_CONFIG = require('../../utils/appConfig');

const db = admin.firestore();

exports.acceptBestieRequest = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { bestieId } = data;

  // Validate bestieId
  validateId(bestieId, 'bestie ID');

  const bestieRef = db.collection('besties').doc(bestieId);
  const bestie = await bestieRef.get();

  if (!bestie.exists || bestie.data().recipientId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid request');
  }

  const bestieData = bestie.data();
  
  // Prevent duplicate acceptance (idempotency)
  if (bestieData.status === 'accepted') {
    return { success: true, message: 'Bestie request already accepted' };
  }

  // Use transaction to ensure atomicity when updating bestie relationship
  await db.runTransaction(async (transaction) => {
    // Re-read bestie document in transaction
    const bestieSnapshot = await transaction.get(bestieRef);
    const currentBestieData = bestieSnapshot.data();
    
    // Double-check status hasn't changed
    if (currentBestieData.status === 'accepted') {
      return; // Already accepted, exit transaction
    }
    
    // Update bestie status atomically
    transaction.update(bestieRef, {
      status: 'accepted',
      acceptedAt: admin.firestore.Timestamp.now(),
    });
  });

  // Stats are updated by onBestieCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  // Send notification to the requester that their request was accepted
  try {
      const requesterDoc = await db.collection('users').doc(bestieData.requesterId).get();
    const accepterDoc = await db.collection('users').doc(userId).get();
    
    if (requesterDoc.exists) {
      const requesterData = requesterDoc.data();
      const accepterName = accepterDoc.exists ? (accepterDoc.data().displayName || 'Someone') : 'Someone';

      // Create in-app notification
      await db.collection('notifications').add({
        userId: bestieData.requesterId,
        type: 'bestie_accepted',
        title: '🎉 Bestie Request Accepted!',
        message: `${accepterName} accepted your bestie request!`,
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
      });

      // Send push notification if enabled
      if (requesterData.notificationsEnabled && requesterData.fcmToken) {
        await sendPushNotification(
          requesterData.fcmToken,
          '🎉 Bestie Request Accepted!',
          `${accepterName} accepted your bestie request!`,
          {
            type: 'bestie_accepted',
            bestieId: userId,
          }
        );
      }
    }
  } catch (notifError) {
    functions.logger.error('Error sending bestie accepted notification:', notifError);
  }

  return { success: true };
});
