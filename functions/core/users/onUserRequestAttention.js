const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Firestore trigger: When a user's requestAttention field is updated to active,
 * create notifications for all their besties
 */
exports.onUserRequestAttention = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // Check if requestAttention was just activated
    const beforeRequest = beforeData?.requestAttention;
    const afterRequest = afterData?.requestAttention;

    // Only proceed if requestAttention was just activated (wasn't active before, is active now)
    if (
      !afterRequest?.active ||
      (beforeRequest?.active === true && afterRequest?.active === true)
    ) {
      return null; // Not a new activation, skip
    }

    try {
      const userData = afterData;
      const userName = userData.displayName || 'A bestie';
      const bestieUserIds = userData.bestieUserIds || [];

      if (!bestieUserIds || (Array.isArray(bestieUserIds) && bestieUserIds.length === 0)) {
        functions.logger.info(`User ${userId} has no besties, skipping notification`);
        return null;
      }

      // Handle both array and object formats for bestieUserIds
      const bestieIdsArray = Array.isArray(bestieUserIds) 
        ? bestieUserIds 
        : Object.keys(bestieUserIds).filter(id => bestieUserIds[id] === true);

      if (bestieIdsArray.length === 0) {
        functions.logger.info(`User ${userId} has no besties, skipping notification`);
        return null;
      }

      // Batch fetch all bestie documents (max 100 per batch)
      const BATCH_SIZE = 100;
      const allBestieDocs = [];
      
      for (let i = 0; i < bestieIdsArray.length; i += BATCH_SIZE) {
        const batch = bestieIdsArray.slice(i, i + BATCH_SIZE);
        const bestieDocRefs = batch.map(id => db.collection('users').doc(id));
        const bestieDocs = await db.getAll(...bestieDocRefs);
        allBestieDocs.push(...bestieDocs);
      }

      // Create notifications for each bestie
      const notificationPromises = allBestieDocs
        .filter(doc => doc.exists)
        .map(async (bestieDoc) => {
          const bestieId = bestieDoc.id;
          
          try {
            await db.collection('notifications').add({
              userId: bestieId,
              type: 'request_attention',
              title: 'Someone Needs You',
              message: `${userName} is requesting your attention`,
              read: false,
              createdAt: admin.firestore.Timestamp.now(),
              bestieName: userName,
              bestieId: userId,
              tag: afterRequest.tag || null,
            });

            functions.logger.info(`Created request attention notification for ${bestieId}`);
          } catch (error) {
            functions.logger.error(`Error creating notification for ${bestieId}:`, error);
            // Continue with other besties even if one fails
          }
        });

      await Promise.all(notificationPromises);
      functions.logger.info(`Request attention notifications sent for user ${userId} to ${allBestieDocs.length} besties`);

      return null;
    } catch (error) {
      functions.logger.error(`Error in onUserRequestAttention for ${userId}:`, error);
      // Don't throw - allow the update to succeed even if notifications fail
      return null;
    }
  });
