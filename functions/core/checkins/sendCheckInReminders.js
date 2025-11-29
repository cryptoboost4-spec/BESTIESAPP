const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Send push notification reminders for upcoming check-in expirations
// Runs every minute and sends notifications 5 minutes before expiration
exports.sendCheckInReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 5 * 60 * 1000)
    );
    const sixMinutesFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 6 * 60 * 1000)
    );

    try {
      // Find check-ins expiring in 5-6 minutes that haven't been reminded yet
      const checkInsSnapshot = await db.collection('checkins')
        .where('status', '==', 'active')
        .where('alertTime', '>=', fiveMinutesFromNow)
        .where('alertTime', '<=', sixMinutesFromNow)
        .get();

      functions.logger.info(`Found ${checkInsSnapshot.size} check-ins to remind about`);

      const notifications = [];

      for (const doc of checkInsSnapshot.docs) {
        const checkIn = doc.data();

        // Skip if already reminded
        if (checkIn.reminderSent) {
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
              title: '⏰ Check-In Reminder',
              body: `Your check-in at ${checkIn.location} expires in 5 minutes!`,
              icon: '/logo192.png',
            },
            data: {
              type: 'check-in-reminder',
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
                functions.logger.info(`Sent reminder to user ${checkIn.userId} for check-in ${doc.id}`);
                // Mark as reminded
                return doc.ref.update({ reminderSent: true });
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
      return null;
    } catch (error) {
      functions.logger.error('Error sending check-in reminders:', error);
      return null;
    }
  });
