const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendNotification } = require('../../utils/notifications');

const db = admin.firestore();

/**
 * Triggered when a new message is created in bestie_messages collection
 * Validates rate limiting, sends notifications, and updates stats
 */
exports.onMessageCreated = functions.firestore
  .document('bestie_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;

    try {
      // Validate rate limiting (1 message per day per bestie)
      const senderId = message.senderId;
      const recipientId = message.recipientId;

      // Get start of today in UTC
      const now = admin.firestore.Timestamp.now();
      const today = new Date(now.toMillis());
      today.setUTCHours(0, 0, 0, 0);
      const startOfToday = admin.firestore.Timestamp.fromDate(today);

      // Check if sender has already sent a message to this recipient today
      const existingMessagesQuery = await db.collection('bestie_messages')
        .where('senderId', '==', senderId)
        .where('recipientId', '==', recipientId)
        .where('sentAt', '>=', startOfToday)
        .limit(1)
        .get();

      // If there's already a message today (and it's not this one), delete this message
      if (!existingMessagesQuery.empty) {
        const existingMessage = existingMessagesQuery.docs[0];
        if (existingMessage.id !== messageId) {
          // Rate limit exceeded - delete this message
          await snap.ref.delete();
          functions.logger.warn(`Rate limit exceeded: ${senderId} tried to send multiple messages to ${recipientId} today`);
          return;
        }
      }

      // Get sender and recipient user data
      const [senderDoc, recipientDoc] = await Promise.all([
        db.collection('users').doc(senderId).get(),
        db.collection('users').doc(recipientId).get(),
      ]);

      if (!senderDoc.exists || !recipientDoc.exists) {
        functions.logger.error(`User not found: sender=${senderId}, recipient=${recipientId}`);
        return;
      }

      const senderData = senderDoc.data();
      const recipientData = recipientDoc.data();

      // Create notification document
      const notificationMessage = `${senderData.displayName || 'A bestie'} sent you a message: "${message.messageText.substring(0, 50)}${message.messageText.length > 50 ? '...' : ''}"`;

      await db.collection('notifications').add({
        userId: recipientId,
        type: 'bestie_message',
        title: '💬 New Message',
        message: notificationMessage,
        messageId: messageId,
        senderId: senderId,
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
        data: {
          deepLink: `besties://messages?senderId=${senderId}&messageId=${messageId}`
        }
      });

      // Send push notification if recipient has FCM token
      try {
        const recipientDoc = await db.collection('users').doc(recipientId).get();
        const recipientData = recipientDoc.data();
        const fcmToken = recipientData?.fcmToken;

        if (fcmToken) {
          const { sendPushNotification } = require('../../utils/notifications');
          await sendPushNotification(
            fcmToken,
            '💬 New Message',
            notificationMessage,
            {
              type: 'bestie_message',
              messageId: messageId,
              senderId: senderId,
              deepLink: `besties://messages?senderId=${senderId}&messageId=${messageId}`
            }
          );
        }
      } catch (pushError) {
        functions.logger.warn('Failed to send push notification for message:', pushError);
        // Don't fail the whole function if push fails
      }

      // Create interaction record for connection strength
      await db.collection('interactions').add({
        userId: senderId,
        bestieId: recipientId,
        type: 'support_message',
        createdAt: admin.firestore.Timestamp.now(),
        metadata: {
          messageId: messageId,
          contextType: message.contextType || 'spontaneous'
        }
      });

      // Update stats (messagesExchangedThisWeek will be calculated in daily aggregation)
      // For now, we'll just log that a message was sent
      functions.logger.info(`Message sent: ${senderId} -> ${recipientId}`);

      // Update challenge progress (if applicable)
      // Note: For messages_exchanged metric, we need to check if the other user also sent a message
      // For simplicity, we'll update progress for the sender only
      // The challenge completion logic will handle the "both users" requirement
      try {
        const { updateChallengeProgress } = require('../challenges/updateChallengeProgress');
        await updateChallengeProgress(senderId, 'messages_exchanged');
      } catch (error) {
        functions.logger.warn('Error updating challenge progress for message:', error);
        // Don't fail the whole function if challenge update fails
      }

    } catch (error) {
      functions.logger.error('Error in onMessageCreated:', error);
      // Don't throw - message is already created, we just failed to process it
    }
  });

