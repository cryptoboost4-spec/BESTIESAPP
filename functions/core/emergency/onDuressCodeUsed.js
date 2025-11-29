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

    functions.logger.info('🚨 DURESS CODE DETECTED:', { userId: alert.userId });

    // Get user data
    const userDoc = await db.collection('users').doc(alert.userId).get();
    if (!userDoc.exists) {
      functions.logger.error('User not found for duress alert:', { userId: alert.userId });
      return null;
    }

    const userData = userDoc.data();

    // Get all besties in user's circle (favorites)
    const { getUserBestieIds } = require('../../utils/besties');
    const bestieIds = await getUserBestieIds(alert.userId, {
      favoritesOnly: true,
      acceptedOnly: true
    });

    if (bestieIds.length === 0) {
      functions.logger.warn('No circle besties found for duress alert', { userId: alert.userId });
      return null;
    }

    // Critical message - make it clear this is a duress situation
    const fullMessage = `🚨🚨 DURESS CODE ALERT 🚨🚨\n\n${userData.displayName} used their DURESS CODE.\n\nThis means they are in DANGER and were FORCED to cancel a check-in.\n\nLocation: ${alert.location}\n\nACT IMMEDIATELY - Contact authorities if you cannot reach them!`;

    const shortMessage = `🚨 DURESS: ${userData.displayName} is in danger! Location: ${alert.location}. Call police!`;

    // Send critical alerts to all circle besties
    // Batch fetch all bestie documents at once to avoid N+1 queries
    // db.getAll() can handle up to 100 documents, so batching only needed if > 100
    const bestieDocRefs = bestieIds.map(bestieId => db.collection('users').doc(bestieId));
    const bestieDocs = await db.getAll(...bestieDocRefs);
    
    // Build a Map for O(1) lookups
    const bestieDataMap = new Map();
    bestieDocs.forEach(doc => {
      if (doc.exists) {
        bestieDataMap.set(doc.id, doc.data());
      }
    });

    const notifications = bestieIds.map(async (bestieId) => {
      const bestieData = bestieDataMap.get(bestieId);
      if (!bestieData) return;

      try {
        // Send ALL notification types for duress - this is critical
        if (bestieData.phoneNumber) {
          // WhatsApp (free, use full message)
          try {
            await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
          } catch (error) {
            functions.logger.warn('WhatsApp failed for duress alert', { bestieId, error: error.message });
          }

          // SMS (expensive but critical - use short message)
          try {
            await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          } catch (error) {
            functions.logger.warn('SMS failed for duress alert', { bestieId, error: error.message });
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
        functions.logger.error('Failed to send duress alert to bestie', { bestieId, error: error.message });
      }
    });

    await Promise.all(notifications);

    functions.logger.info('Duress alert sent to circle besties', { userId: alert.userId, bestieCount: bestieIds.length });
    return null;
  });
