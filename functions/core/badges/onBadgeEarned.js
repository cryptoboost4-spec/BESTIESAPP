const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Trigger when badges document is updated - detects newly earned badges
exports.onBadgeEarned = functions.firestore
  .document('badges/{userId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // Get badges arrays (handle both old format with strings and new format with objects)
    const beforeBadges = beforeData?.badges || [];
    const afterBadges = afterData?.badges || [];

    // Extract badge types/names for comparison
    const beforeBadgeTypes = beforeBadges.map(b => typeof b === 'string' ? b : b.type || b.name);
    const afterBadgeTypes = afterBadges.map(b => typeof b === 'string' ? b : b.type || b.name);

    // Find newly earned badges
    const newBadges = afterBadgeTypes.filter(badge => !beforeBadgeTypes.includes(badge));

    // If no new badges, return early
    if (newBadges.length === 0) {
      return null;
    }

    try {
      // Get user data for notifications
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        functions.logger.warn(`User ${userId} not found for badge notification`);
        return null;
      }

      const userData = userDoc.data();

      // Create in-app notification for each new badge
      for (const badgeType of newBadges) {
        // Get badge details (name, icon, etc.)
        const badgeDetails = afterBadges.find(b => {
          const type = typeof b === 'string' ? b : b.type || b.name;
          return type === badgeType;
        });

        const badgeName = typeof badgeDetails === 'string' 
          ? badgeType 
          : badgeDetails?.name || badgeDetails?.type || badgeType;
        
        const badgeIcon = typeof badgeDetails === 'object' && badgeDetails?.icon 
          ? badgeDetails.icon 
          : '🏆';

        await db.collection('notifications').add({
          userId: userId,
          type: 'badge_earned',
          title: `🎉 New Badge Earned!`,
          body: `You earned the ${badgeIcon} ${badgeName} badge!`,
          data: {
            badgeType: badgeType,
            badgeName: badgeName,
            badgeIcon: badgeIcon,
          },
          read: false,
          createdAt: admin.firestore.Timestamp.now(),
        });

        // Send push notification if enabled
        if (userData.fcmToken && userData.notificationsEnabled !== false) {
          try {
            await admin.messaging().send({
              notification: {
                title: `🎉 New Badge Earned!`,
                body: `You earned the ${badgeIcon} ${badgeName} badge!`,
              },
              data: {
                type: 'badge_earned',
                badgeType: badgeType,
                badgeName: badgeName,
              },
              token: userData.fcmToken,
            });
          } catch (pushError) {
            functions.logger.error(`Failed to send push notification for badge ${badgeType}:`, pushError);
            // Don't throw - badge notification should still succeed
          }
        }
      }

      functions.logger.info(`Badge notifications sent for user ${userId}: ${newBadges.join(', ')}`);
      return { success: true, newBadges };

    } catch (error) {
      functions.logger.error(`Error processing badge notifications for user ${userId}:`, error);
      // Don't throw - badge update should still succeed even if notification fails
      return null;
    }
  });
