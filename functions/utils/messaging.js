const admin = require('firebase-admin');
const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

function getTwilioClient(config) {
  if (!twilioClient) {
    twilioClient = twilio(
      config.twilio.account_sid,
      config.twilio.auth_token
    );
  }
  return twilioClient;
}

/**
 * Send notification via user's preferred method
 * Supports SMS, WhatsApp, Facebook Messenger
 */
async function sendNotification(userId, message, config, options = {}) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      const functions = require('firebase-functions');
      functions.logger.error('User not found:', userId);
      return { success: false, error: 'User not found' };
    }

    const results = [];
    const client = getTwilioClient(config);

    // WhatsApp (Free - Priority 1)
    if (userData.notificationPreferences?.whatsapp && userData.phoneNumber) {
      try {
        const result = await client.messages.create({
          from: `whatsapp:${config.twilio.phone_number}`,
          to: `whatsapp:${userData.phoneNumber}`,
          body: message
        });
        results.push({ method: 'whatsapp', success: true, sid: result.sid });
        const functions = require('firebase-functions');
        functions.logger.info('WhatsApp sent:', result.sid);
      } catch (error) {
        const functions = require('firebase-functions');
        functions.logger.error('WhatsApp failed:', error.message);
        results.push({ method: 'whatsapp', success: false, error: error.message });
      }
    }

    // SMS (Paid - Priority 2, only if subscribed)
    if (userData.smsSubscription?.active && userData.phoneNumber) {
      try {
        const result = await client.messages.create({
          from: config.twilio.phone_number,
          to: userData.phoneNumber,
          body: message
        });
        results.push({ method: 'sms', success: true, sid: result.sid });
        const functions = require('firebase-functions');
        functions.logger.info('SMS sent:', result.sid);
      } catch (error) {
        const functions = require('firebase-functions');
        functions.logger.error('SMS failed:', error.message);
        results.push({ method: 'sms', success: false, error: error.message });
      }
    }

    // Facebook Messenger (Free - Priority 3)
    // Note: Requires Facebook Messenger API setup
    if (userData.notificationPreferences?.facebook && userData.facebookId) {
      // TODO: Implement Facebook Messenger when account is unblocked
      const functions = require('firebase-functions');
      functions.logger.debug('Facebook Messenger not yet implemented');
    }

    // Telegram (Free - Priority 4)
    if (userData.notificationPreferences?.telegram && userData.telegramChatId) {
      try {
        const functions = require('firebase-functions');
        functions.logger.info('Attempting Telegram alert send', {
          userId,
          chatId: userData.telegramChatId,
          notificationType: options.type,
          checkinId: options.checkinId
        });
        
        const { sendTelegramAlert } = require('../index');
        await sendTelegramAlert(userData.telegramChatId, {
          userName: options.userName || 'Your bestie',
          location: options.location?.address || options.location || 'Unknown',
          startTime: options.startTime || new Date().toLocaleString(),
          notes: options.notes,
          photoURLs: options.photoURLs || []
        });
        results.push({ method: 'telegram', success: true, chatId: userData.telegramChatId });
        functions.logger.info('Telegram alert sent successfully', { 
          userId, 
          chatId: userData.telegramChatId 
        });
      } catch (error) {
        const functions = require('firebase-functions');
        functions.logger.error('Telegram alert failed', {
          userId,
          chatId: userData.telegramChatId,
          error: error.message,
          stack: error.stack
        });
        results.push({ method: 'telegram', success: false, error: error.message });
      }
    } else {
      const functions = require('firebase-functions');
      functions.logger.info('Telegram alert skipped', {
        userId,
        reason: !userData.telegramChatId ? 'No chat ID' : 'Telegram disabled in preferences',
        hasChatId: !!userData.telegramChatId,
        telegramPreference: userData.notificationPreferences?.telegram
      });
    }

    // Log notification
    await admin.firestore().collection('notifications').add({
      userId,
      message,
      methods: results,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: options
    });

    return {
      success: results.some(r => r.success),
      results
    };

  } catch (error) {
    const functions = require('firebase-functions');
    functions.logger.error('Send notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 */
async function sendBulkNotifications(userIds, message, config, options = {}) {
  const promises = userIds.map(userId => 
    sendNotification(userId, message, config, options)
  );
  return Promise.all(promises);
}

/**
 * Format check-in alert message
 */
function formatCheckInAlert(userName, location, notes) {
  let message = `🚨 ${userName} hasn't checked in!\n\n`;
  message += `Last location: ${location}\n`;
  if (notes) {
    message += `Notes: ${notes}\n`;
  }
  message += `\nCheck on them!`;
  return message;
}

/**
 * Format false alarm message
 */
function formatFalseAlarm(userName) {
  return `✅ ${userName} is safe! It was a false alarm - they just forgot to check in.`;
}

/**
 * Format emergency alert
 */
function formatEmergencyAlert(userName, location) {
  return `🚨🚨 EMERGENCY 🚨🚨\n\n${userName} needs help NOW!\n\nLast location: ${location}\n\nThis is a real emergency. Check on them immediately!`;
}

/**
 * Format bestie request
 */
function formatBestieRequest(userName, appUrl) {
  return `💜 ${userName} wants you to be their Bestie on the Besties safety app!\n\nThey've chosen you as an emergency contact. Accept here: ${appUrl}`;
}

/**
 * Format check-in safe notification
 */
function formatCheckInSafe(userName) {
  return `✅ ${userName} checked in safe! All good 💜`;
}

module.exports = {
  sendNotification,
  sendBulkNotifications,
  formatCheckInAlert,
  formatFalseAlarm,
  formatEmergencyAlert,
  formatBestieRequest,
  formatCheckInSafe
};
