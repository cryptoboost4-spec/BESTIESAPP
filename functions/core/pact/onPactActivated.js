const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendPushNotification } = require('../../utils/notifications');

const db = admin.firestore();

/**
 * Triggered when a Safety Pact is activated (both users have promised)
 * Sends celebration notifications
 */
exports.onPactActivated = functions.firestore
  .document('safety_pacts/{pactId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const pactId = context.params.pactId;

    // Only process if status changed to active
    if (before.status !== 'active' && after.status === 'active') {
      try {
        // Get user data
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(after.user1Id).get(),
          db.collection('users').doc(after.user2Id).get()
        ]);

        if (!user1Doc.exists() || !user2Doc.exists()) {
          functions.logger.error('User not found for pact activation');
          return;
        }

        const user1Data = user1Doc.data();
        const user2Data = user2Doc.data();

        const user1Name = user1Data.displayName || 'A bestie';
        const user2Name = user2Data.displayName || 'A bestie';

        // Send notifications to both users
        const notificationMessage1 = `You've made your Safety Pact with ${user2Name} 💜`;
        const notificationMessage2 = `You've made your Safety Pact with ${user1Name} 💜`;

        const notificationPromises = [
          db.collection('notifications').add({
            userId: after.user1Id,
            type: 'pact_activated',
            title: '💜 Safety Pact Active!',
            message: notificationMessage1,
            pactId: pactId,
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            data: {
              deepLink: `besties://circle/pact?pactId=${pactId}`
            }
          }),
          db.collection('notifications').add({
            userId: after.user2Id,
            type: 'pact_activated',
            title: '💜 Safety Pact Active!',
            message: notificationMessage2,
            pactId: pactId,
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            data: {
              deepLink: `besties://circle/pact?pactId=${pactId}`
            }
          })
        ];

        // Send push notifications
        const pushPromises = [];
        if (user1Data.fcmToken) {
          pushPromises.push(
            sendPushNotification(
              user1Data.fcmToken,
              '💜 Safety Pact Active!',
              `You've made your Safety Pact with ${user2Name} 💜`,
              {
                type: 'pact_activated',
                pactId: pactId,
                deepLink: `besties://circle/pact?pactId=${pactId}`
              }
            ).catch(err => {
              functions.logger.warn('Failed to send push to user1:', err);
            })
          );
        }
        if (user2Data.fcmToken) {
          pushPromises.push(
            sendPushNotification(
              user2Data.fcmToken,
              '💜 Safety Pact Active!',
              `You've made your Safety Pact with ${user1Name} 💜`,
              {
                type: 'pact_activated',
                pactId: pactId,
                deepLink: `besties://circle/pact?pactId=${pactId}`
              }
            ).catch(err => {
              functions.logger.warn('Failed to send push to user2:', err);
            })
          );
        }

        await Promise.all([...notificationPromises, ...pushPromises]);

        // Update stats (activePacts)
        await Promise.all([
          db.collection('users').doc(after.user1Id).update({
            'stats.activePacts': admin.firestore.FieldValue.increment(1)
          }),
          db.collection('users').doc(after.user2Id).update({
            'stats.activePacts': admin.firestore.FieldValue.increment(1)
          })
        ]);

        functions.logger.info(`Safety Pact ${pactId} activated between ${after.user1Id} and ${after.user2Id}`);

      } catch (error) {
        functions.logger.error('Error in onPactActivated:', error);
        // Don't throw - pact is already activated
      }
    }
  });

