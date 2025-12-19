const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Cloud Function: Update challenge progress when check-in is created
 * Triggers on: checkins/{checkInId} onCreate
 * Updates: bestie_challenges progress fields
 */
exports.updateChallengeProgressOnCheckIn = functions.firestore
    .document('checkins/{checkInId}')
    .onCreate(async (snap, context) => {
        const checkIn = snap.data();
        const userId = checkIn.userId;

        try {
            // Find active challenges for this user with safety_checkins metric
            const challengesSnapshot = await admin.firestore()
                .collection('bestie_challenges')
                .where('status', '==', 'active')
                .where('metric', '==', 'safety_checkins')
                .get();

            const updatePromises = [];

            challengesSnapshot.forEach(challengeDoc => {
                const challenge = challengeDoc.data();

                // Check if user is participant
                if (challenge.user1Id === userId) {
                    const newProgress = (challenge.user1Progress || 0) + 1;
                    updatePromises.push(
                        challengeDoc.ref.update({
                            user1Progress: newProgress
                        })
                    );

                    // Check if both completed
                    if (newProgress >= challenge.target && (challenge.user2Progress || 0) >= challenge.target) {
                        updatePromises.push(
                            challengeDoc.ref.update({
                                status: 'completed',
                                completedAt: admin.firestore.FieldValue.serverTimestamp()
                            })
                        );
                    }
                } else if (challenge.user2Id === userId) {
                    const newProgress = (challenge.user2Progress || 0) + 1;
                    updatePromises.push(
                        challengeDoc.ref.update({
                            user2Progress: newProgress
                        })
                    );

                    // Check if both completed
                    if (newProgress >= challenge.target && (challenge.user1Progress || 0) >= challenge.target) {
                        updatePromises.push(
                            challengeDoc.ref.update({
                                status: 'completed',
                                completedAt: admin.firestore.FieldValue.serverTimestamp()
                            })
                        );
                    }
                }
            });

            await Promise.all(updatePromises);
            console.log(`Updated ${updatePromises.length} challenge progress records`);
        } catch (error) {
            console.error('Error updating challenge progress:', error);
        }
    });

/**
 * Cloud Function: Update challenge progress when circle check-in is created
 * Triggers on: circle_checkins/{checkInId} onCreate
 * Updates: bestie_challenges progress fields
 */
exports.updateChallengeProgressOnCircleCheckIn = functions.firestore
    .document('circle_checkins/{checkInId}')
    .onCreate(async (snap, context) => {
        const checkIn = snap.data();
        const userId = checkIn.userId;

        try {
            // Find active challenges for this user with circle_checkins metric
            const challengesSnapshot = await admin.firestore()
                .collection('bestie_challenges')
                .where('status', '==', 'active')
                .where('metric', '==', 'circle_checkins')
                .get();

            const updatePromises = [];

            challengesSnapshot.forEach(challengeDoc => {
                const challenge = challengeDoc.data();

                // Check if user is participant
                if (challenge.user1Id === userId) {
                    const newProgress = (challenge.user1Progress || 0) + 1;
                    updatePromises.push(
                        challengeDoc.ref.update({
                            user1Progress: newProgress
                        })
                    );

                    // Check if both completed
                    if (newProgress >= challenge.target && (challenge.user2Progress || 0) >= challenge.target) {
                        updatePromises.push(
                            challengeDoc.ref.update({
                                status: 'completed',
                                completedAt: admin.firestore.FieldValue.serverTimestamp()
                            })
                        );
                    }
                } else if (challenge.user2Id === userId) {
                    const newProgress = (challenge.user2Progress || 0) + 1;
                    updatePromises.push(
                        challengeDoc.ref.update({
                            user2Progress: newProgress
                        })
                    );

                    // Check if both completed
                    if (newProgress >= challenge.target && (challenge.user1Progress || 0) >= challenge.target) {
                        updatePromises.push(
                            challengeDoc.ref.update({
                                status: 'completed',
                                completedAt: admin.firestore.FieldValue.serverTimestamp()
                            })
                        );
                    }
                }
            });

            await Promise.all(updatePromises);
            console.log(`Updated ${updatePromises.length} challenge progress records`);
        } catch (error) {
            console.error('Error updating challenge progress:', error);
        }
    });

/**
 * Cloud Function: Update challenge progress when message is sent
 * Triggers on: bestie_messages/{messageId} onCreate
 * Updates: bestie_challenges progress fields
 */
exports.updateChallengeProgressOnMessage = functions.firestore
    .document('bestie_messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const senderId = message.senderId;
        const recipientId = message.recipientId;

        try {
            // Find active challenges between these two users with messages_exchanged metric
            const challengesSnapshot = await admin.firestore()
                .collection('bestie_challenges')
                .where('status', '==', 'active')
                .where('metric', '==', 'messages_exchanged')
                .get();

            const updatePromises = [];

            challengesSnapshot.forEach(challengeDoc => {
                const challenge = challengeDoc.data();

                // Check if message is between challenge participants
                const isUser1Sender = challenge.user1Id === senderId && challenge.user2Id === recipientId;
                const isUser2Sender = challenge.user2Id === senderId && challenge.user1Id === recipientId;

                if (isUser1Sender || isUser2Sender) {
                    // Increment both users' progress (mutual exchange)
                    const newUser1Progress = (challenge.user1Progress || 0) + 1;
                    const newUser2Progress = (challenge.user2Progress || 0) + 1;

                    updatePromises.push(
                        challengeDoc.ref.update({
                            user1Progress: newUser1Progress,
                            user2Progress: newUser2Progress
                        })
                    );

                    // Check if both completed
                    if (newUser1Progress >= challenge.target && newUser2Progress >= challenge.target) {
                        updatePromises.push(
                            challengeDoc.ref.update({
                                status: 'completed',
                                completedAt: admin.firestore.FieldValue.serverTimestamp()
                            })
                        );
                    }
                }
            });

            await Promise.all(updatePromises);
            console.log(`Updated ${updatePromises.length} challenge progress records`);
        } catch (error) {
            console.error('Error updating challenge progress:', error);
        }
    });

/**
 * Cloud Function: Update safety pact honor tracking when check-in is created
 * Triggers on: checkins/{checkInId} onCreate
 * Updates: safety_pacts lastHonoredAt and totalCheckInsUnderPact
 */
exports.updatePactHonorOnCheckIn = functions.firestore
    .document('checkins/{checkInId}')
    .onCreate(async (snap, context) => {
        const checkIn = snap.data();
        const userId = checkIn.userId;

        try {
            // Find active safety pacts for this user
            const pactsSnapshot = await admin.firestore()
                .collection('safety_pacts')
                .where('status', '==', 'active')
                .get();

            const updatePromises = [];

            pactsSnapshot.forEach(pactDoc => {
                const pact = pactDoc.data();

                // Check if user is participant
                if (pact.user1Id === userId || pact.user2Id === userId) {
                    updatePromises.push(
                        pactDoc.ref.update({
                            lastHonoredAt: admin.firestore.FieldValue.serverTimestamp(),
                            lastHonoredBy: userId,
                            totalCheckInsUnderPact: admin.firestore.FieldValue.increment(1)
                        })
                    );
                }
            });

            await Promise.all(updatePromises);
            console.log(`Updated ${updatePromises.length} safety pact records`);
        } catch (error) {
            console.error('Error updating safety pact:', error);
        }
    });
