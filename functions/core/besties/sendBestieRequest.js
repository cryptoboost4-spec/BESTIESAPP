const admin = require('firebase-admin');
const { sendNotification, formatBestieRequest } = require('../../utils/messaging');

/**
 * HTTP Function: Send bestie request
 */
async function sendBestieRequest(req, res, config) {
  try {
    // Verify authentication
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const requesterId = decodedToken.uid;

    const { recipientPhone, recipientName, personalMessage } = req.body;

    if (!recipientPhone || !recipientName) {
      return res.status(400).json({ error: 'Recipient phone and name required' });
    }

    const db = admin.firestore();

    // Get requester data
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    const requesterData = requesterDoc.data();

    // Check if recipient already has account
    let recipientId = null;
    const userSnapshot = await db.collection('users')
      .where('phoneNumber', '==', recipientPhone)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      recipientId = userSnapshot.docs[0].id;
    }

    // Create bestie request
    const bestieDoc = await db.collection('besties').add({
      requesterId,
      requesterName: requesterData.displayName,
      requesterPhone: requesterData.phoneNumber,
      recipientId: recipientId || null,
      recipientPhone,
      recipientName,
      status: recipientId ? 'pending' : 'invited',
      personalMessage: personalMessage || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Format message
    const message = personalMessage || formatBestieRequest(
      requesterData.displayName,
      config.app.url
    );

    // Send notification
    if (recipientId) {
      // Recipient has account - send in-app notification
      await sendNotification(
        recipientId,
        message,
        config,
        { type: 'bestie_request', bestieId: bestieDoc.id }
      );
    } else {
      // Recipient doesn't have account - send SMS/WhatsApp with signup link
      const twilioClient = require('twilio')(
        config.twilio.account_sid,
        config.twilio.auth_token
      );

      const signupMessage = `${message}\n\nSign up: ${config.app.url}/signup?ref=${bestieDoc.id}`;

      try {
        // Try WhatsApp first
        await twilioClient.messages.create({
          from: `whatsapp:${config.twilio.phone_number}`,
          to: `whatsapp:${recipientPhone}`,
          body: signupMessage
        });
      } catch (whatsappError) {
        // Fall back to SMS
        await twilioClient.messages.create({
          from: config.twilio.phone_number,
          to: recipientPhone,
          body: signupMessage
        });
      }
    }

    // Log analytics
    await db.collection('analytics').add({
      event: 'bestie_request_sent',
      requesterId,
      recipientHasAccount: !!recipientId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Bestie request sent:', bestieDoc.id);

    return res.status(200).json({
      success: true,
      bestieId: bestieDoc.id,
      recipientHasAccount: !!recipientId
    });

  } catch (error) {
    console.error('Error sending bestie request:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = sendBestieRequest;
