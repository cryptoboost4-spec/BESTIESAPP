const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Send push notification reminders for upcoming check-in expirations
 * Runs every minute and sends notifications 5 minutes before expiration
 */
async function sendCheckInRemindersLogic(config) {
  const APP_URL = config?.app?.url || 'https://bestiesapp.web.app';
  const now = admin.firestore.Timestamp.now();
  const sixMinutesFromNow = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 6 * 60 * 1000)
  );
  const oneMinuteFromNow = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 1 * 60 * 1000)
  );

  try {
    // Find check-ins expiring in 1-6 minutes
    const checkInsSnapshot = await db.collection('checkins')
      .where('status', '==', 'active')
      .where('alertTime', '>=', oneMinuteFromNow)
      .where('alertTime', '<=', sixMinutesFromNow)
      .get();

    functions.logger.info(`Found ${checkInsSnapshot.size} check-ins to remind about`);

    const notifications = [];

    for (const doc of checkInsSnapshot.docs) {
      const checkIn = doc.data();

      const timeRemainingMs = checkIn.alertTime.toMillis() - Date.now();
      const minutesRemaining = Math.max(1, Math.round(timeRemainingMs / 60000));
      
      let reminderType = null;
      let title = '';
      let bodyText = '';

      if (minutesRemaining === 5 && !checkIn.remindersSent?.fiveMin) {
        reminderType = 'fiveMin';
        title = '⏰ 5 Minute Warning';
        bodyText = `Your check-in at ${checkIn.location} expires in 5 minutes!`;
      } else if (minutesRemaining === 1 && !checkIn.remindersSent?.oneMin) {
        reminderType = 'oneMin';
        title = '🚨 1 MINUTE WARNING';
        bodyText = `Your check-in at ${checkIn.location} expires in 1 minute! Please mark yourself safe.`;
      }

      // Skip test check-ins — no reminder notifications in test mode
      if (checkIn.isTest === true) {
        continue;
      }

      // Skip if no matching reminder logic
      if (!reminderType) {
        continue;
      }

      // Get user document to check if notifications are enabled
      const userDoc = await db.collection('users').doc(checkIn.userId).get();

      if (!userDoc.exists) {
        continue;
      }

      const userData = userDoc.data();

      // Check if push notifications are enabled and user has FCM token
      if (userData.notificationsEnabled && userData.fcmToken) {
        const message = {
          token: userData.fcmToken,
          notification: {
            title: title,
            body: bodyText,
            icon: '/logo192.png',
          },
          data: {
            type: 'check-in-reminder',
            reminderType: reminderType,
            checkInId: doc.id,
            location: checkIn.location,
          },
          webpush: {
            fcmOptions: {
              link: APP_URL,
            },
            notification: {
              badge: '/logo192.png',
              requireInteraction: true,
              actions: [
                {
                  action: 'complete',
                  title: "I'm Safe!",
                },
                {
                  action: 'extend',
                  title: 'Extend Time',
                }
              ]
            }
          }
        };

        notifications.push(
          admin.messaging().send(message)
            .then(() => {
              functions.logger.info(`Sent ${reminderType} reminder to user ${checkIn.userId} for check-in ${doc.id}`);
              // Mark as reminded
              return doc.ref.update({ 
                [`remindersSent.${reminderType}`]: true,
                reminderSent: true // Fallback for backwards compatibility
              });
            })
            .catch((error) => {
              functions.logger.error(`Failed to send notification to ${checkIn.userId}:`, error);
              // If token is invalid, remove it
              if (error.code === 'messaging/invalid-registration-token' ||
                  error.code === 'messaging/registration-token-not-registered') {
                return userDoc.ref.update({
                  fcmToken: null,
                  notificationsEnabled: false,
                });
              }
            })
        );
      }
    }

    await Promise.all(notifications);

    functions.logger.info(`Sent ${notifications.length} push notification reminders`);
    return {
      success: true,
      count: notifications.length
    };
  } catch (error) {
    functions.logger.error('Error sending check-in reminders:', error);
    throw error;
  }
}

module.exports = sendCheckInRemindersLogic;
