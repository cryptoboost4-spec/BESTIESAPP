const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Firestore trigger: When a post is created, denormalize bestieUserIds
 * This allows Firestore security rules to check permissions without expensive get() calls
 */
exports.onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const postId = context.params.postId;

    try {
      // If bestieUserIds already exists, skip (already denormalized)
      if (post.bestieUserIds) {
        return null;
      }

      // Get user document to fetch bestieUserIds
      const userDoc = await db.collection('users').doc(post.userId).get();
      if (!userDoc.exists) {
        functions.logger.warn(`User ${post.userId} not found for post ${postId}`);
        return null;
      }

      const userData = userDoc.data();
      const bestieUserIds = userData.bestieUserIds || {};

      // Update post with denormalized bestieUserIds
      // This allows security rules to check permissions without expensive get() calls
      await snap.ref.update({
        bestieUserIds: bestieUserIds,
      });

      functions.logger.debug(`Denormalized bestieUserIds for post ${postId}`);
    } catch (error) {
      functions.logger.error(`Error in onPostCreated for ${postId}:`, error);
      // Don't throw - allow post to be created even if denormalization fails
    }

    return null;
  });

