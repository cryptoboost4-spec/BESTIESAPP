const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track comments on posts
exports.trackPostComment = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const postId = context.params.postId;

    // Get post to find owner
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    const commenterId = comment.userId;

    // Don't track if commenting on own post
    if (postOwnerId === commenterId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: postOwnerId,
      bestieId: commenterId,
      type: 'post_comment',
      postId: postId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked comment interaction: ${commenterId} → ${postOwnerId}`);
    return null;
  });
