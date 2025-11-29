const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const { retryApiCall } = require('./retry');
const EMAIL_CONFIG = require('./emailConfig');

// Lazy Twilio client initialization (only when needed)
let twilioClient = null;
let twilioPhone = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = functions.config().twilio?.account_sid;
    const authToken = functions.config().twilio?.auth_token;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set twilio.account_sid and twilio.auth_token in Firebase Functions config.');
    }
    
    twilioClient = twilio(accountSid, authToken);
    twilioPhone = functions.config().twilio?.phone_number;
    
    if (!twilioPhone) {
      throw new Error('Twilio phone number not configured. Please set twilio.phone_number in Firebase Functions config.');
    }
  }
  return { client: twilioClient, phone: twilioPhone };
}

// Lazy SendGrid setup (only when needed)
let sendGridInitialized = false;

function initializeSendGrid() {
  if (!sendGridInitialized) {
    const apiKey = functions.config().sendgrid?.api_key;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set sendgrid.api_key in Firebase Functions config.');
    }
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
  }
}

// App URL configuration
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Get database instance
const db = admin.firestore();

/**
 * Send SMS alert via Twilio (with retry logic)
 */
async function sendSMSAlert(phoneNumber, message) {
  const { client, phone } = getTwilioClient();
  return retryApiCall(
    async () => {
      return await client.messages.create({
        body: message,
        from: phone,
        to: phoneNumber,
      });
    },
    { operationName: `SMS to ${phoneNumber}` }
  );
}

/**
 * Send WhatsApp alert via Twilio (with retry logic)
 */
async function sendWhatsAppAlert(phoneNumber, message) {
  const { client, phone } = getTwilioClient();
  return retryApiCall(
    async () => {
      return await client.messages.create({
        body: message,
        from: `whatsapp:${phone}`,
        to: `whatsapp:${phoneNumber}`,
      });
    },
    { operationName: `WhatsApp to ${phoneNumber}` }
  );
}

/**
 * Send email alert via SendGrid (with retry logic)
 */
