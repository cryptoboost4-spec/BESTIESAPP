const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendWhatsAppAlert, sendSMSAlert, sendEmailAlert } = require('../../utils/notifications');

const db = admin.firestore();

// Monitor alerts collection for duress code usage
exports.onDuressCodeUsed = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();

    // Only handle duress code alerts (check internal flag, not public type)
    if (!alert._internal_duress) {
      return null;
    }

    console.log('🚨 DURESS CODE DETECTED:', alert.userId);

    // Get user data
    const userDoc = await db.collection('users').doc(alert.userId).get();
    if (!userDoc.exists) {
      console.error('User not found for duress alert:', alert.userId);
      return null;
    }

    const userData = userDoc.data();

    // Get all besties in user's circle (favorites)
    const besties1 = await db.collection('besties')
      .where('requesterId', '==', alert.userId)
      .where('status', '==', 'accepted')
      .where('isFavorite', '==', true)
      .get();

    const besties2 = await db.collection('besties')
      .where('recipientId', '==', alert.userId)
      .where('status', '==', 'accepted')
      .where('isFavorite', '==', true)
      .get();

    const bestieIds = [];
    besties1.forEach(doc => bestieIds.push(doc.data().recipientId));
    besties2.forEach(doc => bestieIds.push(doc.data().requesterId));

    if (bestieIds.length === 0) {
      console.log('No circle besties found for duress alert');
      return null;
    }

    // Critical message - make it clear this is a duress situation
    const fullMessage = `🚨🚨 DURESS CODE ALERT 🚨🚨\n\n${userData.displayName} used their DURESS CODE.\n\nThis means they are in DANGER and were FORCED to cancel a check-in.\n\nLocation: ${alert.location}\n\nACT IMMEDIATELY - Contact authorities if you cannot reach them!`;

    const shortMessage = `🚨 DURESS: ${userData.displayName} is in danger! Location: ${alert.location}. Call police!`;

    // Send critical alerts to all circle besties
    const notifications = bestieIds.map(async (bestieId) => {
      const bestieDoc = await db.collection('users').doc(bestieId).get();
      if (!bestieDoc.exists) return;

      const bestieData = bestieDoc.data();

      try {
        // Send ALL notification types for duress - this is critical
        if (bestieData.phoneNumber) {
          // WhatsApp (free, use full message)
          try {
            await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
          } catch (error) {
            console.log('WhatsApp failed for duress alert');
          }

          // SMS (expensive but critical - use short message)
          try {
            await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          } catch (error) {
            console.log('SMS failed for duress alert');
          }
        }

        // Email (use full message)
        if (bestieData.email) {
          await sendEmailAlert(bestieData.email, fullMessage, {
            location: alert.location,
            alertTime: alert.timestamp,
          });
        }

        // Push notification (if enabled)
        if (bestieData.fcmToken && bestieData.notificationsEnabled) {
          await admin.messaging().send({
            token: bestieData.fcmToken,
            notification: {
              title: '🚨 DURESS CODE ALERT',
              body: `${userData.displayName} is in danger! Check now!`,
            },
            data: {
              type: 'critical_alert',
              userId: alert.userId,
              location: alert.location,
            },
          });
        }

        // Log notification (use generic type to hide duress nature)
        await db.collection('notifications').add({
          userId: bestieId,
          type: 'critical_alert',
          alertId: context.params.alertId,
          message: fullMessage,
          sentAt: admin.firestore.Timestamp.now(),
          read: false,
          priority: 'critical',
        });

      } catch (error) {
        console.error(`Failed to send duress alert to ${bestieId}:`, error);
      }
    });

    await Promise.all(notifications);

    console.log(`Duress alert sent to ${bestieIds.length} circle besties`);
    return null;
  });
