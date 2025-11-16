const admin = require('firebase-admin');
const { sendNotification } = require('../../utils/messaging');
const { updateUserBadges } = require('../../utils/badges');

/**
 * HTTP Function: Accept bestie request
 */
async function acceptBestieRequest(req, res, config) {
  try {
    // Verify authentication
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const recipientId = decodedToken.uid;

    const { bestieId } = req.body;

    if (!bestieId) {
      return res.status(400).json({ error: 'Bestie ID required' });
    }

    const db = admin.firestore();

    // Get bestie request
    const bestieDoc = await db.collection('besties').doc(bestieId).get();
    
    if (!bestieDoc.exists) {
      return res.status(404).json({ error: 'Bestie request not found' });
    }

    const bestieData = bestieDoc.data();

    // Verify recipient
    if (bestieData.recipientId && bestieData.recipientId !== recipientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update bestie request
    await db.collection('besties').doc(bestieId).update({
      recipientId: recipientId,
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get recipient data
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    const recipientData = recipientDoc.data();

    // Notify requester
    const message = `💜 ${recipientData.displayName} accepted your Bestie request! You're now connected.`;
    await sendNotification(
      bestieData.requesterId,
      message,
      config,
      { type: 'bestie_accepted', bestieId }
    );

    // Update badges for both users
    await updateUserBadges(bestieData.requesterId);
    await updateUserBadges(recipientId);

    // Update stats for both users
    await db.collection('users').doc(bestieData.requesterId).update({
      'stats.totalBesties': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('users').doc(recipientId).update({
      'stats.totalBesties': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log analytics
    await db.collection('analytics').add({
      event: 'bestie_accepted',
      requesterId: bestieData.requesterId,
      recipientId,
      bestieId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Bestie request accepted:', bestieId);

    return res.status(200).json({
      success: true,
      bestieId
    });

  } catch (error) {
    console.error('Error accepting bestie request:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = acceptBestieRequest;
