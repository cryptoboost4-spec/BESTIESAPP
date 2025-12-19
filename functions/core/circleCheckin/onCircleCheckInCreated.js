const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendPushNotification } = require('../../utils/notifications');

const db = admin.firestore();

/**
 * Triggered when a new circle check-in is created
 * Sends notifications to featured circle members
 */
exports.onCircleCheckInCreated = functions.firestore
  .document('circle_checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();
    const checkInId = context.params.checkInId;

    try {
      const userId = checkIn.userId;
      const visibleTo = checkIn.visibleTo || [];

      if (visibleTo.length === 0) {
        functions.logger.warn(`Circle check-in ${checkInId} has no visibleTo members`);
        return;
      }

      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        functions.logger.error(`User not found: ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const userName = userData.displayName || 'A bestie';

      // Mood labels
      const moodLabels = {
        5: '🌟 Amazing',
        4: '😊 Good',
        3: '😐 Okay',
        2: '😔 Not great',
        1: '😢 Struggling'
      };

      const moodLabel = moodLabels[checkIn.mood] || 'feeling';
      const noteText = checkIn.note ? ` "${checkIn.note}"` : '';

      // Send notifications to all featured circle members
      const notificationPromises = visibleTo.map(async (bestieId) => {
        try {
          // Create notification document
          await db.collection('notifications').add({
            userId: bestieId,
            type: 'circle_checkin',
            title: '💜 Circle Check-In',
            message: `${userName} is ${moodLabel}${noteText}`,
            checkInId: checkInId,
            senderId: userId,
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            data: {
              deepLink: `besties://activity?checkinId=${checkInId}`
            }
          });

          // Send push notification if bestie has FCM token
          const bestieDoc = await db.collection('users').doc(bestieId).get();
          if (bestieDoc.exists) {
            const bestieData = bestieDoc.data();
            const fcmToken = bestieData?.fcmToken;

            if (fcmToken) {
              await sendPushNotification(
                fcmToken,
                '💜 Circle Check-In',
                `${userName} is ${moodLabel}${noteText}`,
                {
                  type: 'circle_checkin',
                  checkInId: checkInId,
                  senderId: userId,
                  deepLink: `besties://activity?checkinId=${checkInId}`
                }
              );
            }
          }
        } catch (error) {
          functions.logger.error(`Error notifying bestie ${bestieId}:`, error);
          // Don't fail the whole function if one notification fails
        }
      });

      await Promise.all(notificationPromises);

      // Create interaction record for connection strength
      visibleTo.forEach(async (bestieId) => {
        try {
          await db.collection('interactions').add({
            userId: userId,
            bestieId: bestieId,
            type: 'circle_check',
            createdAt: admin.firestore.Timestamp.now(),
            metadata: {
              checkInId: checkInId,
              mood: checkIn.mood
            }
          });
        } catch (error) {
          functions.logger.warn(`Error creating interaction for ${bestieId}:`, error);
        }
      });

      functions.logger.info(`Circle check-in created: ${userId} -> ${visibleTo.length} besties`);

      // Update challenge progress (if applicable)
      try {
        const { updateChallengeProgress } = require('../challenges/updateChallengeProgress');
        await updateChallengeProgress(userId, 'circle_checkins');
      } catch (error) {
        functions.logger.warn('Error updating challenge progress for circle check-in:', error);
        // Don't fail the whole function if challenge update fails
      }

    } catch (error) {
      functions.logger.error('Error in onCircleCheckInCreated:', error);
      // Don't throw - check-in is already created
    }
  });

