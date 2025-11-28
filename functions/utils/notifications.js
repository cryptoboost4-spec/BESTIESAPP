const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// Twilio setup
const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);
const twilioPhone = functions.config().twilio.phone_number;

// SendGrid setup
sgMail.setApiKey(functions.config().sendgrid.api_key);

// App URL configuration
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Get database instance
const db = admin.firestore();

/**
 * Send SMS alert via Twilio
 */
async function sendSMSAlert(phoneNumber, message) {
  await twilioClient.messages.create({
    body: message,
    from: twilioPhone,
    to: phoneNumber,
  });
}

/**
 * Send WhatsApp alert via Twilio
 */
async function sendWhatsAppAlert(phoneNumber, message) {
  await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${twilioPhone}`,
    to: `whatsapp:${phoneNumber}`,
  });
}

/**
 * Send email alert via SendGrid
 */
async function sendEmailAlert(email, message, checkIn) {
  const msg = {
    to: email,
    from: 'alerts@bestiesapp.com',
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

  await sgMail.send(msg);
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
    await admin.messaging().send(message);
    console.log(`Push notification sent to token: ${fcmToken.substring(0, 20)}...`);
  } catch (error) {
    // Token might be invalid or expired
    console.error('Error sending push notification:', error.message);
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
    console.log('No besties to notify for check-in:', checkInId);
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

  console.log(`Cascading alert initialized for check-in ${checkInId}, notified: ${firstBestieId}`);
}

/**
 * Send notification to a specific bestie (cascading alert)
 */
async function sendCascadingAlert(checkInId, checkIn, bestieId, userData) {
  const bestieDoc = await db.collection('users').doc(bestieId).get();

  if (!bestieDoc.exists) {
    console.log(`Bestie ${bestieId} not found`);
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
        console.log('Push notification failed:', pushError.message);
        // Continue with other notification methods
      }
    }

    // Try WhatsApp first (free - use full message)
    if (bestieData.notifications?.whatsapp && bestieData.phoneNumber) {
      try {
        await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
        notificationsSent.push('WhatsApp');
      } catch (whatsappError) {
        console.log('WhatsApp failed, trying SMS...');
        // Fallback to SMS (expensive - use short message)
        if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
          await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          notificationsSent.push('SMS');
        }
      }
    } else if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
      // SMS only (expensive - use short message)
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

    console.log(`Alert sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
  } catch (error) {
    console.error(`Failed to notify bestie ${bestieId}:`, error);
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
