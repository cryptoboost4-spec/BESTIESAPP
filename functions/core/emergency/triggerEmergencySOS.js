const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert, sendPushNotification } = require('../../utils/notifications');
const { requireAuth, validateLocation, validateBoolean } = require('../../utils/validation');
const { RATE_LIMITS, checkUserRateLimit } = require('../../utils/rateLimiting');

const db = admin.firestore();

exports.triggerEmergencySOS = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { location, isReversePIN } = data;

    // Normalize location - allow "Location unavailable" or undefined/null
    let normalizedLocation = location || 'Unknown';
    if (normalizedLocation === 'Location unavailable') {
      normalizedLocation = 'Unknown';
    }

    // Validate location only if it's a real location string
    if (normalizedLocation !== 'Unknown' && typeof normalizedLocation === 'string') {
      try {
        validateLocation(normalizedLocation, 500);
      } catch (error) {
        // If validation fails, use a default value instead of failing the entire SOS
        functions.logger.warn('Location validation failed, using default:', error.message);
        normalizedLocation = 'Unknown';
      }
    }

  // Validate isReversePIN if provided
  if (isReversePIN !== undefined) {
    validateBoolean(isReversePIN, 'isReversePIN');
  }

  // Rate limiting: 3 SOS per hour
  const rateLimit = await checkUserRateLimit(
    userId,
    'triggerEmergencySOS',
    RATE_LIMITS.SOS_PER_HOUR,
    'emergency_sos',
    'userId',
    'createdAt'
  );

  if (!rateLimit.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `SOS limit reached: Maximum ${rateLimit.limit} emergency SOS calls per hour. Please wait before triggering again.`,
      {
        limit: rateLimit.limit,
        count: rateLimit.count,
        resetAt: rateLimit.resetAt.toISOString(),
      }
    );
  }

  // Warn if approaching limit
  if (rateLimit.count === 2) {
    functions.logger.warn(`User ${userId} has triggered SOS twice in the last hour`);
  }

  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  const userData = userDoc.data();

  // Get bestie circle (favorites) with notifications enabled
  const { getUserBestieIds } = require('../../utils/besties');
  const bestieIds = await getUserBestieIds(userId, {
    favoritesOnly: true,
    acceptedOnly: true
  });

  // Get active Facebook Messenger contacts
  const now = Date.now();
  const messengerContactsSnapshot = await db.collection('messengerContacts')
    .where('userId', '==', userId)
    .get();

  const activeMessengerContacts = [];
  messengerContactsSnapshot.forEach(doc => {
    const contact = doc.data();
    const expiresAt = contact.expiresAt?.toMillis();
    if (expiresAt && expiresAt > now) {
      activeMessengerContacts.push(contact.messengerPSID);
    }
  });

    const sosRef = await db.collection('emergency_sos').add({
      userId: userId,
      location: normalizedLocation,
      isReversePIN: isReversePIN || false,
      notifiedBesties: bestieIds,
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
    });

    // Sanitize display name to prevent spam flags
    const cleanName = ((userData && userData.displayName) || 'Your friend')
      .toString()
      .replace(/(.)\1{2,}/g, '$1$1') // Max 2 repeated chars
      .trim()
      .substring(0, 30); // Max 30 chars for name

    // Full message for WhatsApp/Email
    const fullAlertMessage = isReversePIN
      ? `🚨 SILENT EMERGENCY: ${cleanName} triggered reverse PIN. Location: ${normalizedLocation}. Covert distress signal.`
      : `🆘 EMERGENCY: ${cleanName} triggered SOS! Location: ${normalizedLocation}. Help immediately!`;

    // Short message for SMS (NO URLS - they trigger spam filters)
    const shortAlertMessage = isReversePIN
      ? `URGENT: ${cleanName} sent a silent alert. Check Besties app immediately.`
      : `EMERGENCY: ${cleanName} needs help NOW! Location: ${normalizedLocation}. Check Besties app!`;

  // Send to bestie circle with notifications enabled
  const notifications = bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    if (!bestieDoc.exists) return;

    const bestieData = bestieDoc.data();
    const notificationsSent = [];

    // Only send if notifications are enabled
    if (!bestieData.notificationsEnabled) {
      functions.logger.debug(`Skipping ${bestieId} - notifications disabled`);
      return;
    }

    try {
      // Priority order: Push (free) → Telegram (free) → Facebook Messenger (free) → WhatsApp (free) → Email (free) → SMS (paid)
      
      // 1. Push notification (ALWAYS try first - it's fast and free)
      if (bestieData.fcmToken && bestieData.notificationsEnabled) {
        try {
          const pushTitle = isReversePIN ? '🚨 Silent Emergency Alert' : '🆘 EMERGENCY SOS';
          const pushBody = isReversePIN
            ? `${cleanName} triggered reverse PIN. Check app immediately.`
            : `${cleanName} needs help NOW! Location: ${normalizedLocation}`;

          await sendPushNotification(
            bestieData.fcmToken,
            pushTitle,
            pushBody,
            {
              type: 'emergency_sos',
              sosId: sosRef.id,
              userId: userId,
              isReversePIN: isReversePIN || false,
            }
          );
          notificationsSent.push('Push');
        } catch (pushError) {
          functions.logger.warn('Push notification failed for SOS:', pushError.message);
        }
      }

      // 2. Telegram (free)
      let telegramSent = false;
      if (bestieData.notificationPreferences?.telegram && bestieData.telegramChatId) {
        try {
          const { sendTelegramAlert } = require('../../index');
          await sendTelegramAlert(bestieData.telegramChatId, {
            userName: cleanName,
            location: normalizedLocation,
            startTime: new Date().toLocaleString(),
            isEmergency: true,
            message: fullAlertMessage
          });
          notificationsSent.push('Telegram');
          telegramSent = true;
        } catch (telegramError) {
          functions.logger.warn('Telegram failed for SOS:', telegramError.message);
        }
      }

      // 3. Facebook Messenger (free) - Messenger contacts are handled separately below
      // (We send to all active messenger contacts at once, not per-bestie)
      let messengerSent = false;

      // 4. WhatsApp (free) - only if Telegram and Messenger didn't work
      if (!telegramSent && !messengerSent && bestieData.phoneNumber) {
        try {
          await sendWhatsAppAlert(bestieData.phoneNumber, fullAlertMessage);
          notificationsSent.push('WhatsApp');
        } catch (whatsappError) {
          functions.logger.warn('WhatsApp failed for SOS:', whatsappError.message);
        }
      }

      // 5. Email (free)
      if (bestieData.email && bestieData.notificationPreferences?.email) {
        try {
          await sendEmailAlert(bestieData.email, fullAlertMessage, {
            location: normalizedLocation,
            alertTime: admin.firestore.Timestamp.now(),
          });
          notificationsSent.push('Email');
        } catch (emailError) {
          functions.logger.warn('Email failed for SOS:', emailError.message);
        }
      }

      // 6. SMS (paid) - ONLY if free channels didn't work
      if (!telegramSent && !messengerSent && bestieData.phoneNumber && bestieData.smsSubscription?.active) {
        try {
          await sendSMSAlert(bestieData.phoneNumber, shortAlertMessage);
          notificationsSent.push('SMS');
        } catch (smsError) {
          functions.logger.warn('SMS failed for SOS:', smsError.message);
        }
      }

      // Create in-app notification (ALWAYS - regardless of other settings)
      await db.collection('notifications').add({
        userId: bestieId,
        type: 'emergency_sos',
        title: isReversePIN ? '🚨 Silent Emergency' : '🆘 EMERGENCY SOS',
        message: fullAlertMessage,
        sosId: sosRef.id,
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
      });
      notificationsSent.push('In-app');

      functions.logger.info(`SOS sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
    } catch (error) {
      functions.logger.error(`Failed SOS to ${bestieId}:`, error);
    }
  });

  await Promise.all(notifications);

  // Send to active Facebook Messenger contacts
  if (activeMessengerContacts.length > 0) {
    const { sendMessengerAlert } = require('../../index');
    const messengerPromises = activeMessengerContacts.map(async (psid) => {
      try {
        await sendMessengerAlert(psid, {
          userName: cleanName,
          location: normalizedLocation,
          startTime: new Date().toLocaleString(),
          isEmergency: true
        });
        functions.logger.info(`SOS sent to Messenger contact: ${psid}`);
      } catch (error) {
        functions.logger.error(`Failed to send SOS to Messenger contact ${psid}:`, error);
      }
    });
    await Promise.all(messengerPromises);
  }

    return { success: true, sosId: sosRef.id };
  } catch (error) {
    functions.logger.error('Error in triggerEmergencySOS:', error);
    // Re-throw HttpsErrors as-is
    if (error.code && error.message) {
      throw error;
    }
    // Wrap other errors
    throw new functions.https.HttpsError('internal', `Failed to trigger emergency SOS: ${error.message}`);
  }
});
