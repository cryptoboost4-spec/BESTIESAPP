const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track comments on check-ins
exports.trackCheckInComment = functions.firestore
  .document('checkins/{checkInId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const checkInId = context.params.checkInId;

    // Get check-in to find owner
    const checkInDoc = await db.collection('checkins').doc(checkInId).get();
    if (!checkInDoc.exists) return null;

    const checkInData = checkInDoc.data();
    const checkInOwnerId = checkInData.userId;
    const commenterId = comment.userId;

    // Don't track if commenting on own check-in
    if (checkInOwnerId === commenterId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: checkInOwnerId,
      bestieId: commenterId,
      type: 'checkin_comment',
      checkInId: checkInId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    functions.logger.debug(`Tracked check-in comment: ${commenterId} → ${checkInOwnerId}`);
    return null;
  });
