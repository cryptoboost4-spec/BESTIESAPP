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
 * Send SMS alert via Twilio (with retry logic and credit management)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @param {object} metadata - Metadata for credit tracking: {userId, recipientId, alertType, checkinId, sosId}
 */
async function sendSMSAlert(phoneNumber, message, metadata = {}) {
  const { userId, recipientId, alertType, checkinId = null, sosId = null } = metadata;

  // STEP 1: Check if recipient requires credit deduction
  // (Only deduct if sending to a user who has SMS as notification channel)
  if (!userId || !recipientId) {
    throw new Error('SMS metadata required: userId and recipientId');
  }

  // STEP 2: Rate limiting check - max 5 SMS per hour
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const now = Date.now();

  // Check if hourly limit exceeded
  const hourlyResetAt = userData.smsCredits?.hourlyResetAt?.toMillis() || 0;
  let hourlyCount = userData.smsCredits?.hourlyCount || 0;

  if (now > hourlyResetAt) {
    // Reset hourly counter
    hourlyCount = 0;
  }

  if (hourlyCount >= 5) {
    const minutesRemaining = Math.ceil((hourlyResetAt - now) / (1000 * 60));
    throw new Error(`RATE_LIMIT_EXCEEDED: Maximum 5 SMS per hour. Try again in ${minutesRemaining} minutes.`);
  }

  // STEP 3: Check available credits BEFORE sending
  const { getAvailableCredits, deductCredit } = require('./smsCredits');
  const availableCredits = await getAvailableCredits(userId);

  let isEmergencyOverride = false;

  if (availableCredits < 1) {
    // EMERGENCY OVERRIDE: Allow 1 free SMS for emergency SOS only
    if (alertType === 'emergency_sos') {
      isEmergencyOverride = true;
      functions.logger.warn('Emergency override: Sending SMS with 0 credits', { userId, recipientId });
    } else {
      throw new Error('INSUFFICIENT_SMS_CREDITS');
    }
  }

  // STEP 4: Send SMS via Twilio
  const { client, phone } = getTwilioClient();
  let twilioResponse;

  try {
    twilioResponse = await retryApiCall(
      async () => {
        return await client.messages.create({
          body: message,
          from: phone,
          to: phoneNumber,
        });
      },
      { operationName: `SMS to ${phoneNumber}` }
    );
  } catch (smsError) {
    functions.logger.error('Twilio SMS send failed:', smsError);
    throw smsError; // Don't deduct credit if SMS failed
  }

  // STEP 5: Update hourly rate limit counter
  const newHourlyResetAt = now > hourlyResetAt
    ? admin.firestore.Timestamp.fromMillis(now + 60 * 60 * 1000)  // Reset in 1 hour
    : userData.smsCredits?.hourlyResetAt;

  await userRef.update({
    'smsCredits.hourlyCount': admin.firestore.FieldValue.increment(1),
    'smsCredits.hourlyResetAt': newHourlyResetAt
  });

  // STEP 6: Deduct credit AFTER successful send (or mark as emergency override)
  let deductResult;

  if (isEmergencyOverride) {
    // Emergency override: Create negative balance
    await userRef.update({
      'smsCredits.balance': admin.firestore.FieldValue.increment(-1),
      'smsCredits.subscriptionCredits': admin.firestore.FieldValue.increment(-1),
      'smsCredits.hasNegativeBalance': true,
      'smsCredits.emergencyOverrideUsed': admin.firestore.FieldValue.increment(1),
      'smsCredits.totalUsed': admin.firestore.FieldValue.increment(1),
      'smsCredits.lastUsedAt': admin.firestore.Timestamp.now()
    });

    deductResult = {
      success: true,
      creditType: 'emergency_override',
      newBalance: -1
    };

    // Alert admin about negative balance
    await db.collection('admin_alerts').add({
      type: 'emergency_override_used',
      userId,
      recipientId,
      twilioMessageSid: twilioResponse.sid,
      message: 'User sent emergency SMS with 0 credits (negative balance)',
      timestamp: admin.firestore.Timestamp.now(),
      resolved: false
    });
  } else {
    // Normal deduction
    deductResult = await deductCredit(userId, alertType, recipientId);
  }

  // STEP 7: Log to audit trail
  const auditData = {
    userId,
    recipientId,
    alertType,
    checkinId,
    sosId,
    creditType: deductResult.success ? deductResult.creditType : null,
    creditsDeducted: deductResult.success ? 1 : 0,
    balanceAfter: deductResult.success ? deductResult.newBalance : availableCredits,
    isEmergencyOverride,
    phoneNumber,
    twilioMessageSid: twilioResponse.sid,
    sentAt: admin.firestore.Timestamp.now(),
    status: deductResult.success ? 'sent' : 'deduction_failed',
    errorMessage: deductResult.success ? null : deductResult.error
  };

  await db.collection('sms_usage').add(auditData);

  // STEP 8: If deduction failed (and not emergency), alert admin
  if (!deductResult.success && !isEmergencyOverride) {
    await db.collection('admin_alerts').add({
      type: 'sms_credit_deduction_failed',
      userId,
      recipientId,
      twilioMessageSid: twilioResponse.sid,
      error: deductResult.error,
      timestamp: admin.firestore.Timestamp.now(),
      resolved: false
    });

    functions.logger.error('Credit deduction failed but SMS sent:', {
      userId,
      twilioSid: twilioResponse.sid,
      error: deductResult.error
    });
  }

  return twilioResponse;
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

  // Exponential backoff intervals in seconds: [60, 180, 300, 600, 900] = 1min, 3min, 5min, 10min, 15min
  const ESCALATION_INTERVALS = [60, 180, 300, 600, 900];
  const now = admin.firestore.Timestamp.now();
  const firstIntervalSeconds = ESCALATION_INTERVALS[0]; // 60 seconds (1 minute)
  const nextEscalationTime = admin.firestore.Timestamp.fromDate(
    new Date(now.toDate().getTime() + firstIntervalSeconds * 1000)
  );

  // Update check-in with cascading alert fields
  await db.collection('checkins').doc(checkInId).update({
    currentNotifiedBestie: firstBestieId,
    currentNotificationSentAt: now,
    escalationLevel: 0,
    nextEscalationTime: nextEscalationTime,
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
  const notificationStatus = {
    checkInId,
    bestieId,
    userId: checkIn.userId,
    timestamp: admin.firestore.Timestamp.now(),
    channelsAttempted: [],
    channelsSucceeded: [],
    channelsFailed: []
  };

  try {
    // Send push notification if user has FCM token (ALWAYS try first)
    if (bestieData.fcmToken && bestieData.notificationsEnabled) {
      notificationStatus.channelsAttempted.push('Push');
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
        notificationStatus.channelsSucceeded.push('Push');
      } catch (pushError) {
        functions.logger.warn('Push notification failed:', pushError.message);
        notificationStatus.channelsFailed.push({ 
          channel: 'Push', 
          error: pushError.message,
          code: pushError.code || 'unknown'
        });
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
          location: checkIn.location?.address || checkIn.location || 'Unknown',
          startTime: checkIn.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
          isEmergency: true,
          message: fullMessage,
          notes: checkIn.notes,
          photoURLs: checkIn.photoURLs || []
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
            location: checkIn.location?.address || checkIn.location || 'Unknown',
            startTime: checkIn.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
            isEmergency: true,
            notes: checkIn.notes,
            photoURLs: checkIn.photoURLs || []
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
        if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
          try {
            await sendSMSAlert(bestieData.phoneNumber, shortMessage, {
              userId: checkIn.userId,
              recipientId: bestieId,
              alertType: 'check_in',
              checkinId: checkInId
            });
            notificationsSent.push('SMS');
          } catch (smsError) {
            functions.logger.warn('SMS failed for check-in alert:', smsError.message);
            notificationStatus.channelsFailed.push({ channel: 'SMS', error: smsError.message });
          }
        }
      }
    } else if (!telegramSent && !messengerSent && bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
      // SMS only (expensive - use short message) - only if no free channels available
      try {
        await sendSMSAlert(bestieData.phoneNumber, shortMessage, {
          userId: checkIn.userId,
          recipientId: bestieId,
          alertType: 'check_in',
          checkinId: checkInId
        });
        notificationsSent.push('SMS');
      } catch (smsError) {
        functions.logger.warn('SMS failed for check-in alert:', smsError.message);
        notificationStatus.channelsFailed.push({ channel: 'SMS', error: smsError.message });
      }
    }

    // Track notification attempts
    const notificationStatus = {
      checkInId,
      bestieId,
      userId: checkIn.userId,
      timestamp: admin.firestore.Timestamp.now(),
      channelsAttempted: [],
      channelsSucceeded: [],
      channelsFailed: []
    };

    // Send email if enabled (cheap - use full message)
    if (bestieData.email && bestieData.notificationPreferences?.email) {
      notificationStatus.channelsAttempted.push('Email');
      try {
        await sendEmailAlert(bestieData.email, fullMessage, checkIn);
        notificationsSent.push('Email');
        notificationStatus.channelsSucceeded.push('Email');
      } catch (emailError) {
        functions.logger.warn('Email failed for check-in alert:', emailError.message);
        notificationStatus.channelsFailed.push({ channel: 'Email', error: emailError.message });
      }
    }

    // Create in-app notification (ALWAYS - regardless of other settings)
    try {
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
      notificationStatus.channelsSucceeded.push('In-app');
    } catch (notifError) {
      functions.logger.warn('In-app notification failed:', notifError.message);
      notificationStatus.channelsFailed.push({ channel: 'In-app', error: notifError.message });
    }

    // Log notification status for user feedback
    if (notificationStatus.channelsFailed.length > 0 || notificationsSent.length === 0) {
      await db.collection('notification_status').add({
        ...notificationStatus,
        status: notificationsSent.length === 0 ? 'failed' : 'partial',
        channelsSucceeded: notificationsSent
      });
    }

    functions.logger.info(`Alert sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
  } catch (error) {
    functions.logger.error(`Failed to notify bestie ${bestieId}:`, error);
    // Track complete failure
    try {
      await db.collection('notification_status').add({
        checkInId,
        bestieId,
        userId: checkIn.userId,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'failed',
        reason: error.message,
        channelsAttempted: [],
        channelsSucceeded: [],
        channelsFailed: []
      });
    } catch (trackError) {
      functions.logger.error('Failed to track notification status:', trackError);
    }
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
