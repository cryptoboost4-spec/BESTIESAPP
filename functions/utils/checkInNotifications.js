const admin = require('firebase-admin');
const axios = require('axios');
const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(functions.config().sendgrid?.api_key);

/**
 * Configuration for check-in notification types
 * These can be toggled on/off in the future
 */
const NOTIFICATION_CONFIG = {
  checkInCreated: true,
  checkInExtended: true,
  checkInCompleted: true,
  checkInUpdated: true,
  checkInExpired: true, // Already implemented in checkExpiredCheckIns
};

/**
 * Send check-in update notifications to besties via FREE channels only
 * (Telegram, Email, Messenger contacts)
 *
 * @param {string} userId - User who owns the check-in
 * @param {string[]} bestieIds - Array of bestie user IDs
 * @param {string} notificationType - Type of notification (created, extended, completed, updated)
 * @param {object} checkInData - Check-in data
 */
async function notifyBestiesAboutCheckIn(userId, bestieIds, notificationType, checkInData) {
  // Check if this notification type is enabled
  if (!NOTIFICATION_CONFIG[notificationType]) {
    console.log(`Notification type ${notificationType} is disabled, skipping`);
    return;
  }

  try {
    const db = admin.firestore();

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return;
    }

    const userData = userDoc.data();
    const userName = userData.displayName || 'Your bestie';

    // Format message based on notification type
    const message = formatCheckInNotification(notificationType, userName, checkInData);

    // Send messenger notifications once (not per bestie to avoid duplicates)
    if (notificationType === 'checkInCreated' || notificationType === 'checkInExtended') {
      await sendMessengerContactNotifications(userId, message);
    }

    // Send to each bestie via their enabled free channels
    const notificationPromises = bestieIds.map(async (bestieId) => {
      try {
        const bestieDoc = await db.collection('users').doc(bestieId).get();
        if (!bestieDoc.exists) {
          console.log(`Bestie ${bestieId} not found`);
          return;
        }

        const bestieData = bestieDoc.data();
        const channelResults = [];

        // 1. Send via Telegram (if bestie has it connected and enabled)
        if (bestieData.notificationPreferences?.telegram && bestieData.telegramChatId) {
          try {
            await sendTelegramNotification(bestieData.telegramChatId, message);
            channelResults.push({ channel: 'telegram', success: true });
            console.log(`✅ Telegram sent to bestie ${bestieId}`);
          } catch (error) {
            console.error(`❌ Telegram failed for bestie ${bestieId}:`, error.message);
            channelResults.push({ channel: 'telegram', success: false, error: error.message });
          }
        }

        // 2. Send via Email (if bestie has email enabled)
        if (bestieData.notificationPreferences?.email && bestieData.email) {
          try {
            await sendEmailNotification(bestieData.email, userName, notificationType, checkInData);
            channelResults.push({ channel: 'email', success: true });
            console.log(`✅ Email sent to bestie ${bestieId}`);
          } catch (error) {
            console.error(`❌ Email failed for bestie ${bestieId}:`, error.message);
            channelResults.push({ channel: 'email', success: false, error: error.message });
          }
        }

        // 3. Send via Messenger (if they have active messenger contacts for this user)
        // Note: For check-in updates, we send to the user's messenger contacts (not the bestie's contacts)
        // This is because messenger contacts are people who want alerts about THIS user
        // NOTE: Only send once per notification, not per bestie (to avoid duplicates)
        if (notificationType === 'checkInCreated' || notificationType === 'checkInExtended') {
          // Only send messenger alerts for created/extended (to keep contacts informed)
          // Skip for completed (too much spam)
          // This is called once per notification type, not per bestie, so no duplicates
        }

        return { bestieId, channels: channelResults };
      } catch (error) {
        console.error(`Error notifying bestie ${bestieId}:`, error);
        return { bestieId, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    console.log(`Check-in notification (${notificationType}) sent to ${bestieIds.length} besties:`, results);

    return results;
  } catch (error) {
    console.error('Error in notifyBestiesAboutCheckIn:', error);
    throw error;
  }
}

/**
 * Format message based on notification type
 */
function formatCheckInNotification(type, userName, checkInData) {
  const location = checkInData.location?.address || checkInData.location || 'Unknown location';
  const duration = checkInData.duration || 0;

  switch (type) {
    case 'checkInCreated':
      return `👀 ${userName} just started a check-in - they're at ${location} for the next ${duration} mins. Keep an eye out!`;

    case 'checkInExtended':
      const extension = checkInData.extension || 15;
      const newEndTime = checkInData.alertTime
        ? new Date(checkInData.alertTime.toMillis()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'soon';
      return `⏱️ ${userName} extended their check-in by ${extension} minutes. New end time: ${newEndTime}`;

    case 'checkInCompleted':
      return `✅ ${userName} checked in safely! All good 💜`;

    case 'checkInUpdated':
      return `📝 ${userName} updated their check-in - ${location}`;

    default:
      return `📱 Update from ${userName} about their check-in`;
  }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(chatId, message) {
  const botToken = functions.config().telegram?.bot_token;
  if (!botToken) {
    throw new Error('Telegram bot token not configured');
  }

  await axios.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    }
  );
}

/**
 * Send Email notification
 */
async function sendEmailNotification(email, userName, notificationType, checkInData) {
  const location = checkInData.location?.address || checkInData.location || 'Unknown location';

  const subjectMap = {
    checkInCreated: `👀 ${userName} started a check-in`,
    checkInExtended: `⏱️ ${userName} extended their check-in`,
    checkInCompleted: `✅ ${userName} checked in safely`,
    checkInUpdated: `📝 ${userName} updated their check-in`
  };

  const message = formatCheckInNotification(notificationType, userName, checkInData);

  const emailData = {
    to: email,
    from: 'alerts@bestiesapp.com',
    subject: subjectMap[notificationType] || `Update from ${userName}`,
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B9D;">${subjectMap[notificationType]}</h2>
        <p style="font-size: 16px;">${message}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Location:</strong> ${location}<br>
          ${checkInData.notes ? `<strong>Notes:</strong> ${checkInData.notes}<br>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">
          You're receiving this because you're a safety contact for ${userName} on Besties.
        </p>
      </div>
    `
  };

  await sgMail.send(emailData);
}

/**
 * Send notifications to user's active messenger contacts
 * @param {string} userId - User ID
 * @param {string} message - Message to send
 * @param {string[]} selectedContactIds - Optional: Array of contact IDs to filter by. If provided, only sends to these contacts.
 */
async function sendMessengerContactNotifications(userId, message, selectedContactIds = null) {
  try {
    const db = admin.firestore();
    const now = Date.now();

    // Get active messenger contacts for this user
    let contactsSnapshot;
    if (selectedContactIds && selectedContactIds.length > 0) {
      // If specific contacts are selected, get only those
      contactsSnapshot = await db.collection('messengerContacts')
        .where(admin.firestore.FieldPath.documentId(), 'in', selectedContactIds)
        .where('userId', '==', userId)
        .get();
    } else {
      // Otherwise, get all active contacts (backward compatible)
      contactsSnapshot = await db.collection('messengerContacts')
        .where('userId', '==', userId)
        .get();
    }

    if (contactsSnapshot.empty) {
      console.log('No messenger contacts found for user:', userId);
      return;
    }

    // Send to each active contact
    const sendPromises = contactsSnapshot.docs
      .filter(doc => {
        const expiresAt = doc.data().expiresAt?.toMillis();
        return expiresAt && expiresAt > now; // Only active contacts
      })
      .map(async (doc) => {
        const contact = doc.data();
        try {
          await sendMessengerMessage(contact.messengerPSID, message);
          console.log(`✅ Messenger sent to contact ${contact.name}`);
        } catch (error) {
          console.error(`❌ Messenger failed for contact ${contact.name}:`, error.message);
        }
      });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending messenger contact notifications:', error);
  }
}

/**
 * Send Facebook Messenger message
 */
async function sendMessengerMessage(psid, text) {
  const pageToken = functions.config().facebook?.page_token;
  if (!pageToken) {
    throw new Error('Facebook page token not configured');
  }

  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${pageToken}`,
    {
      recipient: { id: psid },
      message: { text: text }
    }
  );
}

module.exports = {
  notifyBestiesAboutCheckIn,
  sendMessengerContactNotifications,
  sendMessengerMessage,
  NOTIFICATION_CONFIG
};
