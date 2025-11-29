const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track interactions for connection strength calculations
// Triggered when posts/check-ins reactions and comments are created
exports.trackReaction = functions.firestore
  .document('posts/{postId}/reactions/{reactionId}')
  .onCreate(async (snap, context) => {
    const reaction = snap.data();
    const postId = context.params.postId;

    // Get post to find owner
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    const reactorId = reaction.userId;

    // Don't track if reacting to own post
    if (postOwnerId === reactorId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: postOwnerId,
      bestieId: reactorId,
      type: 'post_reaction',
      postId: postId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    functions.logger.debug(`Tracked reaction interaction: ${reactorId} → ${postOwnerId}`);
    return null;
  });
