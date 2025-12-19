const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Update challenge progress when user completes an action
 * Called from onCheckInCreated, onCircleCheckInCreated, onMessageCreated
 * 
 * @param {string} userId - User who completed the action
 * @param {string} metric - Type of action: 'safety_checkins' | 'circle_checkins' | 'messages_exchanged'
 */
async function updateChallengeProgress(userId, metric) {
  try {
    // Find all active challenges involving this user
    const challengesQuery1 = db.collection('bestie_challenges')
      .where('user1Id', '==', userId)
      .where('status', '==', 'active');
    
    const challengesQuery2 = db.collection('bestie_challenges')
      .where('user2Id', '==', userId)
      .where('status', '==', 'active');

    const [snapshot1, snapshot2] = await Promise.all([
      challengesQuery1.get(),
      challengesQuery2.get()
    ]);

    const allChallenges = [];
    snapshot1.forEach(doc => allChallenges.push({ id: doc.id, ...doc.data() }));
    snapshot2.forEach(doc => allChallenges.push({ id: doc.id, ...doc.data() }));

    const now = admin.firestore.Timestamp.now();

    // Filter challenges that match this metric and haven't expired
    const relevantChallenges = allChallenges.filter(challenge => {
      if (challenge.metric !== metric) return false;
      if (challenge.expiresAt && challenge.expiresAt.toMillis() < now.toMillis()) {
        return false; // Expired
      }
      return true;
    });

    // Update progress for each relevant challenge
    for (const challenge of relevantChallenges) {
      const isUser1 = challenge.user1Id === userId;
      const progressField = isUser1 ? 'user1Progress' : 'user2Progress';
      const newProgress = (challenge[progressField] || 0) + 1;

      const updateData = {
        [progressField]: newProgress
      };

      // Check if challenge is complete (both users reached target)
      const user1Progress = isUser1 ? newProgress : (challenge.user1Progress || 0);
      const user2Progress = isUser1 ? (challenge.user2Progress || 0) : newProgress;

      if (user1Progress >= challenge.target && user2Progress >= challenge.target) {
        // Challenge complete!
        updateData.status = 'completed';
        updateData.completedAt = now;

        // Award points and badges (handled by onChallengeCompleted trigger)
      }

      await db.collection('bestie_challenges').doc(challenge.id).update(updateData);
    }

    return { updated: relevantChallenges.length };
  } catch (error) {
    functions.logger.error('Error updating challenge progress:', error);
    throw error;
  }
}

module.exports = { updateChallengeProgress };