async function sendEmailAlert(email, message, checkIn) {
  initializeSendGrid();
  
  const msg = {
    to: email,
    from: EMAIL_CONFIG.ALERTS,
    subject: '🚨 Safety Alert from Besties',
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B9D;">🚨 Safety Alert</h2>
        <p>${message}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Location:</strong> ${checkIn.location}<br>
          <strong>Expected back:</strong> ${new Date(checkIn.alertTime.toMillis()).toLocaleString()}
        </div>
      </div>
    `,
  };

  return retryApiCall(
    async () => {
      return await sgMail.send(msg);
    },
    { operationName: `Email to ${email}` }
  );
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  // Construct the push notification payload
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
    },
    webpush: {
      fcmOptions: {
        link: APP_URL, // Open the app when notification is clicked
      },
      notification: {
        title,
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true,
        tag: 'check-in-alert',
      },
    },
  };

  try {
    await retryApiCall(
      async () => {
        return await admin.messaging().send(message);
      },
      { operationName: `Push notification to ${fcmToken.substring(0, 20)}...` }
    );
    functions.logger.debug(`Push notification sent to token: ${fcmToken.substring(0, 20)}...`);
  } catch (error) {
    // Token might be invalid or expired
    functions.logger.error('Error sending push notification:', error.message);
    throw error;
  }
}

/**
 * Send alerts to all besties (initiates cascading notification)
 */
async function sendAlertToBesties(checkInId, checkIn) {
  const userDoc = await db.collection('users').doc(checkIn.userId).get();
  const userData = userDoc.data();

  // Initialize cascading alert - notify first bestie only
  if (checkIn.bestieIds.length === 0) {
    functions.logger.debug('No besties to notify for check-in:', checkInId);
    return;
  }

  const firstBestieId = checkIn.bestieIds[0];

  // Update check-in with cascading alert fields
  await db.collection('checkins').doc(checkInId).update({
    currentNotifiedBestie: firstBestieId,
    currentNotificationSentAt: admin.firestore.Timestamp.now(),
    notifiedBestieHistory: [firstBestieId],
    acknowledgedBy: [],
  });

  // Send notification to first bestie
  await sendCascadingAlert(checkInId, checkIn, firstBestieId, userData);

  functions.logger.info(`Cascading alert initialized for check-in ${checkInId}, notified: ${firstBestieId}`);
}

/**
 * Send notification to a specific bestie (cascading alert)
 */
async function sendCascadingAlert(checkInId, checkIn, bestieId, userData) {
  const bestieDoc = await db.collection('users').doc(bestieId).get();

  if (!bestieDoc.exists) {
    functions.logger.warn(`Bestie ${bestieId} not found`);
    return;
  }

  const bestieData = bestieDoc.data();

  // Sanitize display name to prevent spam flags (remove repeated characters)
  const cleanName = ((userData && userData.displayName) || 'Your friend')
    .toString()
    .replace(/(.)\1{2,}/g, '$1$1') // Max 2 repeated chars
    .trim()
    .substring(0, 30); // Max 30 chars for name

  // Full message for WhatsApp/Email (free/cheap)
  const fullMessage = `🚨 SAFETY ALERT: ${cleanName} hasn't checked in from ${checkIn.location}. They were expected back ${Math.round((Date.now() - checkIn.alertTime.toMillis()) / 60000)} minutes ago. Please check on them!`;

  // ULTRA SHORT message for SMS (MUST be under 160 chars for single segment)
  // Conversational format to avoid spam filters - NO URLs, NO excessive emojis
  const shortMessage = `Hey, ${cleanName} hasn't checked in yet. Please check Besties app - they might need help.`;

  const notificationsSent = [];

  try {
    // Send push notification if user has FCM token (ALWAYS try first)
    if (bestieData.fcmToken && bestieData.notificationsEnabled) {
      try {
        await sendPushNotification(
          bestieData.fcmToken,
          '🚨 Check-in Alert',
          `${cleanName} hasn't checked in yet. They might need help.`,
          {
            type: 'check_in_alert',
            checkInId: checkInId,
            userId: userData.uid || checkIn.userId,
          }
        );
        notificationsSent.push('Push');
      } catch (pushError) {
        functions.logger.warn('Push notification failed:', pushError.message);
        // Continue with other notification methods
      }
    }

    // Priority order: Telegram (free) → Facebook Messenger (free) → WhatsApp (free) → Email (free) → SMS (paid)
    
    // 1. Telegram (free)
    let telegramSent = false;
    if (bestieData.notificationPreferences?.telegram && bestieData.telegramChatId) {
      try {
        const { sendTelegramAlert } = require('../index');
        await sendTelegramAlert(bestieData.telegramChatId, {
          userName: cleanName,
          location: checkIn.location || 'Unknown',
          startTime: checkIn.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
          isEmergency: true,
          message: fullMessage
        });
        notificationsSent.push('Telegram');
        telegramSent = true;
      } catch (telegramError) {
        functions.logger.warn('Telegram failed for check-in alert:', telegramError.message);
      }
    }

    // 2. Facebook Messenger (free)
    let messengerSent = false;
    const messengerContactsSnapshot = await db.collection('messengerContacts')
      .where('userId', '==', checkIn.userId)
      .get();
    
    messengerContactsSnapshot.forEach(doc => {
      const contact = doc.data();
      const expiresAt = contact.expiresAt?.toMillis();
      if (expiresAt && expiresAt > Date.now() && contact.messengerPSID) {
        try {
          const { sendMessengerAlert } = require('./checkInNotifications');
          sendMessengerAlert(contact.messengerPSID, {
            userName: cleanName,
            location: checkIn.location || 'Unknown',
            startTime: checkIn.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
            isEmergency: true
          });
          messengerSent = true;
          notificationsSent.push('Messenger');
        } catch (messengerError) {
          functions.logger.warn('Messenger failed for check-in alert:', messengerError.message);
        }
      }
    });

    // 3. WhatsApp (free) - only if Telegram and Messenger didn't work
    if (!telegramSent && !messengerSent && bestieData.notifications?.whatsapp && bestieData.phoneNumber) {
      try {
        await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
        notificationsSent.push('WhatsApp');
      } catch (whatsappError) {
        functions.logger.warn('WhatsApp failed, trying SMS...');
        // Fallback to SMS (expensive - use short message)
        if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber && bestieData.smsSubscription?.active) {
          await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          notificationsSent.push('SMS');
        }
      }
    } else if (!telegramSent && !messengerSent && bestieData.notificationPreferences?.sms && bestieData.phoneNumber && bestieData.smsSubscription?.active) {
      // SMS only (expensive - use short message) - only if no free channels available
      await sendSMSAlert(bestieData.phoneNumber, shortMessage);
      notificationsSent.push('SMS');
    }

    // Send email if enabled (cheap - use full message)
    if (bestieData.email && bestieData.notificationPreferences?.email) {
      await sendEmailAlert(bestieData.email, fullMessage, checkIn);
      notificationsSent.push('Email');
    }

    // Create in-app notification (ALWAYS - regardless of other settings)
    await db.collection('notifications').add({
      userId: bestieId,
      type: 'check_in_alert',
      title: '🚨 Check-in Alert',
      message: `${userData.displayName} hasn't checked in yet. They might need help.`,
      checkInId,
      createdAt: admin.firestore.Timestamp.now(),
      read: false,
    });
    notificationsSent.push('In-app');

    functions.logger.info(`Alert sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
  } catch (error) {
    functions.logger.error(`Failed to notify bestie ${bestieId}:`, error);
  }
}

/**
 * Log alert event to database
 */
async function logAlertEvent(checkInId, checkIn) {
  await db.collection('alerts').add({
    checkInId,
    userId: checkIn.userId,
    location: checkIn.location,
    notifiedBesties: checkIn.bestieIds,
    createdAt: admin.firestore.Timestamp.now(),
    status: 'active',
  });
}

module.exports = {
  sendSMSAlert,
  sendWhatsAppAlert,
  sendEmailAlert,
  sendPushNotification,
  sendAlertToBesties,
  sendCascadingAlert,
  logAlertEvent,
};
