const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendPushNotification } = require('../../utils/notifications');

const db = admin.firestore();

/**
 * Triggered when a challenge is marked as completed
 * Awards points and badges, sends notifications
 */
exports.onChallengeCompleted = functions.firestore
  .document('bestie_challenges/{challengeId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const challengeId = context.params.challengeId;

    // Only process if status changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      try {
        // Get challenge template
        const templateDoc = await db.collection('challenge_templates')
          .doc(after.challengeId)
          .get();

        const template = templateDoc.exists() ? templateDoc.data() : null;
        const points = template?.points || after.points || 0;
        const badge = template?.badge || after.badge;

        // Get user data
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(after.user1Id).get(),
          db.collection('users').doc(after.user2Id).get()
        ]);

        if (!user1Doc.exists() || !user2Doc.exists()) {
          functions.logger.error('User not found for challenge completion');
          return;
        }

        const user1Data = user1Doc.data();
        const user2Data = user2Doc.data();

        // Award points (if points system exists)
        // For now, we'll just log it - points system can be added later

        // Award badges (if badge specified)
        if (badge) {
          // Award badge to both users
          const awardBadge = async (userId, userData) => {
            const badgesDoc = await db.collection('badges').doc(userId).get();
            const existingBadges = badgesDoc.exists() ? badgesDoc.data().badges || [] : [];
            
            // Check if badge already exists
            const hasBadge = existingBadges.some(b => b.id === badge);
            if (!hasBadge) {
              await db.collection('badges').doc(userId).set({
                badges: [
                  ...existingBadges,
                  {
                    id: badge,
                    name: template?.name || 'Challenge Badge',
                    description: `Completed ${template?.name || 'challenge'}`,
                    earnedAt: admin.firestore.Timestamp.now(),
                    category: 'challenge'
                  }
                ]
              }, { merge: true });
            }
          };

          await Promise.all([
            awardBadge(after.user1Id, user1Data),
            awardBadge(after.user2Id, user2Data)
          ]);
        }

        // Send notifications to both users
        const challengeName = template?.name || after.name || 'Challenge';
        const notificationMessage = `Challenge '${challengeName}' completed! 🎉`;

        const notificationPromises = [
          db.collection('notifications').add({
            userId: after.user1Id,
            type: 'challenge_completed',
            title: '🎉 Challenge Complete!',
            message: notificationMessage,
            challengeId: challengeId,
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            data: {
              deepLink: `besties://challenges/complete?challengeId=${challengeId}`
            }
          }),
          db.collection('notifications').add({
            userId: after.user2Id,
            type: 'challenge_completed',
            title: '🎉 Challenge Complete!',
            message: notificationMessage,
            challengeId: challengeId,
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            data: {
              deepLink: `besties://challenges/complete?challengeId=${challengeId}`
            }
          })
        ];

        // Send push notifications
        const pushPromises = [];
        if (user1Data.fcmToken) {
          pushPromises.push(
            sendPushNotification(
              user1Data.fcmToken,
              '🎉 Challenge Complete!',
              notificationMessage,
              {
                type: 'challenge_completed',
                challengeId: challengeId,
                deepLink: `besties://challenges/complete?challengeId=${challengeId}`
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
              '🎉 Challenge Complete!',
              notificationMessage,
              {
                type: 'challenge_completed',
                challengeId: challengeId,
                deepLink: `besties://challenges/complete?challengeId=${challengeId}`
              }
            ).catch(err => {
              functions.logger.warn('Failed to send push to user2:', err);
            })
          );
        }

        await Promise.all([...notificationPromises, ...pushPromises]);

        // Update stats (challengesCompleted)
        await Promise.all([
          db.collection('users').doc(after.user1Id).update({
            'stats.challengesCompleted': admin.firestore.FieldValue.increment(1)
          }),
          db.collection('users').doc(after.user2Id).update({
            'stats.challengesCompleted': admin.firestore.FieldValue.increment(1)
          })
        ]);

        functions.logger.info(`Challenge ${challengeId} completed by ${after.user1Id} and ${after.user2Id}`);

      } catch (error) {
        functions.logger.error('Error in onChallengeCompleted:', error);
        // Don't throw - challenge is already marked complete
      }
    }
  });

