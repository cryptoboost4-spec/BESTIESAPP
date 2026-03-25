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
    
    const requesterRef = db.collection('users').doc(currentBestieData.requesterId);
    const recipientRef = db.collection('users').doc(currentBestieData.recipientId);
    
    // Update bestie status atomically
    // isFavorite: true by default — all accepted besties are in your emergency circle
    transaction.update(bestieRef, {
      status: 'accepted',
      acceptedAt: admin.firestore.Timestamp.now(),
      isFavorite: true,
    });
    
    // CRITICAL: Update bestieUserIds synchronously in transaction to prevent race condition
    // This ensures permissions work immediately when frontend tries to read user documents
    // Note: stats.totalBesties is updated by onBestieCountUpdate trigger (single source of truth)
    transaction.update(requesterRef, {
      bestieUserIds: admin.firestore.FieldValue.arrayUnion(currentBestieData.recipientId)
    });
    
    transaction.update(recipientRef, {
      bestieUserIds: admin.firestore.FieldValue.arrayUnion(currentBestieData.requesterId)
    });
  });

  // Note: featuredCircle and badges are still updated by onBestieCountUpdate trigger
  // to avoid making the transaction too large

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
