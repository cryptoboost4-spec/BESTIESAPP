const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert, sendPushNotification } = require('../../utils/notifications');
const axios = require('axios');

const db = admin.firestore();

// Helper: Send Messenger message
async function sendMessengerMessage(psid, text, config) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${config.facebook.page_token}`,
      {
        recipient: { id: psid },
        message: { text: text }
      }
    );
  } catch (error) {
    console.error('Error sending Messenger SOS:', error);
  }
}

exports.triggerEmergencySOS = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { location, isReversePIN } = data;

  // Rate limiting: 3 SOS per hour
  const oneHourAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 60 * 60 * 1000)
  );

  const recentSosCount = await db.collection('emergency_sos')
    .where('userId', '==', context.auth.uid)
    .where('createdAt', '>=', oneHourAgo)
    .count()
    .get();

  const sosCount = recentSosCount.data().count;

  // Warn after 2nd use
  if (sosCount === 2) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Warning: You have triggered SOS twice in the last hour. You have 1 more use remaining before hitting the hourly limit.'
    );
  }

  // Block after 3rd use
  if (sosCount >= 3) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'SOS limit reached: Maximum 3 emergency SOS calls per hour. Please wait before triggering again.'
    );
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();

  const besties1 = await db.collection('besties')
    .where('requesterId', '==', context.auth.uid)
    .where('status', '==', 'accepted')
    .get();

  const besties2 = await db.collection('besties')
    .where('recipientId', '==', context.auth.uid)
    .where('status', '==', 'accepted')
    .get();

  const bestieIds = [];
  besties1.forEach(doc => bestieIds.push(doc.data().recipientId));
  besties2.forEach(doc => bestieIds.push(doc.data().requesterId));

  const sosRef = await db.collection('emergency_sos').add({
    userId: context.auth.uid,
    location: location || 'Unknown',
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
    ? `🚨 SILENT EMERGENCY: ${cleanName} triggered reverse PIN. Location: ${location || 'Unknown'}. Covert distress signal.`
    : `🆘 EMERGENCY: ${cleanName} triggered SOS! Location: ${location || 'Unknown'}. Help immediately!`;

  // Short message for SMS (NO URLS - they trigger spam filters)
  const shortAlertMessage = isReversePIN
    ? `URGENT: ${cleanName} sent a silent alert. Check Besties app immediately.`
    : `EMERGENCY: ${cleanName} needs help NOW! Location: ${location || 'Unknown'}. Check Besties app!`;

  const notifications = bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    if (!bestieDoc.exists) return;

    const bestieData = bestieDoc.data();
    const notificationsSent = [];

    try {
      // Try push notification first (ALWAYS try - it's fast and free)
      if (bestieData.fcmToken && bestieData.notificationsEnabled) {
        try {
          const pushTitle = isReversePIN ? '🚨 Silent Emergency Alert' : '🆘 EMERGENCY SOS';
          const pushBody = isReversePIN
            ? `${cleanName} triggered reverse PIN. Check app immediately.`
            : `${cleanName} needs help NOW! Location: ${location || 'Unknown'}`;

          await sendPushNotification(
            bestieData.fcmToken,
            pushTitle,
            pushBody,
            {
              type: 'emergency_sos',
              sosId: sosRef.id,
              userId: context.auth.uid,
              isReversePIN: isReversePIN || false,
            }
          );
          notificationsSent.push('Push');
        } catch (pushError) {
          console.log('Push notification failed for SOS:', pushError.message);
        }
      }

      // Send SMS and WhatsApp if phone number available
      if (bestieData.phoneNumber) {
        // SMS is expensive - use short message
        await sendSMSAlert(bestieData.phoneNumber, shortAlertMessage);
        notificationsSent.push('SMS');
        // WhatsApp is free - use full message
        await sendWhatsAppAlert(bestieData.phoneNumber, fullAlertMessage);
        notificationsSent.push('WhatsApp');
      }

      // Send email if enabled
      if (bestieData.email && bestieData.notificationPreferences?.email) {
        await sendEmailAlert(bestieData.email, fullAlertMessage, {
          location: location || 'Unknown',
          alertTime: admin.firestore.Timestamp.now(),
        });
        notificationsSent.push('Email');
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

      console.log(`SOS sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
    } catch (error) {
      console.error(`Failed SOS to ${bestieId}:`, error);
    }
  });

  await Promise.all(notifications);

  // Send SOS to connected Messenger contacts
  try {
    const config = functions.config();
    const messengerContactsSnapshot = await db.collection('messengerContacts')
      .where('userId', '==', context.auth.uid)
      .get();

    const now = Date.now();
    const messengerPromises = [];

    for (const contactDoc of messengerContactsSnapshot.docs) {
      const contact = contactDoc.data();

      // Check if contact is still valid (not expired)
      if (contact.expiresAt?.toMillis() > now) {
        const messengerMessage = isReversePIN
          ? `🚨 SILENT EMERGENCY ALERT 🚨\n\n${cleanName} triggered a reverse PIN (covert distress signal).\n\n📍 Location: ${location || 'Unknown'}\n\n⚠️ This is a silent emergency - they may be in danger but cannot safely call for help. Please respond discreetly!`
          : `🆘 EMERGENCY SOS 🆘\n\n${cleanName} needs help NOW!\n\n📍 Location: ${location || 'Unknown'}`;

        // Add phone number if available
        if (userData?.phoneNumber) {
          messengerPromises.push(
            sendMessengerMessage(
              contact.messengerPSID,
              `${messengerMessage}\n📞 Call them: ${userData.phoneNumber}`,
              config
            )
          );
        } else {
          messengerPromises.push(
            sendMessengerMessage(contact.messengerPSID, messengerMessage, config)
          );
        }

        console.log(`✅ Sending SOS to Messenger contact: ${contact.name}`);
      }
    }

    await Promise.all(messengerPromises);
  } catch (messengerError) {
    console.error('Error sending Messenger SOS alerts:', messengerError);
    // Don't fail the whole function if messenger fails
  }

  return { success: true, sosId: sosRef.id };
});
