const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Scheduled function to mark expired challenges
 * Runs daily to clean up expired challenges
 */
async function expireChallenges() {
  try {
    functions.logger.info('Starting challenge expiration check...');

    const now = admin.firestore.Timestamp.now();

    // Find all active or invited challenges that have expired
    const expiredQuery = await db.collection('bestie_challenges')
      .where('status', 'in', ['active', 'invited'])
      .where('expiresAt', '<', now)
      .limit(500)
      .get();

    if (expiredQuery.empty) {
      functions.logger.info('No expired challenges found');
      return { expired: 0 };
    }

    const updatePromises = [];
    expiredQuery.forEach((doc) => {
      updatePromises.push(
        doc.ref.update({
          status: 'expired'
        }).catch(error => {
          functions.logger.error(`Error expiring challenge ${doc.id}:`, error);
        })
      );
    });

    await Promise.all(updatePromises);

    functions.logger.info(`Expired ${expiredQuery.size} challenges`);
    return { expired: expiredQuery.size };
  } catch (error) {
    functions.logger.error('Error in expireChallenges:', error);
    throw error;
  }
}

module.exports = expireChallenges;

