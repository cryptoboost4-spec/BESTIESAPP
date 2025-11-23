const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track check-in reactions
exports.trackCheckInReaction = functions.firestore
  .document('checkins/{checkInId}/reactions/{reactionId}')
  .onCreate(async (snap, context) => {
    const reaction = snap.data();
    const checkInId = context.params.checkInId;

    // Get check-in to find owner
    const checkInDoc = await db.collection('checkins').doc(checkInId).get();
    if (!checkInDoc.exists) return null;

    const checkInData = checkInDoc.data();
    const checkInOwnerId = checkInData.userId;
    const reactorId = reaction.userId;

    // Don't track if reacting to own check-in
    if (checkInOwnerId === reactorId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: checkInOwnerId,
      bestieId: reactorId,
      type: 'checkin_reaction',
      checkInId: checkInId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked check-in reaction: ${reactorId} → ${checkInOwnerId}`);
    return null;
  });
